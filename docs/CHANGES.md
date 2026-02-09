# MedAgent - Changes Documentation (February 2026)

This document outlines the major changes made to the MedAgent system to enhance EHR compliance, improve AI workflows, and add new patient data management features.

---

## Table of Contents

1. [AI Analysis Workflow Changes](#ai-analysis-workflow-changes)
2. [EHR/FHIR Compliant Data Models](#ehrfhir-compliant-data-models)
3. [New API Endpoints](#new-api-endpoints)
4. [DICOM Support for Medical Scans](#dicom-support-for-medical-scans)
5. [Gemini 3 Flash Report Extraction](#gemini-3-pro-report-extraction)
6. [Updated AI Agents](#updated-ai-agents)
7. [Database Migration Required](#database-migration-required)

---

## 1. AI Analysis Workflow Changes

### ❌ REMOVED: Auto-Analysis on Scan Upload

Previously, when a scan was uploaded, the AI would automatically analyze it. This has been **removed**.

### ✅ NEW: Doctor-Initiated Analysis

AI analysis is now **ONLY** triggered when the doctor clicks **"Start Triage"**. This gives the medical professional full control over when AI analysis occurs.

**Workflow:**
1. Upload scans, add medical history, medications, reports → Data is stored, no AI runs
2. Doctor reviews patient data
3. Doctor clicks "Start Triage" → AI agents are invoked
4. Multi-agent analysis produces comprehensive report

**Benefits:**
- Doctor controls when AI runs
- Allows complete data entry before analysis
- Reduces unnecessary API costs
- Follows clinical workflow standards

**Files Changed:**
- `src/app/api/scans/route.ts` - Removed Inngest auto-trigger
- `src/inngest/events.ts` - Removed `scan.uploaded` event
- `src/inngest/functions.ts` - Removed `processScan` function
- `src/app/api/inngest/route.ts` - Updated function registrations

---

## 2. EHR/FHIR Compliant Data Models

The database schema has been updated to follow **HL7 FHIR** standards for healthcare interoperability.

### New Models

#### MedicalHistory (FHIR Condition)
```prisma
model MedicalHistory {
  id              String    @id @default(uuid())
  patientId       String
  type            String    // condition | allergy | surgery | family_history | social_history | immunization
  clinicalStatus  String    // active | recurrence | inactive | remission | resolved
  description     String
  onsetDate       DateTime?
  abatementDate   DateTime?
  severity        String?   // mild | moderate | severe
  icd10Code       String?   // ICD-10 code
  snomedCode      String?   // SNOMED CT code
  verificationStatus String // unconfirmed | provisional | confirmed | refuted
}
```

#### Medication (FHIR MedicationStatement)
```prisma
model Medication {
  id              String    @id @default(uuid())
  patientId       String
  name            String    // Drug name
  genericName     String?   // Generic drug name
  rxNormCode      String?   // RxNorm code for interoperability
  dosage          String?   // e.g., "500mg"
  frequency       String?   // e.g., "twice daily"
  route           String?   // oral | topical | injection | inhalation
  status          String    // active | completed | stopped | on-hold
  startDate       DateTime?
  endDate         DateTime?
  prescribedBy    String?
  reason          String?   // Why the medication was prescribed
}
```

#### ExternalReport (FHIR DiagnosticReport)
```prisma
model ExternalReport {
  id              String    @id @default(uuid())
  patientId       String
  type            String    // lab | pathology | radiology | cardiology | other
  title           String
  reportDate      DateTime
  providerName    String?
  fileUrl         String?   // S3 URL for uploaded PDF/image
  fileType        String?   // pdf | image
  extractedData   Json?     // AI-extracted structured data
  findings        String?
  conclusion      String?
  loincCode       String?   // LOINC code
}
```

### Enhanced Patient Model
```prisma
model Patient {
  // ... existing fields ...
  phone                    String?
  email                    String?
  address                  String?
  emergencyContactName     String?
  emergencyContactPhone    String?
  emergencyContactRelation String?
  mrn                      String?  @unique  // Medical Record Number
  
  // Relations
  medicalHistory           MedicalHistory[]
  medications              Medication[]
  externalReports          ExternalReport[]
}
```

---

## 3. New API Endpoints

### Medical History Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients/[id]/medical-history` | Get all medical history entries |
| `POST` | `/api/patients/[id]/medical-history` | Create new medical history entry |
| `PATCH` | `/api/patients/[id]/medical-history/[historyId]` | Update a medical history entry |
| `DELETE` | `/api/patients/[id]/medical-history/[historyId]` | **Delete** a medical history entry |

**Example: Create Medical History**
```json
POST /api/patients/{patientId}/medical-history
{
  "type": "condition",
  "description": "Type 2 Diabetes Mellitus",
  "clinicalStatus": "active",
  "onsetDate": "2020-03-15",
  "severity": "moderate",
  "icd10Code": "E11.9"
}
```

### Medications Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients/[id]/medications` | Get all medications |
| `POST` | `/api/patients/[id]/medications` | Create new medication entry |
| `PATCH` | `/api/patients/[id]/medications/[medicationId]` | Update a medication |
| `DELETE` | `/api/patients/[id]/medications/[medicationId]` | Delete a medication |

**Example: Add Medication**
```json
POST /api/patients/{patientId}/medications
{
  "name": "Metformin",
  "genericName": "Metformin Hydrochloride",
  "dosage": "500mg",
  "frequency": "twice daily",
  "route": "oral",
  "status": "active",
  "startDate": "2020-03-15",
  "reason": "Type 2 Diabetes management"
}
```

### External Reports Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients/[id]/reports` | Get all external reports |
| `POST` | `/api/patients/[id]/reports` | Create new report (form data) |
| `POST` | `/api/patients/[id]/reports/extract` | **Extract data from PDF/image** |
| `PATCH` | `/api/patients/[id]/reports/[reportId]` | Update a report |
| `DELETE` | `/api/patients/[id]/reports/[reportId]` | Delete a report |

---

## 4. DICOM Support for Medical Scans

The Scan model has been enhanced to support **DICOM** medical imaging format.

### New Scan Fields
```prisma
model Scan {
  // ... existing fields ...
  modality           String?   // DICOM modality code: CR, CT, MR, US, DX
  bodyPart           String?   // Body part examined
  fileFormat         String    // "dicom" | "image"
  dicomMetadata      Json?     // Full DICOM metadata
  studyInstanceUid   String?   // DICOM Study Instance UID
  seriesInstanceUid  String?   // DICOM Series Instance UID
  sopInstanceUid     String?   // DICOM SOP Instance UID
  studyDate          DateTime?
  studyDescription   String?
  analysisCompletedAt DateTime?
}
```

### DICOM Modality Mapping
| Scan Type | DICOM Modality |
|-----------|----------------|
| X-RAY | DX (Digital Radiography) |
| CT | CT (Computed Tomography) |
| MRI | MR (Magnetic Resonance) |
| ULTRASOUND | US (Ultrasound) |
| DERM | XC (External-camera Photography) |

---

## 5. Gemini 3 Flash Report Extraction

Upload a PDF or image of a medical report, and **Gemini 3 Flash** will automatically extract structured data to auto-fill forms.

### Endpoint
```
POST /api/patients/{patientId}/reports/extract
```

### Request
```json
{
  "fileUrl": "https://s3.amazonaws.com/bucket/report.pdf",
  "fileType": "pdf"
}
```

### Response
```json
{
  "success": true,
  "formData": {
    "type": "lab",
    "title": "Complete Blood Count",
    "reportDate": "2026-02-01",
    "providerName": "LabCorp",
    "findings": "Hemoglobin 12.5 g/dL, WBC 7.2 x10^9/L",
    "conclusion": "All values within normal limits"
  },
  "rawExtraction": {
    "reportType": "lab",
    "labValues": [
      {
        "testName": "Hemoglobin",
        "value": "12.5",
        "unit": "g/dL",
        "referenceRange": "12.0-16.0",
        "flag": null
      }
    ],
    "diagnoses": [],
    "medications": []
  }
}
```

### Use Case
1. User uploads a lab report PDF
2. Frontend calls `/api/patients/{id}/reports/extract` with the file URL
3. Gemini 3 Flash extracts structured data
4. Frontend auto-fills the report form with extracted data
5. User reviews and submits the report

---

## 6. Updated AI Agents

### Clinical History Agent (Gemini 3 Flash)

The History Agent now analyzes:
- ✅ Structured medical history (EHR)
- ✅ Current medications
- ✅ **External reports (NEW)**
- ✅ Previous encounters
- ✅ Legacy medical history summary

### New Output Fields
```typescript
interface ClinicalHistoryAnalysis {
  // ... existing fields ...
  relevantLabFindings: string[];  // NEW: Key lab values from external reports
  reportInsights: string[];       // NEW: Insights from external reports
}
```

### Data Flow
```
Patient Data (EHR)
    │
    ├── Medical History (conditions, allergies, surgeries)
    ├── Medications (current, past)
    ├── External Reports (lab, pathology, radiology)  ← NEW
    └── Previous Encounters
    │
    ▼
History Agent (Gemini 3 Flash)
    │
    ▼
ClinicalHistoryAnalysis
    │
    ├── riskFactors
    ├── relevantConditions
    ├── medicationInteractions
    ├── relevantLabFindings    ← NEW
    └── reportInsights         ← NEW
    │
    ▼
Diagnosis Agent (Gemini 3 Pro)
```

---

## 7. Database Migration Required

After these changes, you need to run a database migration:

```bash
# Generate migration
npx prisma migrate dev --name add_ehr_compliant_models

# Or for production
npx prisma migrate deploy
```

### Migration Notes
- New tables: `MedicalHistory`, `Medication`, `ExternalReport`
- Modified tables: `Patient`, `Scan`, `Encounter`
- All new relations use `onDelete: Cascade`

---

## Summary of Files Changed

### New Files Created
```
src/app/api/patients/[id]/medical-history/route.ts
src/app/api/patients/[id]/medical-history/[historyId]/route.ts
src/app/api/patients/[id]/medications/route.ts
src/app/api/patients/[id]/medications/[medicationId]/route.ts
src/app/api/patients/[id]/reports/route.ts
src/app/api/patients/[id]/reports/[reportId]/route.ts
src/app/api/patients/[id]/reports/extract/route.ts
docs/CHANGES.md (this file)
```

### Modified Files
```
prisma/schema.prisma           - EHR-compliant models
src/app/api/scans/route.ts     - Removed auto-analysis
src/inngest/events.ts          - Removed scan.uploaded
src/inngest/functions.ts       - Removed processScan
src/app/api/inngest/route.ts   - Updated registrations
src/lib/ai/agents/types.ts     - New EHR types
src/lib/ai/agents/history-agent.ts - Analyze reports
src/lib/ai/agents/orchestrator.ts  - Gather EHR data
```

---

## Environment Variables

No new environment variables required. Existing:
- `GEMINI_API_KEY` - For Gemini 3 Pro/Flash agents
- `OPENAI_API_KEY` - For GPT-5 Mini scan analysis
- `INNGEST_EVENT_KEY` - For Inngest workflows
- `INNGEST_SIGNING_KEY` - For Inngest webhook verification

---

## Next Steps

1. **Run Database Migration**: `npx prisma migrate dev`
2. **Update Frontend**: Add UI for medical history, medications, and reports
3. **Test Report Extraction**: Upload sample PDFs to test Gemini extraction
4. **Verify Triage Workflow**: Ensure "Start Triage" triggers full AI analysis

---

## 8. Updates - February 10, 2026

### 🔄 AI Scan Analysis Workflow Update
Re-enabled **Automatic AI Analysis on Scan Upload** to provide immediate feedback.
- **Immediate Feedback:** Scans are now analyzed immediately upon upload to generate a preliminary confidence score.
- **Confidence Scores:** A new confidence score badge (e.g., "85% Conf.") appears on scan thumbnails.
- **Detailed JSON Storage:** Analysis results are now stored as structured JSON objects, preserving confidence scores and detailed findings.

### 📄 Report Extraction Enhancements
- **Gemini 3 Flash Preview:** Switched to `gemini-3-pro-preview` for PDF/Image report extraction as per specific requirements.
- **Auto-Extraction:** The extraction process is now triggered automatically upon file upload in the "Add Report" modal.
- **Private S3 Support:** Implemented signed URL generation for secure AI analysis of private S3 files. All report and scan analysis agents now correctly handle private bucket access.

### 🛠️ Technical Fixes
- **DICOM Preview:** Disabled web workers in `cornerstoneWADOImageLoader` to fix client-side DICOM preview generation issues in Next.js.
- **Scan Agent Upgrade:** Parameterized the Scan Agent to accept pre-generated signed URLs for previews, ensuring the vision model can access the visual data.
