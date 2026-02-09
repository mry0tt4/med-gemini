/**
 * Medical Scan Agent - GPT-5 Mini with Vision
 * 
 * This agent specializes in analyzing medical images using OpenAI's GPT-5 Mini
 * with vision capabilities. It can process X-rays, MRIs, CT scans, dermatology
 * images, and ultrasounds.
 */

import OpenAI from "openai";
import * as dicomParser from 'dicom-parser';
import { ScanAnalysisResult } from "./types";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

const SCAN_TYPE_PROMPTS: Record<string, string> = {
    "X-RAY": `You are an expert radiologist AI assistant specializing in X-ray analysis. 
Analyze this X-ray image and provide a detailed clinical assessment.

Focus on:
- Bone structure and alignment
- Soft tissue abnormalities
- Cardiac silhouette (if chest X-ray)
- Lung fields and parenchyma (if chest X-ray)
- Joint spaces and articular surfaces (if extremity)
- Any foreign bodies or implants
- Signs of fractures, dislocations, or degenerative changes`,

    "MRI": `You are an expert radiologist AI assistant specializing in MRI analysis.
Analyze this MRI image and provide a detailed clinical assessment.

Focus on:
- Tissue contrast and signal intensity
- Anatomical structures and their boundaries
- Any masses, lesions, or abnormal findings
- Edema or inflammation patterns
- Vascular structures
- Neural structures (if applicable)
- Comparison with normal anatomy`,

    "CT": `You are an expert radiologist AI assistant specializing in CT scan analysis.
Analyze this CT image and provide a detailed clinical assessment.

Focus on:
- Cross-sectional anatomy
- Density measurements and contrast enhancement
- Organ morphology and size
- Vascular structures and patency
- Any masses, nodules, or lesions
- Bone windows analysis (if applicable)
- Signs of acute pathology`,

    "DERM": `You are an expert dermatologist AI assistant specializing in skin lesion analysis.
Analyze this dermatological image and provide a detailed clinical assessment.

Focus on:
- ABCDE criteria (Asymmetry, Border, Color, Diameter, Evolution)
- Lesion morphology and characteristics
- Distribution pattern
- Surface texture and features
- Color variations within the lesion
- Comparison to common benign vs malignant patterns
- Signs requiring urgent attention`,

    "ULTRASOUND": `You are an expert sonographer AI assistant specializing in ultrasound analysis.
Analyze this ultrasound image and provide a detailed clinical assessment.

Focus on:
- Echogenicity patterns
- Anatomical landmarks and orientation
- Fluid collections or cysts
- Solid masses and their characteristics
- Blood flow patterns (if Doppler)
- Organ size and morphology
- Comparison with normal sonographic appearance`,
};

// Helper to extract text from DICOM buffer
function extractDicomData(byteArray: Uint8Array) {
    try {
        const dataSet = dicomParser.parseDicom(byteArray);

        return {
            patientName: dataSet.string('x00100010'),
            studyDate: dataSet.string('x00080020'),
            modality: dataSet.string('x00080060'),
            studyDescription: dataSet.string('x00081030'),
            seriesDescription: dataSet.string('x0008103e'),
            bodyPartExamined: dataSet.string('x00180015'),
            manufacturer: dataSet.string('x00080070'),
            institutionName: dataSet.string('x00080080'),
        };
    } catch (e) {
        console.error("Error parsing DICOM:", e);
        return null;
    }
}

