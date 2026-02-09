/**
 * Clinical History Agent - Gemini 3 Flash
 * 
 * This agent specializes in analyzing patient medical history, identifying
 * risk factors, and providing contextual information for diagnosis.
 * Uses Gemini 3 Flash for fast, efficient processing.
 * 
 * Now includes analysis of:
 * - Medical history (EHR/FHIR Condition)
 * - Current medications (EHR/FHIR MedicationStatement)
 * - External reports (EHR/FHIR DiagnosticReport)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClinicalHistoryAnalysis, PatientContext } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzePatientHistory(
    patient: PatientContext
): Promise<ClinicalHistoryAnalysis> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const startTime = Date.now();

    // Build comprehensive patient context from encounters
    const encounterHistory = patient.encounters
        .map((enc, i) => {
            const scanInfo = enc.scans.length > 0
                ? `Scans: ${enc.scans.map(s => `${s.type}${s.bodyPart ? ` (${s.bodyPart})` : ""}`).join(", ")}`
                : "No scans";
            const triageInfo = enc.triageReport
                ? `Triage: ${enc.triageReport.urgencyLevel} - ${enc.triageReport.summary.slice(0, 200)}`
                : "";
            return `Encounter ${i + 1} (${enc.createdAt}):
  - Type: ${enc.encounterType || "ambulatory"}
  - Chief Complaint: ${enc.chiefComplaint || enc.symptoms}
  ${enc.voiceTranscript ? `- Voice Notes: ${enc.voiceTranscript}` : ""}
  - ${scanInfo}
  ${triageInfo}`;
        })
        .join("\n\n");

    // Build previous triage reports summary for trend analysis
    const previousTriageReports = patient.encounters
        .filter(enc => enc.triageReport)
        .map(enc => enc.triageReport!)
        .slice(0, 5) // Last 5 triage reports
        .map((report, i) => {
            return `Previous Report ${i + 1}:
  - Urgency: ${report.urgencyLevel}
  - Confidence: ${report.confidenceScore ? `${Math.round(report.confidenceScore * 100)}%` : 'N/A'}
  - Summary: ${report.summary.slice(0, 300)}
  - Recommended Action: ${report.recommendedAction || 'N/A'}`;
        })
        .join("\n\n");

    // Build structured medical history (EHR/FHIR Condition compliant)
    const medicalHistoryStr = patient.medicalHistory && patient.medicalHistory.length > 0
        ? patient.medicalHistory.map(h => {
            const dateStr = h.onsetDate ? ` (since ${h.onsetDate})` : "";
            const statusStr = h.clinicalStatus !== "active" ? ` [${h.clinicalStatus}]` : "";
            const severityStr = h.severity ? ` - ${h.severity}` : "";
            const codeStr = h.icd10Code ? ` (ICD-10: ${h.icd10Code})` : "";
            return `- [${h.type}] ${h.description}${dateStr}${statusStr}${severityStr}${codeStr}`;
        }).join("\n")
        : "No structured medical history on file";

    // Build current medications list (EHR/FHIR MedicationStatement compliant)
    const medicationsStr = patient.medications && patient.medications.length > 0
        ? patient.medications
            .filter(m => m.status === "active")
            .map(m => {
                const dosageStr = m.dosage ? ` ${m.dosage}` : "";
                const freqStr = m.frequency ? ` ${m.frequency}` : "";
                const routeStr = m.route ? ` (${m.route})` : "";
                const reasonStr = m.reason ? ` - for ${m.reason}` : "";
                return `- ${m.name}${dosageStr}${freqStr}${routeStr}${reasonStr}`;
            }).join("\n")
        : "No current medications on file";

    // Build external reports summary (EHR/FHIR DiagnosticReport compliant)
    const reportsStr = patient.externalReports && patient.externalReports.length > 0
        ? patient.externalReports
            .slice(0, 10) // Most recent 10 reports
            .map(r => {
                const findingsStr = r.findings ? ` - Findings: ${r.findings.slice(0, 200)}` : "";
                const conclusionStr = r.conclusion ? ` Conclusion: ${r.conclusion.slice(0, 200)}` : "";
                return `- [${r.type}] ${r.title} (${r.reportDate})${findingsStr}${conclusionStr}`;
            }).join("\n")
        : "No external reports on file";

    const prompt = `You are a clinical history analyst AI. Your role is to thoroughly analyze a patient's complete medical record and identify all clinically relevant factors that could influence diagnosis and treatment.

## Patient Information
- **Name**: ${patient.name}
- **Age**: ${patient.age} years old
- **Gender**: ${patient.gender}
- **Date of Birth**: ${patient.dateOfBirth}
${patient.mrn ? `- **MRN**: ${patient.mrn}` : ""}

## Structured Medical History (EHR)
${medicalHistoryStr}

## Current Medications
${medicationsStr}

## External Medical Reports (Lab, Pathology, Radiology, etc.)
${reportsStr}

## Legacy Medical History Summary
${patient.medicalHistorySummary || "No legacy summary available"}

## Current Presentation
- **Presenting Symptoms**: ${patient.currentSymptoms}
${patient.voiceTranscript ? `- **Patient's Own Words**: ${patient.voiceTranscript}` : ""}

## Previous Encounters
${encounterHistory || "No previous encounters on record"}

## Previous Triage Reports (for trend analysis)
${previousTriageReports || "No previous triage reports on file"}

## Task
Analyze ALL available information (medical history, medications, external reports, encounters) and provide a comprehensive clinical context assessment. Consider:
1. How the patient's age affects risk profiles and differential diagnoses
2. Gender-specific health considerations
3. Patterns in their medical history
4. Previous conditions that may be recurring or related
5. Medication interactions and contraindications
6. Lab findings and report insights that are relevant to the current presentation
7. Red flags or warning signs based on their complete record

Respond with ONLY valid JSON in this exact format:
{
    "riskFactors": ["List of identified risk factors based on complete history"],
    "relevantConditions": ["Pre-existing conditions relevant to current presentation"],
    "medicationInteractions": ["Potential medication concerns based on current meds and presentation"],
    "contraindications": ["Treatment approaches to avoid based on history and medications"],
    "contextSummary": "A narrative summary of clinically relevant context (2-3 paragraphs)",
    "ageRelatedConsiderations": ["Specific considerations based on the patient's age group"],
    "genderSpecificFactors": ["Any gender-specific health factors to consider"],
    "relevantLabFindings": ["Key lab values or test results from external reports that are relevant"],
    "reportInsights": ["Important insights from external reports that should inform diagnosis"],
    "previousTriageAnalysis": "Analysis of previous triage reports - whether condition is improving, stable, or declining. Include specific observations about trends."
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse clinical history analysis");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const processingTime = Date.now() - startTime;
        console.log(`[HistoryAgent] Analyzed patient history in ${processingTime}ms`);

        return {
            patientId: patient.id,
            riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
            relevantConditions: Array.isArray(parsed.relevantConditions) ? parsed.relevantConditions : [],
            medicationInteractions: Array.isArray(parsed.medicationInteractions) ? parsed.medicationInteractions : [],
            contraindications: Array.isArray(parsed.contraindications) ? parsed.contraindications : [],
            contextSummary: parsed.contextSummary || "Clinical context analysis completed.",
            ageRelatedConsiderations: Array.isArray(parsed.ageRelatedConsiderations) ? parsed.ageRelatedConsiderations : [],
            genderSpecificFactors: Array.isArray(parsed.genderSpecificFactors) ? parsed.genderSpecificFactors : [],
            relevantLabFindings: Array.isArray(parsed.relevantLabFindings) ? parsed.relevantLabFindings : [],
            reportInsights: Array.isArray(parsed.reportInsights) ? parsed.reportInsights : [],
            previousTriageAnalysis: parsed.previousTriageAnalysis || null,
        };
    } catch (error) {
        console.error("[HistoryAgent] Error analyzing patient history:", error);

        // Return a basic analysis based on available data
        return {
            patientId: patient.id,
            riskFactors: patient.age > 60 ? ["Advanced age"] : [],
            relevantConditions: patient.medicalHistory?.map(h => h.description) || [],
            medicationInteractions: [],
            contraindications: [],
            contextSummary: `Patient is a ${patient.age}-year-old ${patient.gender} presenting with: ${patient.currentSymptoms}. ${patient.medicalHistorySummary || "Limited medical history available."}`,
            ageRelatedConsiderations: getAgeConsiderations(patient.age),
            genderSpecificFactors: [],
            relevantLabFindings: [],
            reportInsights: [],
            previousTriageAnalysis: null,
        };
    }
}

/**
 * Get age-related clinical considerations
 */
