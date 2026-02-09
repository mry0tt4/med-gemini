import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Client Configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "med-agent-scans";

/**
 * Generate a pre-signed URL for uploading a file to S3
 * This allows secure direct uploads from the client
 */
export async function generateUploadUrl(
    fileName: string,
    contentType: string,
    folder: string = "scans"
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `${folder}/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

    // Construct the public URL (assumes bucket is configured for public access or CloudFront)
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${fileKey}`;

    return {
        uploadUrl,
        fileKey,
        publicUrl,
    };
}

/**
 * Generate a pre-signed URL for viewing/downloading a file from S3
 * Use this for private files that need temporary access
 */
export async function generateViewUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
}

/**
 * Delete a file from S3
 */
export async function deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    });

    await s3Client.send(command);
}

/**
 * Extract the file key from a full S3 URL
 */
export function extractFileKey(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // Remove leading slash from pathname
        return urlObj.pathname.substring(1);
    } catch {
        return null;
    }
}

/**
 * Validate image file type
 */
export function isValidImageType(contentType: string): boolean {
    const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/dicom",
        "application/dicom",
    ];
    return validTypes.includes(contentType.toLowerCase());
}

/**
 * Get the maximum file size allowed (in bytes)
 * Default: 50MB for medical scans
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