export async function analyzeScanWithVision(
    imageUrl: string,
    scanType: string,
    bodyPart?: string,
    clinicalContext?: string,
    previewUrl?: string
): Promise<ScanAnalysisResult> {
    const startTime = Date.now();

    // If we have a preview URL (converted PNG from client), use that for vision
    // This solves the issue where AI cannot "see" raw DICOM files
    const visionUrl = previewUrl || imageUrl;

    const isDicom = imageUrl.toLowerCase().includes('.dcm') || imageUrl.toLowerCase().includes('dicom');

    // If we have a preview URL, we treat it as a standard image for the AI model
    // This allows it to "see" the scan content.
    // We only use the DICOM metadata fallback if we DON'T have a visual preview.
    const useDicomMetadataOnly = isDicom && !previewUrl;

    let systemPrompt = "";
    let userContent: any[] = [];

    // Prompt selection
    const typePrompt = SCAN_TYPE_PROMPTS[scanType] || SCAN_TYPE_PROMPTS["X-RAY"];
    const basePrompt = `${typePrompt}
    
${bodyPart ? `This is a ${scanType} scan of the ${bodyPart}.` : ""}
${clinicalContext ? `\nClinical Context:\n${clinicalContext}` : ""}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
    "findings": "Detailed description of all findings",
    "abnormalities": ["List of specific abnormalities found"],
    "severity": "One of: NORMAL, MILD, MODERATE, SEVERE",
    "confidence": 0.0-1.0,
    "recommendations": ["List of clinical recommendations"],
    "detailedAnalysis": "Step-by-step radiological analysis"
}`;

    try {
        if (useDicomMetadataOnly) {
            // Handle DICOM WITHOUT preview: Fetch and extract metadata only
            console.log("[ScanAgent] Processing DICOM file metadata (no preview available)...");
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const byteArray = new Uint8Array(arrayBuffer);
            const metadata = extractDicomData(byteArray);

            const dicomContext = metadata ? `
DICOM METADATA EXTRACTED:
- Modality: ${metadata.modality || 'Unknown'}
- Study Description: ${metadata.studyDescription || 'N/A'}
- Series Description: ${metadata.seriesDescription || 'N/A'}
- Body Part: ${metadata.bodyPartExamined || bodyPart || 'N/A'}
- Date: ${metadata.studyDate || 'N/A'}
            ` : "DICOM metadata could not be extracted.";

            systemPrompt = `${basePrompt}
            
NOTE: Use the provided DICOM metadata and clinical context to generate the assessment. 
The actual image pixel data is not available for direct visual analysis in this request, so base your analysis on the metadata descriptions and clinical context provided.
${dicomContext}

IMPORTANT: If the provided metadata is insufficient to form a detailed medical opinion, you MUST still return a valid JSON response.
In that case, set "findings" to "Insufficient metadata available for automated analysis. Manual review required.", "severity" to "NORMAL", and "confidence" to 0.1.
DO NOT refuse to generate the JSON.`;

            userContent = [
                {
                    type: "text",
                    text: "Please analyze this medical case based on the provided DICOM metadata and clinical context. Return valid JSON.",
                }
            ];
        } else {
            // Standard Image (JPEG/PNG) or DICOM with Preview
            // If it's a DICOM, we should try to extract metadata to help the AI
            let dicomContext = "";

            if (isDicom) {
                try {
                    console.log("[ScanAgent] Extracting metadata from original DICOM file for enhanced context...");
                    const response = await fetch(imageUrl); // Fetch original DICOM
                    const arrayBuffer = await response.arrayBuffer();
                    const byteArray = new Uint8Array(arrayBuffer);
                    const metadata = extractDicomData(byteArray);

                    if (metadata) {
                        dicomContext = `
DICOM METADATA:
- Modality: ${metadata.modality || 'Unknown'}
- Study Description: ${metadata.studyDescription || 'N/A'}
- Series Description: ${metadata.seriesDescription || 'N/A'}
- Body Part: ${metadata.bodyPartExamined || bodyPart || 'N/A'}
- Date: ${metadata.studyDate || 'N/A'}
                        `;
                    }
                } catch (e) {
                    console.warn("[ScanAgent] Failed to extract metadata for hybrid analysis:", e);
                }
            }

            systemPrompt = `${basePrompt}

${dicomContext ? `NOTE: This is a DICOM scan. I have provided the visual preview image AND the extracted metadata below. Use both for your analysis.
${dicomContext}` : ""}
            `;

            userContent = [
                {
                    type: "text",
                    text: "Please analyze this medical scan image and provide a comprehensive clinical assessment.",
                },
                {
                    type: "image_url",
                    image_url: {
                        url: visionUrl,
                        detail: "high",
                    },
                },
            ];
        }

        console.log(`[ScanAgent] Sending request to OpenAI (${useDicomMetadataOnly ? "DICOM Metadata" : "Vision"})...`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userContent,
                },
            ],
            max_completion_tokens: 2000,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "scan_analysis",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            findings: { type: "string" },
                            abnormalities: { type: "array", items: { type: "string" } },
                            severity: { type: "string", enum: ["NORMAL", "MILD", "MODERATE", "SEVERE"] },
                            confidence: { type: "number" },
                            recommendations: { type: "array", items: { type: "string" } },
                            detailedAnalysis: { type: "string" }
                        },
                        required: ["findings", "abnormalities", "severity", "confidence", "recommendations", "detailedAnalysis"],
                        additionalProperties: false
                    }
                }
            },
        });

        // Detailed logging for debugging
        console.log("[ScanAgent] OpenAI Response Info:", {
            id: response.id,
            model: response.model,
            usage: response.usage,
            finish_reason: response.choices[0]?.finish_reason,
        });

        const choice = response.choices[0];
        const content = choice?.message?.content || "";
        const refusal = choice?.message?.refusal;

        if (refusal) {
            console.error("[ScanAgent] Model refused to generate analysis:", refusal);
            throw new Error(`Model refusal: ${refusal}`);
        }

        if (!content) {
            console.error("[ScanAgent] Received empty content from model.");
            throw new Error("Empty response content from AI model");
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (error) {
            console.error("[ScanAgent] Failed to parse JSON content:", error);
            console.debug("[ScanAgent] Raw content:", content);
            parsed = {
                findings: "Analysis failed to produce structured output.",
                abnormalities: [],
                severity: "NORMAL",
                confidence: 0,
                recommendations: [],
                detailedAnalysis: "The AI model encountered an error while structuring the analysis."
            };
        }

        const processingTime = Date.now() - startTime;
        console.log(`[ScanAgent] Analyzed ${scanType} scan (${isDicom ? 'DICOM' : 'Image'}) in ${processingTime}ms`);

        return {
            scanId: "", // Will be set by caller
            scanType,
            findings: parsed.findings || "Analysis completed based on available data.",
            abnormalities: Array.isArray(parsed.abnormalities) ? parsed.abnormalities : [],
            severity: ["NORMAL", "MILD", "MODERATE", "SEVERE"].includes(parsed.severity)
                ? parsed.severity
                : "NORMAL",
            confidence: typeof parsed.confidence === "number"
                ? Math.min(1, Math.max(0, parsed.confidence))
                : 0.85,
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            rawAnalysis: parsed.detailedAnalysis || content,
        };
    } catch (error) {
        console.error("[ScanAgent] Error analyzing scan:", error);

        // Return a fallback analysis
        return {
            scanId: "",
            scanType,
            findings: `Unable to perform automated analysis of this ${scanType} scan. Manual radiologist review recommended.`,
            abnormalities: [],
            severity: "NORMAL",
            confidence: 0,
            recommendations: [
                "Manual radiologist review required",
                "Compare with prior imaging if available",
                "Correlate with clinical findings",
            ],
            rawAnalysis: "Automated analysis unavailable - please review manually.",
        };
    }
}

/**
 * Batch analyze multiple scans for a patient
 */
export async function analyzeMultipleScans(
    scans: Array<{ id: string; type: string; fileUrl: string; bodyPart?: string; previewUrl?: string }>,
    clinicalContext?: string
): Promise<ScanAnalysisResult[]> {
    const results = await Promise.all(
        scans.map(async (scan) => {
            const result = await analyzeScanWithVision(
                scan.fileUrl,
                scan.type,
                scan.bodyPart,
                clinicalContext,
                scan.previewUrl
            );
            return { ...result, scanId: scan.id };
        })
    );

    return results;
}
