import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function retrieveLongitudinalContext(patientId: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    // In a real system, this would query the patient's EHR data
    // For now, we simulate retrieving and summarizing patient history
    const prompt = `You are a clinical AI assistant. Generate a realistic but FICTIONAL patient medical history summary for a patient being triaged in an emergency department.

Include:
- Chronic conditions (1-3)
- Current medications
- Known allergies
- Recent healthcare encounters
- Relevant risk factors

Keep it concise (3-4 sentences) and clinically relevant. This is for demo purposes only.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Context Retrieval Error:", error);
        return "Patient history unavailable - recommend obtaining comprehensive history during encounter.";
    }
}

export async function generateICD10Codes(summary: string): Promise<string[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const prompt = `Based on the following clinical summary, suggest 2-4 relevant ICD-10 codes.

Clinical Summary: ${summary}

Respond with ONLY a JSON array of strings, each in format "CODE - Description". Example:
["I10 - Essential hypertension", "R07.9 - Chest pain, unspecified"]

No markdown, no explanation, just the array.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim());
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return ["R69 - Illness, unspecified"];
    }
}

export async function generateCPTCodes(actions: string): Promise<string[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const prompt = `Based on the following recommended clinical actions, suggest 2-3 relevant CPT codes for billing.

Actions: ${actions}

Respond with ONLY a JSON array of strings, each in format "CODE - Description". Example:
["99203 - Office visit, new patient", "93000 - ECG with interpretation"]

No markdown, no explanation, just the array.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim());
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return ["99201 - Office visit, minimal"];
    }
}
