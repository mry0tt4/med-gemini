import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// DELETE /api/patients/[id]/medications/[medicationId] - Delete a medication
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; medicationId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId, medicationId } = await params;

        // Verify the medication belongs to this patient
        const medication = await prisma.medication.findFirst({
            where: {
                id: medicationId,
                patientId,
            },
        });

        if (!medication) {
            return NextResponse.json(
                { error: "Medication not found" },
                { status: 404 }
            );
        }

        // Delete the medication
        await prisma.medication.delete({
            where: { id: medicationId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting medication:", error);
        return NextResponse.json(
            { error: "Failed to delete medication" },
            { status: 500 }
        );
    }
}

// PATCH /api/patients/[id]/medications/[medicationId] - Update a medication
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; medicationId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId, medicationId } = await params;
        const body = await request.json();

        // Verify the medication belongs to this patient
        const existing = await prisma.medication.findFirst({
            where: {
                id: medicationId,
                patientId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Medication not found" },
                { status: 404 }
            );
        }

        // Update the medication
        const updatedMedication = await prisma.medication.update({
            where: { id: medicationId },
            data: {
                name: body.name ?? existing.name,
                genericName: body.genericName ?? existing.genericName,
                rxNormCode: body.rxNormCode ?? existing.rxNormCode,
                dosage: body.dosage ?? existing.dosage,
                frequency: body.frequency ?? existing.frequency,
                route: body.route ?? existing.route,
                status: body.status ?? existing.status,
                startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
                endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
                prescribedBy: body.prescribedBy ?? existing.prescribedBy,
                prescriptionDate: body.prescriptionDate ? new Date(body.prescriptionDate) : existing.prescriptionDate,
                reason: body.reason ?? existing.reason,
                pharmacy: body.pharmacy ?? existing.pharmacy,
                refillsRemaining: body.refillsRemaining ?? existing.refillsRemaining,
                notes: body.notes ?? existing.notes,
            },
        });

        return NextResponse.json(updatedMedication);
    } catch (error) {
        console.error("Error updating medication:", error);
        return NextResponse.json(
            { error: "Failed to update medication" },
            { status: 500 }
        );
    }
}
