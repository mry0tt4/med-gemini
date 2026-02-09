# Multi-Agent Medical Analysis System

This document describes the AI agents workforce architecture for MedAgent's medical analysis capabilities.

## Architecture Overview

The system uses a **multi-agent architecture** with specialized AI agents coordinated by an orchestrator. 

**IMPORTANT: AI analysis is ONLY triggered when the doctor clicks "Start Triage".**
Scans, reports, and other data are stored without automatic analysis.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                           │
│                    (Gemini 3 Pro)                               │
│  Coordinates all agents, compiles reports, generates summaries │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  SCAN AGENT   │ │ HISTORY AGENT │ │DIAGNOSIS AGENT│ │ CODING AGENT  │
│ (GPT-5 Mini)  │ │(Gemini 3 Pro )│ │(Gemini 3 Pro) │ │(Gemini 3 Flash)│
│               │ │               │ │               │ │               │
│ Analyzes      │ │ Analyzes      │ │ Synthesizes   │ │ Generates     │
│ medical       │ │ patient       │ │ all data to   │ │ ICD-10 and    │
│ images with   │ │ history,      │ │ generate      │ │ CPT codes     │
│ vision AI     │ │ medications,  │ │ diagnoses     │ │ for billing   │
│ (DICOM)       │ │ & reports     │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

## Workflow: When AI Runs

```
1. UPLOAD PHASE (No AI)
   ├── Upload medical scans (DICOM/image)
   ├── Add medical history
   ├── Add current medications
   └── Add external reports (with AI extraction)
   
2. REVIEW PHASE (No AI)
   └── Doctor reviews all patient data

3. TRIAGE PHASE (AI Triggered)
   └── Doctor clicks "Start Triage"
       ↓
       ┌─────────────────────────────────────┐
       │ Inngest: triage.requested event    │
       └─────────────────────────────────────┘
       ↓
       Full Multi-Agent Analysis Begins
```

## Agent Details

### 1. Orchestrator Agent (Gemini 3 Pro)
**Role**: Master coordinator that manages the entire analysis workflow.

**Responsibilities**:
- Gathers complete patient context from the database (EHR data)
- Delegates tasks to specialized agents
- Compiles the final comprehensive medical report
- Generates executive summaries for physicians
- Creates reasoning chains for transparency

**Input**: Patient ID, Encounter ID
**Output**: `OrchestratedMedicalReport`

### 2. Medical Scan Agent (OpenAI GPT-5 Mini)
**Role**: Specialized vision AI for medical image analysis.

**Supported Formats**:
- **DICOM**: Full DICOM metadata support with Study/Series/SOP Instance UIDs
- **Standard Images**: JPEG, PNG, WebP

**Supported Scan Types**:
- X-RAY (DX): Bone structure, soft tissue, cardiac silhouette
- MRI (MR): Tissue contrast, anatomical structures, lesions
- CT: Cross-sectional anatomy, organ morphology
- DERM (XC): Skin lesion analysis with ABCDE criteria
- ULTRASOUND (US): Echogenicity patterns, fluid collections

**Output**: `ScanAnalysisResult` with findings, abnormalities, severity, and recommendations.

### 3. Clinical History Agent (Gemini 3 Flash)
**Role**: Fast analysis of patient medical history using EHR-compliant data.

**Analyzes** (EHR/FHIR Compliant):
- **Medical History**: Conditions, allergies, surgeries, family history
- **Current Medications**: Active medications with dosages and interactions
- **External Reports**: Lab results, pathology, radiology reports
- **Previous Encounters**: Past visits and triage reports
- Age-related clinical considerations
- Gender-specific health factors

**New Output Fields**:
- `relevantLabFindings`: Key lab values from external reports
- `reportInsights`: Important insights from uploaded reports

**Output**: `ClinicalHistoryAnalysis`

### 4. Diagnosis Agent (Gemini 3 Pro)
**Role**: Advanced reasoning for diagnostic assessment.

**Generates**:
- Primary diagnosis with supporting rationale
- Differential diagnoses
- Urgency level (LOW/MEDIUM/HIGH/CRITICAL)
- Recommended immediate actions
- Follow-up recommendations
- Red flags requiring attention

**Output**: `DiagnosisResult`

### 5. Coding Agent (Gemini 3 Flash)
**Role**: Medical coding for billing and documentation.

**Generates**:
- ICD-10 diagnostic codes (primary and secondary)
- CPT procedure codes for services rendered
- Imaging study codes

**Output**: `CodingResult`

## EHR Data Integration

The system uses **EHR/FHIR compliant** data models:

| Data Type | FHIR Resource | Used By |
|-----------|---------------|---------|
| Medical History | Condition | History Agent, Diagnosis Agent |
| Medications | MedicationStatement | History Agent, Diagnosis Agent |
| External Reports | DiagnosticReport | History Agent (NEW) |
| Scans | ImagingStudy | Scan Agent |
| Encounters | Encounter | Orchestrator |
| Patient | Patient | All agents |

