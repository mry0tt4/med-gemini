/**
 * Multi-Agent Medical Analysis System - Type Definitions
 * 
 * This system uses a workforce of specialized AI agents:
 * - Orchestrator Agent (Gemini 3 Pro): Coordinates all agents and compiles final reports
 * - Medical Scan Agent (GPT-5 Mini): Analyzes medical images with vision capabilities
 * - Clinical History Agent (Gemini 3 Flash): Analyzes patient history and context
 * - Diagnosis Agent (Gemini 3 Pro): Generates comprehensive diagnoses
 * - Coding Agent (Gemini 3 Flash): Generates ICD-10/CPT codes
 * 
 * Data models are EHR/FHIR compliant for interoperability.
 */

// ============================================================================
// Patient Context Types (EHR/FHIR Compliant)
// ============================================================================

// Patient context for analysis
export interface PatientContext {
    id: string;
    name: string;
    age: number;
    gender: string;
    dateOfBirth: string;

    // Contact information
    phone?: string | null;
    email?: string | null;
    address?: string | null;

    // Identifiers
    mrn?: string | null;

    // AI-generated summary
    medicalHistorySummary: string | null;

    // Related data
    encounters: EncounterContext[];
    medicalHistory: MedicalHistoryContext[];
    medications: MedicationContext[];
    externalReports: ExternalReportContext[];

    // Current presentation
    currentSymptoms: string;
    voiceTranscript?: string;
}

// Medical History (FHIR Condition)
export interface MedicalHistoryContext {
    id: string;
    type: string; // condition | allergy | surgery | family_history | social_history | immunization
    clinicalStatus: string; // active | recurrence | inactive | remission | resolved
    description: string;
    onsetDate?: string | null;
    abatementDate?: string | null;
    severity?: string | null; // mild | moderate | severe
    icd10Code?: string | null;
    snomedCode?: string | null;
    notes?: string | null;
}

// Medication (FHIR MedicationStatement)
export interface MedicationContext {
    id: string;
    name: string;
    genericName?: string | null;
    rxNormCode?: string | null;
    dosage?: string | null;
    frequency?: string | null;
    route?: string | null;
    status: string; // active | completed | stopped | on-hold
    startDate?: string | null;
    endDate?: string | null;
    prescribedBy?: string | null;
    reason?: string | null;
    notes?: string | null;
}

// External Report (FHIR DiagnosticReport)
export interface ExternalReportContext {
    id: string;
    type: string; // lab | pathology | radiology | cardiology | other
    title: string;
    description?: string | null;
    reportDate: string;
    providerName?: string | null;
    fileUrl?: string | null;
    findings?: string | null;
    conclusion?: string | null;
    extractedData?: Record<string, unknown> | null;
}

export interface EncounterContext {
    id: string;
    encounterType: string; // ambulatory | emergency | inpatient | virtual
    symptoms: string;
    chiefComplaint?: string | null;
    voiceTranscript: string | null;
    vitalSigns?: VitalSigns | null;
    createdAt: string;
    scans: ScanContext[];
    triageReport?: TriageReportContext | null;
}

export interface VitalSigns {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
}

export interface ScanContext {
    id: string;
    type: string; // X-RAY, MRI, CT, DERM, ULTRASOUND
    modality?: string; // DICOM modality code
    bodyPart?: string | null;
    fileUrl: string;
    previewUrl?: string | null;
    fileFormat: string; // dicom | image
    analysis: string | null;
    studyInstanceUid?: string | null;
    studyDescription?: string | null;
    createdAt: string;
}

export interface TriageReportContext {
    id: string;
    summary: string;
    urgencyLevel: string;
    recommendedAction: string;
    confidenceScore: number | null;
}

// ============================================================================
// Agent Output Types
// ============================================================================

export interface ScanAnalysisResult {
    scanId: string;
    scanType: string;
    modality?: string;
    bodyPart?: string;
    findings: string;
    abnormalities: string[];
    severity: "NORMAL" | "MILD" | "MODERATE" | "SEVERE";
    confidence: number;
    recommendations: string[];
    rawAnalysis: string;
}

export interface ClinicalHistoryAnalysis {
    patientId: string;
    riskFactors: string[];
    relevantConditions: string[];
    medicationInteractions: string[];
    contraindications: string[];
    contextSummary: string;
    ageRelatedConsiderations: string[];
    genderSpecificFactors: string[];
    // New: Data from external reports
    relevantLabFindings: string[];
    reportInsights: string[];
    // New: Previous triage trend analysis
    previousTriageAnalysis?: string | null;
}

export interface DiagnosisResult {
    primaryDiagnosis: string;
    differentialDiagnoses: string[];
    confidence: number;
    reasoning: string;
    urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    recommendedActions: string[];
    followUpRecommendations: string[];
    redFlags: string[];
}

export interface CodingResult {
    icd10Codes: ICD10Code[];
    cptCodes: CPTCode[];
    confidence: number;
}

export interface ICD10Code {
    code: string;
    description: string;
    isPrimary: boolean;
}

export interface CPTCode {
    code: string;
    description: string;
    units?: number;
}

// ============================================================================
// Final Orchestrated Report
// ============================================================================

export interface OrchestratedMedicalReport {
    reportId: string;
    patientId: string;
    encounterId: string;
    generatedAt: string;

    // Patient Summary
    patientSummary: {
        name: string;
        age: number;
        gender: string;
        presentingSymptoms: string;
        activeMedications: string[];
        relevantHistory: string[];
    };

    // Clinical History Analysis
    clinicalHistory: ClinicalHistoryAnalysis;

    // Scan Analyses
    scanAnalyses: ScanAnalysisResult[];

    // Diagnosis
    diagnosis: DiagnosisResult;

    // Coding
    coding: CodingResult;

    // Executive Summary
    executiveSummary: string;

    // Overall Assessment
    overallUrgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    overallConfidence: number;

    // Reasoning Chain (for doctor review)
    reasoningChain: string;

    // Metadata
    agentsUsed: string[];
    processingTimeMs: number;
}

// ============================================================================
// Event Types for Inngest
// ============================================================================

export interface AnalysisRequestEvent {
    encounterId: string;
    patientId: string;
    symptoms: string;
    voiceTranscript?: string;
    scanIds?: string[];
}

export interface ScanAnalysisRequestEvent {
    scanId: string;
    encounterId: string;
    patientId: string;
    scanType: string;
    fileUrl: string;
    bodyPart?: string;
    notes?: string;
}

export interface FullAnalysisRequestEvent {
    encounterId: string;
    patientId: string;
    triggerType: "TRIAGE" | "SCAN_UPLOAD" | "MANUAL";
}
