import { NextRequest, NextResponse } from "next/server";
import { generateUploadUrl } from "@/lib/aws/s3";
import { auth } from "@clerk/nextjs/server";

// POST /api/scans/presign - Get a pre-signed URL for S3 upload
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { fileName, contentType } = body;

        if (!fileName || !contentType) {
            return NextResponse.json(
                { error: "fileName and contentType are required" },
                { status: 400 }
            );
        }

        // Validate content type
        const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/dicom",
            "application/dicom",
            "application/octet-stream",
            "application/pdf",
        ];

        if (!validTypes.includes(contentType.toLowerCase())) {
            return NextResponse.json(
                { error: `Invalid file type: ${contentType}` },
                { status: 400 }
            );
        }

        const { uploadUrl, fileKey, publicUrl } = await generateUploadUrl(
            fileName,
            contentType,
            "scans"
        );

        return NextResponse.json({
            uploadUrl,
            fileKey,
            publicUrl,
        });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
