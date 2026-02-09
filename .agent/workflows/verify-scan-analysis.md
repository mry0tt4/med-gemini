---
description: Verify Scan Analysis and AI Confidence features
---

1. Start the development server using `npm run dev`.
2. Navigate to the patient dashboard.
3. Click "Upload Scan" and select a DICOM file (or image).
4. Wait for the upload to complete. The system should automatically trigger AI analysis.
5. Verify that the scan thumbnail appears in the patient's encounter history.
6. Verify that an AI confidence score badge (e.g., "85%") appears on the scan thumbnail once analysis is complete (you may need to refresh if not using real-time updates).
7. Click on the scan thumbnail to open the View Scan Modal.
8. Verify that the AI Analysis section shows the detailed text and the confidence bar/score.
9. Verify that the DICOM preview is generated correctly.
10. Navigate to the "External Reports" section and upload a PDF report.
11. Verify that the system extracts data from the PDF using the updated Google Cloud Vision (Gemini 2.0 Flash) integration.
