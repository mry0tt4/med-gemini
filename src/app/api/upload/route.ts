import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const encounterId = formData.get("encounterId") as string;
        const type = formData.get("type") as string; // X-RAY, DERM, etc.

        if (!file || !encounterId) {
            return NextResponse.json({ error: "Missing file or encounterId" }, { status: 400 });
        }

        // MOCK S3 UPLOAD
        // In reality: valid S3 putObject or Presigned URL
        const mockS3Url = `https://s3.amazonaws.com/med-gemini-bucket/${encounterId}/${file.name}`;

        // Trigger Scan Uploaded event
        await inngest.send({
            name: "scan.uploaded",
            data: {
                encounterId,
                scanId: Math.random().toString(36).substring(7), // Mock ID
                fileUrl: mockS3Url,
                type: type || "UNKNOWN"
            }
        });

        return NextResponse.json({ success: true, url: mockS3Url });
    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ success: false, error: "Upload Failed" }, { status: 500 });
    }
}
