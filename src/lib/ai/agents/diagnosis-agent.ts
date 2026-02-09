/**
 * Diagnosis Agent - Gemini 3 Pro
 * 
 * This agent synthesizes all available information (symptoms, scan results,
 * patient history) to generate comprehensive diagnoses with clinical reasoning.
 * Uses Gemini 3 Pro for advanced reasoning capabilities.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    DiagnosisResult,
    PatientContext,
    ScanAnalysisResult,
    ClinicalHistoryAnalysis,
} from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateDiagnosis(
    patient: PatientContext,
    clinicalHistory: ClinicalHistoryAnalysis,
    scanResults: ScanAnalysisResult[]
): Promise<DiagnosisResult> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const startTime = Date.now();

    // Format scan findings for the prompt
    const scanSummary = scanResults.length > 0
        ? scanResults
            .map((scan) => `
### ${scan.scanType} Scan Analysis
- **Findings**: ${scan.findings}
- **Abnormalities**: ${scan.abnormalities.join(", ") || "None identified"}
- **Severity**: ${scan.severity}
- **Confidence**: ${(scan.confidence * 100).toFixed(0)}%
- **Recommendations**: ${scan.recommendations.join("; ")}`)
            .join("\n")
        : "No imaging studies available for this encounter.";

    const prompt = `You are an expert clinical diagnostician AI. Your role is to synthesize all available patient information to generate accurate diagnoses with clear clinical reasoning.

## Patient Profile
- **Name**: ${patient.name}
- **Age**: ${patient.age} years old
- **Gender**: ${patient.gender}

## Current Presentation
**Chief Complaint/Symptoms**: ${patient.currentSymptoms}
${patient.voiceTranscript ? `**Patient's Own Description**: "${patient.voiceTranscript}"` : ""}

## Clinical History Analysis
**Context Summary**: ${clinicalHistory.contextSummary}

**Risk Factors**: ${clinicalHistory.riskFactors.join(", ") || "None identified"}

**Relevant Pre-existing Conditions**: ${clinicalHistory.relevantConditions.join(", ") || "None documented"}

**Age-Related Considerations**: ${clinicalHistory.ageRelatedConsiderations.join("; ")}

**Gender-Specific Factors**: ${clinicalHistory.genderSpecificFactors.join("; ") || "None specific"}

**Contraindications**: ${clinicalHistory.contraindications.join(", ") || "None identified"}

## Imaging Results
${scanSummary}

## Diagnostic Task
Based on ALL available information, provide a comprehensive diagnostic assessment. Your reasoning should:
1. Consider the patient's age, gender, and risk profile
2. Integrate imaging findings with clinical presentation
3. Account for the patient's medical history
4. Identify any red flags requiring immediate attention
5. Suggest appropriate follow-up

Respond with ONLY valid JSON in this exact format:
{
    "primaryDiagnosis": "Most likely diagnosis with brief supporting rationale",
    "differentialDiagnoses": ["Second most likely", "Third most likely", "Fourth possibility"],
    "confidence": 0.0-1.0,
    "reasoning": "Detailed step-by-step clinical reasoning explaining how you arrived at this diagnosis (3-4 paragraphs)",
    "urgencyLevel": "One of: LOW, MEDIUM, HIGH, CRITICAL",
    "recommendedActions": [
        "**IMMEDIATE:** [Most urgent action - use this format for critical items]",
        "**DIAGNOSTIC:** [Lab tests or imaging to order]",
        "**THERAPEUTIC:** [Treatment to initiate]",
        "**MONITORING:** [What to watch for]"
    ],
    "followUpRecommendations": ["When to follow up", "What to monitor", "Specialist referrals if needed"],
    "redFlags": ["Any warning signs that require immediate attention - empty array if none"]
}

IMPORTANT: For recommendedActions, format each action as "**CATEGORY:** action details" where CATEGORY is one of: IMMEDIATE, DIAGNOSTIC, THERAPEUTIC, MONITORING, CONSULT. This helps physicians quickly scan priorities.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse diagnosis response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const processingTime = Date.now() - startTime;
        console.log(`[DiagnosisAgent] Generated diagnosis in ${processingTime}ms`);

        return {
            primaryDiagnosis: parsed.primaryDiagnosis || "Diagnosis pending further evaluation",
            differentialDiagnoses: Array.isArray(parsed.differentialDiagnoses)
                ? parsed.differentialDiagnoses
                : [],
            confidence: typeof parsed.confidence === "number"
                ? Math.min(1, Math.max(0, parsed.confidence))
                : 0.75,
            reasoning: parsed.reasoning || "Clinical reasoning available upon request.",
            urgencyLevel: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(parsed.urgencyLevel)
                ? parsed.urgencyLevel
                : "MEDIUM",
            recommendedActions: Array.isArray(parsed.recommendedActions)
                ? parsed.recommendedActions
                : [],
            followUpRecommendations: Array.isArray(parsed.followUpRecommendations)
                ? parsed.followUpRecommendations
                : [],
            redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        };
    } catch (error) {
        console.error("[DiagnosisAgent] Error generating diagnosis:", error);

        // Return a fallback requiring manual review
        return {
            primaryDiagnosis: "Automated diagnosis unavailable - manual clinical review required",
            differentialDiagnoses: [],
            confidence: 0,
            reasoning: "The AI diagnostic system was unable to complete the analysis. Please perform standard clinical evaluation.",
            urgencyLevel: "MEDIUM",
            recommendedActions: [
                "Complete physical examination",
                "Review all available imaging and labs",
                "Consider specialist consultation",
            ],
            followUpRecommendations: [
                "Follow up within 48-72 hours if symptoms persist",
                "Return immediately if symptoms worsen",
            ],
            redFlags: [],
        };
    }
}

/**
 * Determine urgency level based on multiple factors
 */
export function calculateOverallUrgency(
    scanResults: ScanAnalysisResult[],
    diagnosis: DiagnosisResult
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    // Check for severe scan findings
    const hasSevereScan = scanResults.some((scan) => scan.severity === "SEVERE");
    const hasModerateScan = scanResults.some((scan) => scan.severity === "MODERATE");

    // Check for red flags
    const hasRedFlags = diagnosis.redFlags.length > 0;

    // Priority mapping
    if (diagnosis.urgencyLevel === "CRITICAL" || hasSevereScan) {
        return "CRITICAL";
    }
    if (diagnosis.urgencyLevel === "HIGH" || hasRedFlags || hasModerateScan) {
        return "HIGH";
    }
    if (diagnosis.urgencyLevel === "MEDIUM") {
        return "MEDIUM";
    }
    return "LOW";
}

/**
 * Generate a quick preliminary assessment for urgent cases
 */
export async function generateQuickAssessment(
    symptoms: string,
    patientAge: number,
    patientGender: string
): Promise<{ urgency: string; keyConsiderations: string[] }> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const prompt = `Quick triage assessment for a ${patientAge}y ${patientGender} patient presenting with: ${symptoms}

Provide a brief JSON response:
{
    "urgency": "LOW/MEDIUM/HIGH/CRITICAL",
    "keyConsiderations": ["List 2-3 key clinical considerations"]
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                urgency: parsed.urgency || "MEDIUM",
                keyConsiderations: parsed.keyConsiderations || [],
            };
        }
    } catch (error) {
        console.error("[DiagnosisAgent] Quick assessment error:", error);
    }

    return { urgency: "MEDIUM", keyConsiderations: [] };
}
