import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateViewUrl, extractFileKey } from "@/lib/aws/s3";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { fileUrl, fileKey } = body;

        // Get the file key from URL if not provided directly
        const key = fileKey || extractFileKey(fileUrl);

        if (!key) {
            return NextResponse.json({ error: "Invalid file URL or key" }, { status: 400 });
        }

        // Generate pre-signed URL for viewing/downloading
        const signedUrl = await generateViewUrl(key);

        return NextResponse.json({ signedUrl });
    } catch (error) {
        console.error("Error generating view URL:", error);
        return NextResponse.json(
            { error: "Failed to generate download URL" },
            { status: 500 }
        );
    }
}
