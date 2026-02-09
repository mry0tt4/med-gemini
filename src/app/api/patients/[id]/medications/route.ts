import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/patients/[id]/medications - Get all medications for a patient
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

        const medications = await prisma.medication.findMany({
            where: { patientId },
            orderBy: [
                { status: "asc" }, // Active first
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json(medications);
    } catch (error) {
        console.error("Error fetching medications:", error);
        return NextResponse.json(
            { error: "Failed to fetch medications" },
            { status: 500 }
        );
    }
}

// POST /api/patients/[id]/medications - Create a new medication entry
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
        if (!body.name) {
            return NextResponse.json(
                { error: "Medication name is required" },
                { status: 400 }
            );
        }

        // Create medication entry (FHIR MedicationStatement compliant)
        const medication = await prisma.medication.create({
            data: {
                patientId,
                name: body.name,
                genericName: body.genericName || null,
                rxNormCode: body.rxNormCode || null,
                dosage: body.dosage || null,
                frequency: body.frequency || null,
                route: body.route || "oral",
                status: body.status || "active",
                startDate: body.startDate ? new Date(body.startDate) : null,
                endDate: body.endDate ? new Date(body.endDate) : null,
                prescribedBy: body.prescribedBy || null,
                prescriptionDate: body.prescriptionDate ? new Date(body.prescriptionDate) : null,
                reason: body.reason || null,
                pharmacy: body.pharmacy || null,
                refillsRemaining: body.refillsRemaining || null,
                notes: body.notes || null,
            },
        });

        return NextResponse.json(medication, { status: 201 });
    } catch (error) {
        console.error("Error creating medication:", error);
        return NextResponse.json(
            { error: "Failed to create medication" },
            { status: 500 }
        );
    }
}
