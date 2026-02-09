import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                encounters: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        scans: true,
                        triageReports: true,
                    },
                },
            },
        });

        if (!patient) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 });
        }

        return NextResponse.json(patient);
    } catch (error) {
        console.error("Error fetching patient:", error);
        return NextResponse.json(
            { error: "Failed to fetch patient" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Validate patient exists
        const existingPatient = await prisma.patient.findUnique({
            where: { id },
        });

        if (!existingPatient) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 });
        }

        // Update patient
        const updatedPatient = await prisma.patient.update({
            where: { id },
            data: {
                name: body.name ?? existingPatient.name,
                dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : existingPatient.dateOfBirth,
                gender: body.gender ?? existingPatient.gender,
                medicalHistorySummary: body.medicalHistorySummary ?? existingPatient.medicalHistorySummary,
            },
        });

        return NextResponse.json(updatedPatient);
    } catch (error) {
        console.error("Error updating patient:", error);
        return NextResponse.json(
            { error: "Failed to update patient" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.patient.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting patient:", error);
        return NextResponse.json(
            { error: "Failed to delete patient" },
            { status: 500 }
        );
    }
}
