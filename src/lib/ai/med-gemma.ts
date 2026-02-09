import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeSymptoms(symptoms: string, context: string): Promise<{
    summary: string;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    actions: string;
    reasoning: string;
}> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const prompt = `You are Med-Gemma, a clinical AI triage assistant. Analyze the following patient presentation and provide a structured clinical assessment.

## Patient Context
${context}

## Current Symptoms
${symptoms}

## Instructions
Provide a JSON response with EXACTLY this structure (no markdown, just raw JSON):
{
  "summary": "A 2-3 sentence clinical summary of the patient's presentation",
  "urgency": "One of: LOW, MEDIUM, HIGH, or CRITICAL based on clinical acuity",
  "actions": "Numbered list of recommended immediate clinical actions",
  "reasoning": "Step-by-step clinical reasoning explaining your assessment"
}

Respond ONLY with the JSON object, no additional text.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            summary: parsed.summary || "Analysis completed.",
            urgency: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(parsed.urgency)
                ? parsed.urgency
                : "MEDIUM",
            actions: parsed.actions || "Further evaluation recommended.",
            reasoning: parsed.reasoning || "Clinical assessment completed.",
        };
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return {
            summary: `Patient presents with: ${symptoms}. Further evaluation recommended.`,
            urgency: "MEDIUM",
            actions: "1. Complete vital signs\n2. Detailed history\n3. Physical examination",
            reasoning: "Automated fallback - manual review required.",
        };
    }
}

export async function analyzeScan(imageUrl: string, scanType: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const prompt = `You are Med-Gemma, a clinical AI assistant specializing in medical imaging analysis.

A ${scanType} scan has been uploaded for analysis.
Image reference: ${imageUrl}

Since the actual image cannot be processed in this context, provide a template response for what a radiologist would look for in a ${scanType} examination. Include:
1. Key anatomical structures to evaluate
2. Common findings to assess
3. Recommended follow-up if abnormalities detected

Keep the response clinical and professional.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Scan Analysis Error:", error);
        return `${scanType} analysis pending - manual radiologist review recommended.`;
    }
}
