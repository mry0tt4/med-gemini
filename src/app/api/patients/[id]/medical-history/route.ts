import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/patients/[id]/medical-history - Get all medical history for a patient
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId } = await params;

        const history = await prisma.medicalHistory.findMany({
            where: { patientId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching medical history:", error);
        return NextResponse.json(
            { error: "Failed to fetch medical history" },
            { status: 500 }
        );
    }
}

// POST /api/patients/[id]/medical-history - Create a new medical history entry
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

        // Validate patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
        });

        if (!patient) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 });
        }

        // Validate required fields
        if (!body.type || !body.description) {
            return NextResponse.json(
                { error: "type and description are required" },
                { status: 400 }
            );
        }

        // Create medical history entry (FHIR Condition compliant)
        const historyEntry = await prisma.medicalHistory.create({
            data: {
                patientId,
                type: body.type,
                clinicalStatus: body.clinicalStatus || "active",
                description: body.description,
                onsetDate: body.onsetDate ? new Date(body.onsetDate) : null,
                abatementDate: body.abatementDate ? new Date(body.abatementDate) : null,
                severity: body.severity || null,
                icd10Code: body.icd10Code || null,
                snomedCode: body.snomedCode || null,
                notes: body.notes || null,
                verificationStatus: body.verificationStatus || "confirmed",
            },
        });

        return NextResponse.json(historyEntry, { status: 201 });
    } catch (error) {
        console.error("Error creating medical history:", error);
        return NextResponse.json(
            { error: "Failed to create medical history" },
            { status: 500 }
        );
    }
}
