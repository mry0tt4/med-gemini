/**
 * Orchestrator Agent - Gemini 3 Pro
 * 
 * This is the master coordinator that orchestrates all other AI agents.
 * It gathers patient information (including EHR data), delegates to specialized agents,
 * and compiles the final comprehensive medical report.
 * 
 * IMPORTANT: AI analysis is ONLY triggered when the doctor clicks "Start Triage".
 * Scans, reports, and other data are stored without automatic analysis.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { generateViewUrl, extractFileKey } from "@/lib/aws/s3";
import {
    OrchestratedMedicalReport,
    PatientContext,
    ScanAnalysisResult,
    ClinicalHistoryAnalysis,
    DiagnosisResult,
    CodingResult,
} from "./types";
import { analyzeScanWithVision, analyzeMultipleScans } from "./scan-agent";
import { analyzePatientHistory, generateLongitudinalSummary } from "./history-agent";
import { generateDiagnosis, calculateOverallUrgency } from "./diagnosis-agent";
import { generateMedicalCodes } from "./coding-agent";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }
    return age;
}

/**
 * Gather complete patient context from database
 * Includes EHR-compliant data: medical history, medications, and external reports
 */
export async function gatherPatientContext(
    patientId: string,
    currentEncounterId?: string,
    currentSymptoms?: string
): Promise<PatientContext> {
    const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
            encounters: {
                orderBy: { createdAt: "desc" },
                take: 10, // Last 10 encounters for context
                include: {
                    scans: true,
                    triageReports: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            },
            // Include EHR data
            medicalHistory: {
                orderBy: { createdAt: "desc" },
            },
            medications: {
                orderBy: [
                    { status: "asc" }, // Active first
                    { createdAt: "desc" },
                ],
            },
            externalReports: {
                orderBy: { reportDate: "desc" },
                take: 20, // Most recent 20 reports
            },
        },
    });

    if (!patient) {
        throw new Error(`Patient not found: ${patientId}`);
    }

    // Derive types from the Prisma query result
    type PatientEnc = typeof patient.encounters[number];
    type PatientScan = PatientEnc["scans"][number];
    type PatientHistory = typeof patient.medicalHistory[number];
    type PatientMed = typeof patient.medications[number];
    type PatientReport = typeof patient.externalReports[number];

    // Find current encounter if specified
    const currentEncounter = currentEncounterId
        ? patient.encounters.find((e: PatientEnc) => e.id === currentEncounterId)
        : patient.encounters[0];

    return {
        id: patient.id,
        name: patient.name,
        age: calculateAge(patient.dateOfBirth),
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth.toISOString(),
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        mrn: patient.mrn,
        medicalHistorySummary: patient.medicalHistorySummary,

        // Map encounters with full context
        encounters: patient.encounters.map((enc: PatientEnc) => ({
            id: enc.id,
            encounterType: enc.encounterType,
            symptoms: enc.symptoms,
            chiefComplaint: enc.chiefComplaint,
            voiceTranscript: enc.voiceTranscript,
            vitalSigns: enc.vitalSigns as Record<string, unknown> | null,
            createdAt: enc.createdAt.toISOString(),
            scans: enc.scans.map((scan: PatientScan) => ({
                id: scan.id,
                type: scan.type,
                modality: scan.modality || undefined,
                bodyPart: scan.bodyPart,
                fileUrl: scan.fileUrl,
                previewUrl: (scan as any).previewUrl || undefined,
                fileFormat: scan.fileFormat,
                analysis: scan.analysis,
                studyInstanceUid: scan.studyInstanceUid,
                studyDescription: scan.studyDescription,
                createdAt: scan.createdAt.toISOString(),
            })),
            triageReport: enc.triageReports[0]
                ? {
                    id: enc.triageReports[0].id,
                    summary: enc.triageReports[0].summary,
                    urgencyLevel: enc.triageReports[0].urgencyLevel,
                    recommendedAction: enc.triageReports[0].recommendedAction,
                    confidenceScore: enc.triageReports[0].confidenceScore,
                }
                : null,
        })),

        // Map EHR-compliant medical history
        medicalHistory: patient.medicalHistory.map((h: PatientHistory) => ({
            id: h.id,
            type: h.type,
            clinicalStatus: h.clinicalStatus,
            description: h.description,
            onsetDate: h.onsetDate?.toISOString() || null,
            abatementDate: h.abatementDate?.toISOString() || null,
            severity: h.severity,
            icd10Code: h.icd10Code,
            snomedCode: h.snomedCode,
            notes: h.notes,
        })),

        // Map medications
        medications: patient.medications.map((m: PatientMed) => ({
            id: m.id,
            name: m.name,
            genericName: m.genericName,
            rxNormCode: m.rxNormCode,
            dosage: m.dosage,
            frequency: m.frequency,
            route: m.route,
            status: m.status,
            startDate: m.startDate?.toISOString() || null,
            endDate: m.endDate?.toISOString() || null,
            prescribedBy: m.prescribedBy,
            reason: m.reason,
            notes: m.notes,
        })),

        // Map external reports
        externalReports: patient.externalReports.map((r: PatientReport) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            description: r.description,
            reportDate: r.reportDate.toISOString(),
            providerName: r.providerName,
            fileUrl: r.fileUrl,
            findings: r.findings,
            conclusion: r.conclusion,
            extractedData: r.extractedData as Record<string, unknown> | null,
        })),

        currentSymptoms: currentSymptoms || currentEncounter?.symptoms || "",
        voiceTranscript: currentEncounter?.voiceTranscript || undefined,
    };
}

