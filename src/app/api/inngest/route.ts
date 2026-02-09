import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
    generateTriageReport,
    runFullAnalysis,
    handleReportGenerated,
    processScanUpload,
} from "@/inngest/functions";

/**
 * Inngest API Route
 * 
 * Exposes AI agent workflows to the Inngest platform.
 * 
 * Workflows:
 * 1. Doctor clicks "Start Triage" -> generateTriageReport
 * 2. Scan uploaded -> processScanUpload (auto-analysis)
 * 3. Manual re-analysis request -> runFullAnalysis
 */
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        generateTriageReport,    // Triage workflow with full multi-agent analysis (triggered by doctor)
        processScanUpload,       // Auto-analyze scans on upload
        runFullAnalysis,         // Full analysis that can be triggered manually
        handleReportGenerated,   // Post-processing for generated reports
    ],
});
