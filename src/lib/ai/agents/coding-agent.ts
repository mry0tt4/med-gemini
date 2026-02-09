/**
 * Medical Coding Agent - Gemini 3 Flash
 * 
 * This agent generates ICD-10 and CPT codes based on diagnoses and
 * recommended procedures. Uses Gemini 3 Flash for fast processing.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CodingResult, ICD10Code, CPTCode, DiagnosisResult } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateMedicalCodes(
    diagnosis: DiagnosisResult,
    scanTypes: string[],
    proceduresPerformed: string[]
): Promise<CodingResult> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const startTime = Date.now();

    const prompt = `You are a medical coding specialist AI. Generate accurate ICD-10 and CPT codes based on the clinical information provided.

## Primary Diagnosis
${diagnosis.primaryDiagnosis}

## Differential Diagnoses
${diagnosis.differentialDiagnoses.join("\n- ")}

## Recommended Actions/Procedures
${diagnosis.recommendedActions.join("\n- ")}

## Imaging Studies Performed
${scanTypes.length > 0 ? scanTypes.join(", ") : "None"}

## Additional Procedures
${proceduresPerformed.length > 0 ? proceduresPerformed.join(", ") : "None documented"}

## Urgency Level
${diagnosis.urgencyLevel}

## Coding Requirements
Generate appropriate medical codes for billing and documentation purposes.

Respond with ONLY valid JSON in this exact format:
{
    "icd10Codes": [
        {"code": "CODE", "description": "Description", "isPrimary": true},
        {"code": "CODE", "description": "Description", "isPrimary": false}
    ],
    "cptCodes": [
        {"code": "CODE", "description": "Description", "units": 1}
    ],
    "confidence": 0.0-1.0
}

Include:
- Primary ICD-10 diagnosis code (isPrimary: true)
- 2-4 secondary ICD-10 codes for documented conditions
- CPT codes for all imaging studies and procedures
- Evaluation and management (E/M) codes as appropriate`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse coding response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const processingTime = Date.now() - startTime;
        console.log(`[CodingAgent] Generated codes in ${processingTime}ms`);

        return {
            icd10Codes: validateICD10Codes(parsed.icd10Codes),
            cptCodes: validateCPTCodes(parsed.cptCodes),
            confidence: typeof parsed.confidence === "number"
                ? Math.min(1, Math.max(0, parsed.confidence))
                : 0.80,
        };
    } catch (error) {
        console.error("[CodingAgent] Error generating codes:", error);

        // Return minimal fallback codes
        return {
            icd10Codes: [
                { code: "R69", description: "Illness, unspecified", isPrimary: true },
            ],
            cptCodes: [
                { code: "99201", description: "Office or other outpatient visit, new patient", units: 1 },
            ],
            confidence: 0,
        };
    }
}

/**
 * Validate and normalize ICD-10 codes
 */
function validateICD10Codes(codes: unknown): ICD10Code[] {
    if (!Array.isArray(codes)) return [];

    return codes
        .filter((code): code is Record<string, unknown> =>
            typeof code === "object" && code !== null
        )
        .map((code) => ({
            code: String(code.code || "R69"),
            description: String(code.description || "Unspecified"),
            isPrimary: Boolean(code.isPrimary),
        }))
        .slice(0, 6); // Limit to 6 codes
}

/**
 * Validate and normalize CPT codes
 */
function validateCPTCodes(codes: unknown): CPTCode[] {
    if (!Array.isArray(codes)) return [];

    return codes
        .filter((code): code is Record<string, unknown> =>
            typeof code === "object" && code !== null
        )
        .map((code) => ({
            code: String(code.code || "99201"),
            description: String(code.description || "Unspecified service"),
            units: typeof code.units === "number" ? code.units : 1,
        }))
        .slice(0, 10); // Limit to 10 codes
}

/**
 * Generate codes specifically for imaging studies
 */
export async function generateImagingCodes(
    scanType: string,
    bodyPart: string,
    isWithContrast: boolean = false
): Promise<CPTCode[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `Generate the appropriate CPT code for this imaging study:
- Type: ${scanType}
- Body Part: ${bodyPart}
- With Contrast: ${isWithContrast ? "Yes" : "No"}

Respond with ONLY a JSON array:
[{"code": "XXXXX", "description": "Description", "units": 1}]`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim());
        return validateCPTCodes(parsed);
    } catch {
        // Common fallback codes for imaging
        const fallbackCodes: Record<string, CPTCode> = {
            "X-RAY": { code: "71046", description: "Chest X-ray, 2 views", units: 1 },
            "MRI": { code: "70553", description: "MRI brain with contrast", units: 1 },
            "CT": { code: "70460", description: "CT head with contrast", units: 1 },
            "ULTRASOUND": { code: "76700", description: "Ultrasound, abdominal", units: 1 },
            "DERM": { code: "96902", description: "Dermoscopy", units: 1 },
        };
        return [fallbackCodes[scanType] || fallbackCodes["X-RAY"]];
    }
}

/**
 * Format codes for display
 */
export function formatCodesForDisplay(coding: CodingResult): {
    icd10Display: string[];
    cptDisplay: string[];
} {
    return {
        icd10Display: coding.icd10Codes.map(
            (c) => `${c.code} - ${c.description}${c.isPrimary ? " (Primary)" : ""}`
        ),
        cptDisplay: coding.cptCodes.map(
            (c) => `${c.code} - ${c.description}${c.units && c.units > 1 ? ` x${c.units}` : ""}`
        ),
    };
}