/**
 * Main orchestration function - coordinates all agents to produce a comprehensive report
 * 
 * This is ONLY called when the doctor clicks "Start Triage" - NOT on scan upload.
 */
export async function orchestrateFullAnalysis(
    encounterId: string,
    patientId: string,
    options: {
        analyzeScans?: boolean;
        scanIds?: string[];
        generateCodes?: boolean;
        updatePatientHistory?: boolean;
    } = {}
): Promise<OrchestratedMedicalReport> {
    const startTime = Date.now();
    const agentsUsed: string[] = [];

    console.log(`[Orchestrator] Starting full analysis for encounter ${encounterId}`);

    // Step 1: Gather all patient context (includes EHR data)
    console.log("[Orchestrator] Step 1: Gathering patient context (including EHR data)...");
    const patientContext = await gatherPatientContext(patientId, encounterId);

    // Find the current encounter
    const currentEncounter = patientContext.encounters.find(e => e.id === encounterId);
    if (!currentEncounter) {
        throw new Error(`Encounter not found: ${encounterId}`);
    }

    // Step 2: Analyze patient history, medications, and reports (Clinical History Agent - Gemini 3 Flash)
    console.log("[Orchestrator] Step 2: Analyzing clinical history, medications, and reports...");
    agentsUsed.push("Clinical History Agent (Gemini 3 Flash)");
    const clinicalHistory = await analyzePatientHistory(patientContext);

    // Step 3: Analyze scans if any (Scan Agent - GPT-5 Mini)
    let scanAnalyses: ScanAnalysisResult[] = [];

    // Determine which scans to analyze
    let scansToAnalyze = currentEncounter.scans;
    if (options.scanIds && options.scanIds.length > 0) {
        console.log(`[Orchestrator] Using ${options.scanIds.length} specific scans for analysis.`);
        // We need to fetch specific scans (they might be from past encounters)
        const specificScans = await prisma.scan.findMany({
            where: {
                id: { in: options.scanIds },
                encounter: { patientId: patientId } // Security check: must belong to patient
            }
        });
        // Map to match the type structure if needed, though Prisma types should align mostly
        // The context type is slightly different from Prisma return, but we extract what we need below
        scansToAnalyze = specificScans as any;
    }

    if (options.analyzeScans !== false && scansToAnalyze.length > 0) {
        console.log(`[Orchestrator] Step 3: Processing ${scansToAnalyze.length} scans...`);
        agentsUsed.push("Medical Scan Agent (GPT-4o)");

        // Check each scan for existing analysis first
        for (const scan of scansToAnalyze) {
            const scanRecord = scan as any;

            if (scanRecord.analysis && scanRecord.analysis.length > 0) {
                // Use saved analysis from automatic upload
                console.log(`[Orchestrator] Using saved analysis for scan ${scan.id}`);
                scanAnalyses.push({
                    scanId: scan.id,
                    scanType: scan.type,
                    bodyPart: scan.bodyPart || undefined,
                    findings: scanRecord.analysis,
                    abnormalities: [],
                    severity: "MODERATE" as const,
                    confidence: 0.8,
                    recommendations: [],
                    rawAnalysis: scanRecord.analysis,
                });
            } else {
                // Need to analyze this scan
                console.log(`[Orchestrator] Analyzing scan ${scan.id} (no saved analysis)...`);
                try {
                    // Get signed URL for the scan
                    let signedUrl = scan.fileUrl;
                    if (scan.fileUrl) {
                        const key = extractFileKey(scan.fileUrl);
                        if (key) {
                            signedUrl = await generateViewUrl(key);
                        }
                    }

                    // Get signed URL for preview if exists
                    let signedPreviewUrl: string | undefined = undefined;
                    if (scanRecord.previewUrl) {
                        const key = extractFileKey(scanRecord.previewUrl);
                        if (key) {
                            signedPreviewUrl = await generateViewUrl(key);
                        }
                    }

                    const analysis = await analyzeScanWithVision(
                        signedUrl,
                        scan.type,
                        scan.bodyPart || undefined,
                        clinicalHistory.contextSummary,
                        signedPreviewUrl
                    );
                    // Set the scanId since analyzeScanWithVision doesn't set it
                    analysis.scanId = scan.id;

                    scanAnalyses.push(analysis);

                    // Save the analysis to the scan record
                    await prisma.scan.update({
                        where: { id: scan.id },
                        data: {
                            analysis: analysis.rawAnalysis,
                            analysisCompletedAt: new Date(),
                        },
                    });
                } catch (error) {
                    console.error(`[Orchestrator] Error analyzing scan ${scan.id}:`, error);
                }
            }
        }
    } else {
        console.log("[Orchestrator] Step 3: No scans to analyze or scan analysis disabled");
    }

    // Step 4: Generate diagnosis (Diagnosis Agent - Gemini 3 Pro)
    console.log("[Orchestrator] Step 4: Generating diagnosis...");
    agentsUsed.push("Diagnosis Agent (Gemini 3 Pro)");
    const diagnosis = await generateDiagnosis(patientContext, clinicalHistory, scanAnalyses);

    // Step 5: Generate medical codes if requested (Coding Agent - Gemini 3 Flash)
    let coding: CodingResult = { icd10Codes: [], cptCodes: [], confidence: 0 };
    if (options.generateCodes !== false) {
        console.log("[Orchestrator] Step 5: Generating medical codes...");
        agentsUsed.push("Coding Agent (Gemini 3 Flash)");
        coding = await generateMedicalCodes(
            diagnosis,
            currentEncounter.scans.map(s => s.type),
            []
        );
    }

    // Step 6: Update patient's longitudinal history if requested
    if (options.updatePatientHistory !== false) {
        console.log("[Orchestrator] Step 6: Updating patient longitudinal history...");
        const updatedSummary = await generateLongitudinalSummary(patientContext);
        await prisma.patient.update({
            where: { id: patientId },
            data: { medicalHistorySummary: updatedSummary },
        });
    }

    // Step 7: Generate executive summary (Orchestrator - Gemini 3 Pro)
    console.log("[Orchestrator] Step 7: Generating executive summary...");
    agentsUsed.push("Orchestrator Agent (Gemini 3 Pro)");
    const executiveSummary = await generateExecutiveSummary(
        patientContext,
        clinicalHistory,
        scanAnalyses,
        diagnosis,
        coding
    );

    // Calculate overall metrics
    const overallUrgency = calculateOverallUrgency(scanAnalyses, diagnosis);
    const scanConfidences = scanAnalyses.map(s => s.confidence);
    const overallConfidence =
        (diagnosis.confidence +
            (scanConfidences.length > 0 ? scanConfidences.reduce((a, b) => a + b, 0) / scanConfidences.length : diagnosis.confidence) +
            coding.confidence) / 3;

    const processingTime = Date.now() - startTime;
    console.log(`[Orchestrator] Analysis complete in ${processingTime}ms`);

    // Compile final report
    const report: OrchestratedMedicalReport = {
        reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
        patientId,
        encounterId,
        generatedAt: new Date().toISOString(),

        patientSummary: {
            name: patientContext.name,
            age: patientContext.age,
            gender: patientContext.gender,
            presentingSymptoms: patientContext.currentSymptoms,
            activeMedications: patientContext.medications
                .filter(m => m.status === "active")
                .map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}`),
            relevantHistory: patientContext.medicalHistory
                .filter(h => h.clinicalStatus === "active")
                .slice(0, 5)
                .map(h => h.description),
        },

        clinicalHistory,
        scanAnalyses,
        diagnosis,
        coding,

        executiveSummary,
        overallUrgency,
        overallConfidence: Math.round(overallConfidence * 100) / 100,

        reasoningChain: generateReasoningChain(clinicalHistory, scanAnalyses, diagnosis),

        agentsUsed,
        processingTimeMs: processingTime,
    };

    return report;
}

/**
 * Generate an executive summary for physicians
 */
async function generateExecutiveSummary(
    patient: PatientContext,
    history: ClinicalHistoryAnalysis,
    scans: ScanAnalysisResult[],
    diagnosis: DiagnosisResult,
    coding: CodingResult
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const scanSummary = scans.length > 0
        ? scans.map(s => `${s.scanType}: ${s.findings.slice(0, 100)}`).join("; ")
        : "No imaging";

    const medsStr = patient.medications
        .filter(m => m.status === "active")
        .slice(0, 5)
        .map(m => m.name)
        .join(", ");

    const labFindings = history.relevantLabFindings?.slice(0, 3).join("; ") || "No recent labs";

    const prompt = `Generate a clinical summary for a physician using Markdown formatting. Make it scannable and efficient to read.

**Patient:** ${patient.name}, ${patient.age}y ${patient.gender}
**Presenting Symptoms:** ${patient.currentSymptoms}
**Key History:** ${history.riskFactors.slice(0, 3).join(", ")}
**Current Medications:** ${medsStr || "None"}
**Recent Lab Findings:** ${labFindings}
**Imaging:** ${scanSummary}
**Primary Diagnosis:** ${diagnosis.primaryDiagnosis}
**Urgency:** ${diagnosis.urgencyLevel}
**Key Actions:** ${diagnosis.recommendedActions.slice(0, 3).join("; ")}
${diagnosis.redFlags.length > 0 ? `**RED FLAGS:** ${diagnosis.redFlags.join(", ")}` : ""}

FORMAT REQUIREMENTS:
1. Start with "**Executive Summary: [Urgency Level] Alert**" if HIGH/CRITICAL, otherwise "**Executive Summary:**"
2. Use "**Patient:**" to introduce the patient info briefly
3. Use "**Primary Impression:**" followed by the main diagnosis in bold
4. Include a brief clinical context paragraph
5. Create a "**Key Clinical Points:**" section with 3-5 bullet points
6. If there are red flags, highlight them with "⚠️ **Warning:**"
7. Use **bold** for critical values, diagnoses, and action items
8. Keep it concise - physicians need to read this quickly`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("[Orchestrator] Error generating executive summary:", error);
        return `**Executive Summary:** **Patient:** ${patient.name}, ${patient.age}y ${patient.gender}\n\n**Primary Impression:** ${diagnosis.primaryDiagnosis}\n\nPatient presenting with ${patient.currentSymptoms}.\n\n**Key Points:**\n- Urgency: **${diagnosis.urgencyLevel}**\n${diagnosis.redFlags.length > 0 ? `- ⚠️ **Red Flags:** ${diagnosis.redFlags.join(", ")}` : "- No red flags identified"}\n- ${diagnosis.recommendedActions[0] || "Further evaluation recommended"}`;
    }
}

/**
 * Generate a reasoning chain document for physician review
 */
function generateReasoningChain(
    history: ClinicalHistoryAnalysis,
    scans: ScanAnalysisResult[],
    diagnosis: DiagnosisResult
): string {
    const sections = [
        "## Clinical Reasoning Chain\n",
        "### 1. Patient History Analysis",
        `Risk factors identified: ${history.riskFactors.join(", ") || "None"}`,
        `Relevant conditions: ${history.relevantConditions.join(", ") || "None"}`,
        `Age considerations: ${history.ageRelatedConsiderations.join("; ")}`,
        `Medication interactions: ${history.medicationInteractions.join(", ") || "None identified"}`,
    ];

    // Add lab findings if available
    if (history.relevantLabFindings && history.relevantLabFindings.length > 0) {
        sections.push("");
        sections.push("### 1.5. Relevant Lab Findings");
        history.relevantLabFindings.forEach(finding => sections.push(`- ${finding}`));
    }

    // Add report insights if available
    if (history.reportInsights && history.reportInsights.length > 0) {
        sections.push("");
        sections.push("### 1.6. External Report Insights");
        history.reportInsights.forEach(insight => sections.push(`- ${insight}`));
    }

    sections.push("");
    sections.push("### 2. Imaging Analysis");

    if (scans.length > 0) {
        scans.forEach((scan, i) => {
            sections.push(`\n**Scan ${i + 1} (${scan.scanType}${scan.bodyPart ? ` - ${scan.bodyPart}` : ""}):**`);
            sections.push(`- Findings: ${scan.findings}`);
            sections.push(`- Severity: ${scan.severity}`);
            sections.push(`- Confidence: ${(scan.confidence * 100).toFixed(0)}%`);
        });
    } else {
        sections.push("No imaging studies performed.");
    }

    sections.push("");
    sections.push("### 3. Diagnostic Reasoning");
    sections.push(diagnosis.reasoning);
    sections.push("");
    sections.push("### 4. Conclusion");
    sections.push(`**Primary Diagnosis:** ${diagnosis.primaryDiagnosis}`);
    sections.push(`**Differential:** ${diagnosis.differentialDiagnoses.join(", ")}`);
    sections.push(`**Urgency Level:** ${diagnosis.urgencyLevel}`);

    if (diagnosis.redFlags.length > 0) {
        sections.push("");
        sections.push("### ⚠️ Red Flags");
        diagnosis.redFlags.forEach((flag) => sections.push(`- ${flag}`));
    }

    return sections.join("\n");
}

/**
 * Analyze a single scan independently
 */
export async function analyzeSingleScan(
    scanId: string,
    encounterId: string,
    patientId: string
): Promise<ScanAnalysisResult> {
    // Get scan details
    const scan = await prisma.scan.findUnique({
        where: { id: scanId },
        include: {
            encounter: {
                include: {
                    patient: true,
                },
            },
        },
    });

    if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
    }

    // Get signed URL for the scan (DICOM or Image)
    const fileKey = extractFileKey(scan.fileUrl);
    let signedUrl = scan.fileUrl;
    if (fileKey) {
        try {
            signedUrl = await generateViewUrl(fileKey);
        } catch (error) {
            console.error("[Orchestrator] Error generating signed URL:", error);
        }
    }

    // Get signed URL for preview if exists
    // @ts-ignore
    const previewUrl = scan.previewUrl;
    let signedPreviewUrl: string | undefined = undefined;

    if (previewUrl) {
        const previewKey = extractFileKey(previewUrl);
        if (previewKey) {
            try {
                signedPreviewUrl = await generateViewUrl(previewKey);
            } catch (error) {
                console.error("[Orchestrator] Error generating signed preview URL:", error);
            }
        }
    }

    // Get patient context for clinical context
    const patient = scan.encounter.patient;
    const clinicalContext = `Patient: ${patient.name}, ${calculateAge(patient.dateOfBirth)}y ${patient.gender}. ${patient.medicalHistorySummary || ""}`;

    // Analyze the scan
    const result = await analyzeScanWithVision(
        signedUrl,
        scan.type,
        scan.bodyPart || undefined,
        clinicalContext,
        signedPreviewUrl
    );

    // Update scan with analysis
    // We save the full JSON result to preserve confidence scores and structure
    await prisma.scan.update({
        where: { id: scanId },
        data: {
            analysis: JSON.stringify(result),
            analysisCompletedAt: new Date(),
        },
    });

    return { ...result, scanId };
}
