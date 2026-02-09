# API Reference

## Authentication
All API endpoints (except `/api/inngest` and public webhooks) require authentication via Clerk. The `auth()` helper from `@clerk/nextjs` is used to verify sessions.

## Patients

### Get Patient Details
`GET /api/patients/[id]`
Returns full patient details including history, medications, and recent encounters.

### Add Medical History
`POST /api/patients/[id]/medical-history`
- **Body**: `{ condition, date, notes }`
- **Returns**: Updated History Entry

### Add Medication
`POST /api/patients/[id]/medications`
- **Body**: `{ name, dosage, frequency, startDate }`
- **Returns**: Updated Medication Entry

## Reports & files

### Upload Report
`POST /api/patients/[id]/reports`
- **Body**: `{ fileUrl, type, title, date }`
- **Returns**: Created Report Record

### Extract Data from Report (AI)
`POST /api/patients/[id]/reports/extract`
- **Body**: `{ fileUrl, fileType }`
- **Returns**: Structured JSON data extracted by Gemini 3 Flash.

## Scans (Imaging)

### Get Presigned Upload URL
`POST /api/scans/presign`
- **Body**: `{ filename, filetype }`
- **Returns**: `{ uploadUrl, key }` for direct S3 upload.

### View Scan (Signed URL)
`GET /api/scans/view?key={s3_key}`
- **Returns**: `{ url }` (Time-limited signed URL for secure viewing)

## Triage & Analysis

### Start Triage (Trigger AI)
`POST /api/triage`
- **Body**:
  ```json
  {
    "patientId": "uuid",
    "symptoms": "Description of current complaint",
    "encounterId": "uuid" // Optional, creates new if missing
  }
  ```
- **Returns**: `{ processingId, status: "queued" }`
- **Side Effect**: Triggers `triage.requested` Inngest event.

## Webhooks

### Inngest Event Handler
`POST /api/inngest`
- **Internal**: Handles all background queues and agent orchestration steps.
