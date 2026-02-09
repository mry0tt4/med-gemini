import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateViewUrl, extractFileKey } from "@/lib/aws/s3";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * POST /api/patients/[id]/reports/extract
 * 
 * Extracts structured data from an uploaded medical report (PDF or image)
 * using Gemini 3 Flash for fast, accurate extraction.
 * 
 * This endpoint receives a file URL and uses AI to extract:
 * - Report type and title
 * - Provider information
 * - Key findings and conclusions
 * - Lab values (if applicable)
 * - Diagnoses and recommendations
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId } = await params;
        const body = await request.json();

        if (!body.fileUrl) {
            return NextResponse.json(
                { error: "fileUrl is required" },
                { status: 400 }
            );
        }

        const { fileUrl, fileType = "image" } = body;

        // Fetch the file for processing
        let fileData: string;
        let mimeType: string;

        try {
            let response = await fetch(fileUrl);

            // If fetch fails (likely 403 Forbidden for S3), try to sign the URL
            if (!response.ok) {
                console.log(`Initial fetch failed with status ${response.status}. Attempting to sign URL...`);
                const key = extractFileKey(fileUrl);
                if (key) {
                    try {
                        const signedUrl = await generateViewUrl(key);
                        console.log("Generated signed URL, retrying fetch...");
                        response = await fetch(signedUrl);
                    } catch (signErr) {
                        console.error("Failed to sign URL:", signErr);
                    }
                }
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            const buffer = await response.arrayBuffer();
            fileData = Buffer.from(buffer).toString("base64");

            // Determine mime type
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("pdf")) {
                mimeType = "application/pdf";
            } else if (contentType.includes("png")) {
                mimeType = "image/png";
            } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
                mimeType = "image/jpeg";
            } else {
                mimeType = fileType === "pdf" ? "application/pdf" : "image/jpeg";
            }
        } catch (error) {
            console.error("Error fetching file:", error);
            return NextResponse.json(
                { error: "Failed to fetch file for processing" },
                { status: 400 }
            );
        }

        // Use Gemini 3 Flash for fast extraction
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        const extractionPrompt = `You are a medical document extraction AI. Analyze this medical report and extract structured data.

Extract the following information from this medical report. If a field is not found, use null.

Respond with ONLY valid JSON in this exact format:
{
    "reportType": "lab | pathology | radiology | cardiology | other",
    "title": "Report title or test name",
    "reportDate": "YYYY-MM-DD format if found, or null",
    
    "provider": {
        "name": "Healthcare provider/facility name",
        "address": "Provider address if found",
        "phone": "Provider phone if found"
    },
    
    "patient": {
        "name": "Patient name if visible",
        "dob": "Patient DOB if found",
        "mrn": "Medical record number if found"
    },
    
    "findings": "Key findings from the report (summarized)",
    "conclusion": "Conclusion or impression from the report",
    
    "labValues": [
        {
            "testName": "Name of test",
            "value": "Result value",
            "unit": "Unit of measurement",
            "referenceRange": "Normal range if provided",
            "flag": "H (high), L (low), or null if normal"
        }
    ],
    
    "diagnoses": ["List of diagnoses mentioned"],
    
    "recommendations": ["List of recommendations or follow-ups"],
    
    "medications": ["Any medications mentioned in the report"],
    
    "loincCode": "LOINC code if identifiable from the report type"
}

Be thorough but accurate. Only extract information that is clearly present in the document.`;

        try {
            const result = await model.generateContent([
                { text: extractionPrompt },
                {
                    inlineData: {
                        mimeType,
                        data: fileData,
                    },
                },
            ]);

            const responseText = result.response.text();

            // Parse JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return NextResponse.json(
                    { error: "Failed to extract structured data from document" },
                    { status: 500 }
                );
            }

            const extractedData = JSON.parse(jsonMatch[0]);

            // Format the response for easy form auto-fill
            const formData = {
                type: extractedData.reportType || "other",
                title: extractedData.title || "Uploaded Report",
                reportDate: extractedData.reportDate || new Date().toISOString().split("T")[0],
                providerName: extractedData.provider?.name || null,
                providerAddress: extractedData.provider?.address || null,
                providerPhone: extractedData.provider?.phone || null,
                findings: extractedData.findings || null,
                conclusion: extractedData.conclusion || null,
                extractedData: extractedData, // Full extracted data for reference
            };

            return NextResponse.json({
                success: true,
                formData,
                rawExtraction: extractedData,
            });
        } catch (error) {
            console.error("AI extraction error:", error);
            return NextResponse.json(
                { error: "Failed to process document with AI" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error extracting report data:", error);
        return NextResponse.json(
            { error: "Failed to extract report data" },
            { status: 500 }
        );
    }
}
