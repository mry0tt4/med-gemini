/**
 * Inngest Functions - Multi-Agent Medical Analysis Workflows
 * 
 * These functions orchestrate the AI agents workforce through Inngest's
 * durable workflow system, ensuring reliable execution with retries,
 * step-based processing, and event-driven coordination.
 * 
 * Workflows:
 * - Triage Analysis: Triggered when doctor clicks "Start Triage"
 * - Scan Analysis: Triggered on scan upload for immediate AI analysis
 */

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import {
    orchestrateFullAnalysis,
    formatCodesForDisplay,
    analyzeSingleScan,
} from "@/lib/ai/agents";

/**
 * Workflow 1: Full Triage Analysis
 * 
 * Triggered when the doctor clicks "Start Triage".
 * Uses saved scan analyses during triage (doesn't re-analyze).
 * 
 * Agents used:
 * - Orchestrator Agent (Gemini 3 Pro) - Coordinates all agents
 * - Clinical History Agent (Gemini 3 Pro) - Analyzes history + previous triage comparisons
 * - Medical Scan Agent (GPT-4o) - Uses saved scan analyses
 * - Diagnosis Agent (Gemini 3 Pro) - Generates diagnosis
 * - Coding Agent (Gemini 3 Flash) - Generates ICD-10/CPT codes
 */
export const generateTriageReport = inngest.createFunction(
    {
        id: "generate-triage-report",
        retries: 2,
    },
    { event: "triage.requested" },
    async ({ event, step }) => {
        const { encounterId, patientId, symptoms, voiceTranscript, analyzeScans, generateCodes, triageReportId, scanIds } = event.data;

        console.log(`[Inngest] Starting triage analysis for encounter ${encounterId}`);

        // Step 1: Create/update the encounter with symptoms
        await step.run("update-encounter", async () => {
            await prisma.encounter.update({
                where: { id: encounterId },
                data: {
                    symptoms,
                    voiceTranscript: voiceTranscript || null,
                },
            });
            return { success: true };
        });

        // Step 2: Run the full multi-agent analysis
        // This is where all AI agents are invoked
        const report = await step.run("orchestrate-analysis", async () => {
            return await orchestrateFullAnalysis(encounterId, patientId, {
                analyzeScans: analyzeScans !== false,
                scanIds: scanIds,
                generateCodes: generateCodes !== false,
                updatePatientHistory: true,
            });
        });

        // Step 3: Save the triage report to database (update if exists)
        const savedReport = await step.run("save-report", async () => {
            const { icd10Display, cptDisplay } = formatCodesForDisplay(report.coding);

            if (triageReportId) {
                // Update the specifically requested report (created in API)
                console.log(`[Inngest] Updating specific triage report: ${triageReportId}`);
                return await prisma.triageReport.update({
                    where: { id: triageReportId },
                    data: {
                        summary: report.executiveSummary,
                        urgencyLevel: report.overallUrgency,
                        recommendedAction: report.diagnosis.recommendedActions.map(action => `- ${action}`).join("\n"),
                        reasoningChain: report.reasoningChain,
                        confidenceScore: report.overallConfidence,
                        suggestedICD10: icd10Display,
                        suggestedCPT: cptDisplay,
                        status: "DRAFT", // Or FINALIZED depending on flow
                    },
                });
            }

            // Fallback: Check for existing draft report for this encounter
            const existingReport = await prisma.triageReport.findFirst({
                where: {
                    encounterId,
                    status: "DRAFT"
                },
                orderBy: { createdAt: "desc" },
            });

            if (existingReport) {
                // Update existing draft instead of creating duplicate
                return await prisma.triageReport.update({
                    where: { id: existingReport.id },
                    data: {
                        summary: report.executiveSummary,
                        urgencyLevel: report.overallUrgency,
                        recommendedAction: report.diagnosis.recommendedActions.map(action => `- ${action}`).join("\n"),
                        reasoningChain: report.reasoningChain,
                        confidenceScore: report.overallConfidence,
                        suggestedICD10: icd10Display,
                        suggestedCPT: cptDisplay,
                    },
                });
            }

            return await prisma.triageReport.create({
                data: {
                    encounterId,
                    summary: report.executiveSummary,
                    urgencyLevel: report.overallUrgency,
                    recommendedAction: report.diagnosis.recommendedActions.map(action => `- ${action}`).join("\n"),
                    reasoningChain: report.reasoningChain,
                    confidenceScore: report.overallConfidence,
                    suggestedICD10: icd10Display,
                    suggestedCPT: cptDisplay,
                    status: "DRAFT",
                },
            });
        });

        // Step 4: Emit report generated event for downstream processing
        await step.sendEvent("emit-report-generated", {
            name: "report.generated",
            data: {
                reportId: savedReport.id,
                encounterId,
                patientId,
                urgencyLevel: report.overallUrgency,
                processingTimeMs: report.processingTimeMs,
            },
        });

        console.log(`[Inngest] Triage analysis complete. Report ID: ${savedReport.id}`);

        return {
            success: true,
            reportId: savedReport.id,
            urgencyLevel: report.overallUrgency,
            confidence: report.overallConfidence,
            agentsUsed: report.agentsUsed,
            processingTimeMs: report.processingTimeMs,
        };
    }
);

/**
 * Workflow 2: Full Analysis Request
 * 
 * Can be triggered manually for re-analysis.
 * Runs the complete multi-agent analysis pipeline.
 */