## Report Extraction (Gemini 3 Flash)

Upload a PDF or image of a medical report, and Gemini 3 Flash extracts structured data:

```
POST /api/patients/{id}/reports/extract

{
  "fileUrl": "https://s3.../report.pdf",
  "fileType": "pdf"
}

Response:
{
  "formData": {
    "type": "lab",
    "title": "Complete Blood Count",
    "reportDate": "2026-02-01",
    "findings": "Hemoglobin 12.5 g/dL...",
    "conclusion": "All values normal"
  },
  "rawExtraction": {
    "labValues": [...],
    "diagnoses": [...],
    "medications": [...]
  }
}
```

## Inngest Workflow Integration

All AI workflows are orchestrated through **Inngest** for reliable, event-driven execution.

### Available Workflows

| Event | Function | Description |
|-------|----------|-------------|
| `triage.requested` | `generateTriageReport` | **Main workflow** - Full multi-agent analysis |
| `analysis.full.requested` | `runFullAnalysis` | Manual re-analysis trigger |
| `report.generated` | `handleReportGenerated` | Post-processing (notifications) |

**Note**: `scan.uploaded` event has been **REMOVED**. Scans are stored without analysis.

## Setup Instructions

### 1. Environment Variables

```env
# Google Gemini API (for Gemini 3 Pro/Flash agents)
GEMINI_API_KEY="your-gemini-api-key"

# OpenAI API (for GPT-5 Mini scan analysis agent)
OPENAI_API_KEY="your-openai-api-key"

# Inngest Configuration (Required for AI agent workflows)
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

### 2. Database Migration

Run the migration for new EHR-compliant models:

```bash
npx prisma migrate dev --name add_ehr_compliant_models
```

### 3. Inngest Dev Server (Local Development)

```bash
npx inngest-cli@latest dev
```

### 4. Verify Setup

Open `http://127.0.0.1:8288` and verify these functions are registered:
- `generate-triage-report`
- `run-full-analysis`
- `handle-report-generated`

## Usage Example

### Triggering Analysis via API

Analysis is triggered when doctor clicks "Start Triage":

```typescript
import { inngest } from "@/inngest/client";

await inngest.send({
    name: "triage.requested",
    data: {
        encounterId: "encounter-uuid",
        patientId: "patient-uuid",
        symptoms: "Patient presenting with chest pain and shortness of breath",
        voiceTranscript: "Optional voice transcription",
        analyzeScans: true,
        generateCodes: true,
    },
});
```

## Report Output Structure

```typescript
interface OrchestratedMedicalReport {
    reportId: string;
    patientId: string;
    encounterId: string;
    generatedAt: string;
    
    patientSummary: {
        name: string;
        age: number;
        gender: string;
        presentingSymptoms: string;
        activeMedications: string[];  // From EHR
        relevantHistory: string[];    // From EHR
    };
    
    clinicalHistory: ClinicalHistoryAnalysis;
    scanAnalyses: ScanAnalysisResult[];
    diagnosis: DiagnosisResult;
    coding: CodingResult;
    
    executiveSummary: string;
    overallUrgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    overallConfidence: number;
    reasoningChain: string;
    
    agentsUsed: string[];
    processingTimeMs: number;
}
```

## Error Handling

Each agent has fallback behavior:
- **Scan Agent**: Returns "manual review required" if analysis fails
- **History Agent**: Returns basic age-based considerations
- **Diagnosis Agent**: Recommends standard clinical evaluation
- **Coding Agent**: Returns generic codes (R69, 99201)

Inngest provides automatic retries (2 retries configured) for transient failures.

## API Endpoints Summary

### Patient Data Management (EHR)

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/patients/[id]/medical-history` | GET, POST | Medical history entries |
| `/api/patients/[id]/medical-history/[historyId]` | PATCH, DELETE | Update/delete history |
| `/api/patients/[id]/medications` | GET, POST | Medication management |
| `/api/patients/[id]/medications/[medicationId]` | PATCH, DELETE | Update/delete medications |
| `/api/patients/[id]/reports` | GET, POST | External reports |
| `/api/patients/[id]/reports/extract` | POST | AI extraction from PDF/image |
| `/api/patients/[id]/reports/[reportId]` | PATCH, DELETE | Update/delete reports |

### Scanning & Triage

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/scans` | GET, POST | Scan management (no auto-analysis) |
| `/api/scans/presign` | POST | Get S3 upload URL |
| `/api/scans/view` | GET | Get signed URL for viewing |
| `/api/triage` | POST | Start triage (triggers AI) |
| `/api/inngest` | GET, POST, PUT | Inngest webhook handler |
