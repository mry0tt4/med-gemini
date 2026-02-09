import { EventSchemas } from "inngest";

/**
 * Inngest Event Definitions
 * 
 * Events for AI analysis workflows.
 */

// Triage Request - triggers full AI analysis workflow
// This is the event that triggers AI analysis (when doctor clicks "Start Triage")
type TriageRequested = {
    data: {
        encounterId: string;
        patientId: string;
        symptoms: string;
        voiceTranscript?: string;
        // Options for controlling the analysis
        analyzeScans?: boolean;
        generateCodes?: boolean;
        triageReportId?: string;
        scanIds?: string[];
    };
};

// Full Analysis Request - comprehensive multi-agent analysis
// Used for manual re-analysis or scheduled analysis
type FullAnalysisRequested = {
    data: {
        encounterId: string;
        patientId: string;
        triggerType: "TRIAGE" | "MANUAL";
        includeScans?: boolean;
        generateCodes?: boolean;
    };
};

// Scan Uploaded - triggers AI analysis of the scan on upload
type ScanUploaded = {
    data: {
        scanId: string;
        encounterId: string;
        patientId: string;
        scanType: string;
        fileUrl: string;
        previewUrl?: string;
        bodyPart?: string;
    };
};

// Report Generation Complete - for downstream processing (notifications, etc.)
type ReportGenerated = {
    data: {
        reportId: string;
        encounterId: string;
        patientId: string;
        urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        processingTimeMs: number;
    };
};

export type Events = {
    "triage.requested": TriageRequested;
    "analysis.full.requested": FullAnalysisRequested;
    "scan.uploaded": ScanUploaded;
    "report.generated": ReportGenerated;
};

export const eventSchemas = new EventSchemas().fromRecord<Events>();