export const runFullAnalysis = inngest.createFunction(
    {
        id: "run-full-analysis",
        retries: 2,
    },
    { event: "analysis.full.requested" },
    async ({ event, step }) => {
        const { encounterId, patientId, triggerType, includeScans, generateCodes } = event.data;

        console.log(`[Inngest] Running full analysis triggered by ${triggerType}`);

        // Step 1: Check if there's already a recent report
        const existingReport = await step.run("check-existing-report", async () => {
            const recentReport = await prisma.triageReport.findFirst({
                where: {
                    encounterId,
                    createdAt: {
                        gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
                    },
                },
            });
            return recentReport;
        });

        // Skip if very recent report exists (debounce)
        if (existingReport && triggerType !== "MANUAL") {
            console.log(`[Inngest] Recent report exists, skipping analysis`);
            return {
                success: true,
                skipped: true,
                reason: "Recent report already exists",
                existingReportId: existingReport.id,
            };
        }

        // Step 2: Run full orchestrated analysis
        const report = await step.run("orchestrate-full-analysis", async () => {
            return await orchestrateFullAnalysis(encounterId, patientId, {
                analyzeScans: includeScans !== false,
                generateCodes: generateCodes !== false,
                updatePatientHistory: true,
            });
        });

        // Step 3: Update or create triage report
        const savedReport = await step.run("save-or-update-report", async () => {
            const { icd10Display, cptDisplay } = formatCodesForDisplay(report.coding);

            // Check for existing report to update
            const existing = await prisma.triageReport.findFirst({
                where: { encounterId },
                orderBy: { createdAt: "desc" },
            });

            if (existing && existing.status === "DRAFT") {
                // Update existing draft
                return await prisma.triageReport.update({
                    where: { id: existing.id },
                    data: {
                        summary: report.executiveSummary,
                        urgencyLevel: report.overallUrgency,
                        recommendedAction: report.diagnosis.recommendedActions.map(action => `- ${action}`).join("\n"),
                        reasoningChain: report.reasoningChain,
                        confidenceScore: report.overallConfidence,
                        suggestedICD10: icd10Display,
                        suggestedCPT: cptDisplay,
                    },
                });
            } else {
                // Create new report
                return await prisma.triageReport.create({
                    data: {
                        encounterId,
                        summary: report.executiveSummary,
                        urgencyLevel: report.overallUrgency,
                        recommendedAction: report.diagnosis.recommendedActions.map(action => `- ${action}`).join("\n"),
                        reasoningChain: report.reasoningChain,
                        confidenceScore: report.overallConfidence,
                        suggestedICD10: icd10Display,
                        suggestedCPT: cptDisplay,
                        status: "DRAFT",
                    },
                });
            }
        });

        // Step 4: Emit completion event
        await step.sendEvent("emit-report-generated", {
            name: "report.generated",
            data: {
                reportId: savedReport.id,
                encounterId,
                patientId,
                urgencyLevel: report.overallUrgency,
                processingTimeMs: report.processingTimeMs,
            },
        });

        console.log(`[Inngest] Full analysis complete. Report ID: ${savedReport.id}`);

        return {
            success: true,
            reportId: savedReport.id,
            urgencyLevel: report.overallUrgency,
            confidence: report.overallConfidence,
            agentsUsed: report.agentsUsed,
            processingTimeMs: report.processingTimeMs,
        };
    }
);

/**
 * Workflow 3: Report Generated Handler
 * 
 * Handles post-report-generation tasks like notifications.
 * Currently logs completion, can be extended for notifications.
 */
export const handleReportGenerated = inngest.createFunction(
    { id: "handle-report-generated" },
    { event: "report.generated" },
    async ({ event, step }) => {
        const { reportId, encounterId, patientId, urgencyLevel, processingTimeMs } = event.data;

        // Log the completion
        console.log(`[Inngest] Report ${reportId} generated:
  - Encounter: ${encounterId}
  - Patient: ${patientId}
  - Urgency: ${urgencyLevel}
  - Processing Time: ${processingTimeMs}ms`);

        // If critical urgency, this is where you'd send notifications
        if (urgencyLevel === "CRITICAL") {
            await step.run("log-critical-alert", async () => {
                console.warn(`[ALERT] Critical urgency report generated: ${reportId}`);
                // Future: Send push notification, SMS, etc.
                return { alerted: true };
            });
        }

        return {
            success: true,
            reportId,
            urgencyLevel,
            processed: true,
        };
    }
);

/**
 * Workflow 4: Process Scan Upload
 * 
 * Triggered when a scan is uploaded.
 * Performs immediate AI analysis and stores the result for later use in triage.
 */
export const processScanUpload = inngest.createFunction(
    {
        id: "process-scan-upload",
        retries: 2,
    },
    { event: "scan.uploaded" },
    async ({ event, step }) => {
        const { scanId, encounterId, patientId, scanType, fileUrl, previewUrl, bodyPart } = event.data;

        console.log(`[Inngest] Processing uploaded scan ${scanId}`);

        // Step 1: Analyze the scan using the Scan Agent
        const analysis = await step.run("analyze-scan", async () => {
            return await analyzeSingleScan(scanId, encounterId, patientId);
        });

        console.log(`[Inngest] Scan analysis complete for ${scanId}: Severity=${analysis.severity}, Confidence=${analysis.confidence}`);

        return {
            success: true,
            scanId,
            severity: analysis.severity,
            confidence: analysis.confidence,
            findings: analysis.findings.slice(0, 200),
        };
    }
);
