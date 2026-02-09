import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";

// GET /api/scans - Get all scans
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const scans = await prisma.scan.findMany({
            include: {
                encounter: {
                    include: {
                        patient: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(scans);
    } catch (error) {
        console.error("Error fetching scans:", error);
        return NextResponse.json(
            { error: "Failed to fetch scans" },
            { status: 500 }
        );
    }
}

// POST /api/scans - Create a new scan record and trigger AI analysis
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            patientId,
            scanType,
            bodyPart,
            notes,
            fileUrl,
            previewUrl,
            fileFormat = "image",
            dicomMetadata,
            studyInstanceUid,
            seriesInstanceUid,
            sopInstanceUid,
            studyDate,
            studyDescription,
        } = body;

        // Validate required fields
        if (!patientId || !scanType || !fileUrl) {
            return NextResponse.json(
                { error: "patientId, scanType, and fileUrl are required" },
                { status: 400 }
            );
        }

        // Check if patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
        });

        if (!patient) {
            return NextResponse.json(
                { error: "Patient not found" },
                { status: 404 }
            );
        }

        // Create an encounter for this scan if needed
        // First check for existing open encounter
        let encounter = await prisma.encounter.findFirst({
            where: {
                patientId,
                status: "in-progress",
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
                },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!encounter) {
            // Create a new encounter
            encounter = await prisma.encounter.create({
                data: {
                    patientId,
                    symptoms: `Scan upload: ${scanType}${bodyPart ? ` - ${bodyPart}` : ""}${notes ? `. Notes: ${notes}` : ""}`,
                    encounterType: "ambulatory",
                    status: "in-progress",
                },
            });
        }

        // Determine DICOM modality from scan type
        const modalityMap: Record<string, string> = {
            "X-RAY": "DX",     // Digital Radiography
            "CT": "CT",        // Computed Tomography
            "MRI": "MR",       // Magnetic Resonance
            "ULTRASOUND": "US", // Ultrasound
            "DERM": "XC",      // External-camera Photography
        };

        // Create the scan record with DICOM support
        const scan = await prisma.scan.create({
            data: {
                encounterId: encounter.id,
                type: scanType,
                modality: modalityMap[scanType] || scanType,
                bodyPart: bodyPart || null,
                fileUrl,
                ...(previewUrl ? { previewUrl: previewUrl as any } : {}),
                fileFormat,
                dicomMetadata: dicomMetadata || null,
                studyInstanceUid: studyInstanceUid || null,
                seriesInstanceUid: seriesInstanceUid || null,
                sopInstanceUid: sopInstanceUid || null,
                studyDate: studyDate ? new Date(studyDate) : null,
                studyDescription: studyDescription || null,
                notes: notes || null,
                analysis: null, // Will be populated by AI analysis
            },
        });

        // Trigger automatic AI scan analysis via Inngest
        await inngest.send({
            name: "scan.uploaded",
            data: {
                scanId: scan.id,
                encounterId: encounter.id,
                patientId,
                scanType,
                fileUrl,
                previewUrl: previewUrl || undefined,
                bodyPart: bodyPart || undefined,
            },
        });

        return NextResponse.json(
            {
                id: scan.id,
                type: scan.type,
                modality: scan.modality,
                fileUrl: scan.fileUrl,
                fileFormat: scan.fileFormat,
                encounterId: encounter.id,
                message: "Scan uploaded successfully. AI analysis started.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating scan:", error);
        return NextResponse.json(
            { error: "Failed to create scan" },
            { status: 500 }
        );
    }
}