function getAgeConsiderations(age: number): string[] {
    if (age < 18) {
        return [
            "Pediatric patient - weight-based dosing may be required",
            "Growth and development considerations",
            "Parental/guardian consent required",
        ];
    } else if (age < 40) {
        return [
            "Generally lower risk for age-related conditions",
            "Consider lifestyle factors",
        ];
    } else if (age < 60) {
        return [
            "Increased screening for cardiovascular disease",
            "Consider metabolic syndrome risk",
            "Age-appropriate cancer screening",
        ];
    } else if (age < 75) {
        return [
            "Elevated cardiovascular risk",
            "Polypharmacy considerations",
            "Renal function may affect medication dosing",
            "Falls risk assessment recommended",
        ];
    } else {
        return [
            "Geriatric patient - polypharmacy review essential",
            "High falls risk - careful medication selection",
            "Cognitive assessment may be warranted",
            "Reduced renal and hepatic function expected",
            "Frailty considerations in treatment planning",
        ];
    }
}

/**
 * Generate longitudinal context summary for a patient
 * This is used to update the patient's medicalHistorySummary
 */
export async function generateLongitudinalSummary(
    patient: PatientContext
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    // Include structured history in summary
    const conditionsSummary = patient.medicalHistory && patient.medicalHistory.length > 0
        ? patient.medicalHistory
            .filter(h => h.clinicalStatus === "active")
            .map(h => h.description)
            .join(", ")
        : "";

    const medsSummary = patient.medications && patient.medications.length > 0
        ? patient.medications
            .filter(m => m.status === "active")
            .map(m => m.name)
            .join(", ")
        : "";

    const encounterSummaries = patient.encounters
        .slice(0, 10) // Last 10 encounters
        .map((enc) => `${enc.createdAt}: ${enc.symptoms}`)
        .join("\n");

    const prompt = `Summarize this patient's longitudinal medical history in 3-4 concise sentences suitable for a medical chart. Include key chronic conditions, patterns, medications, and relevant history.

Patient: ${patient.name}, ${patient.age}y ${patient.gender}

Active Conditions: ${conditionsSummary || "None documented"}
Current Medications: ${medsSummary || "None documented"}

Recent Encounters:
${encounterSummaries}

Current Medical History Summary:
${patient.medicalHistorySummary || "None documented"}

Provide a concise, clinical summary:`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("[HistoryAgent] Error generating longitudinal summary:", error);
        return patient.medicalHistorySummary || "";
    }
}
