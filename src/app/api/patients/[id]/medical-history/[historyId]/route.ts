import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// DELETE /api/patients/[id]/medical-history/[historyId] - Delete a medical history entry
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; historyId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId, historyId } = await params;

        // Verify the history entry belongs to this patient
        const historyEntry = await prisma.medicalHistory.findFirst({
            where: {
                id: historyId,
                patientId,
            },
        });

        if (!historyEntry) {
            return NextResponse.json(
                { error: "Medical history entry not found" },
                { status: 404 }
            );
        }

        // Delete the entry
        await prisma.medicalHistory.delete({
            where: { id: historyId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting medical history:", error);
        return NextResponse.json(
            { error: "Failed to delete medical history" },
            { status: 500 }
        );
    }
}

// PATCH /api/patients/[id]/medical-history/[historyId] - Update a medical history entry
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; historyId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId, historyId } = await params;
        const body = await request.json();

        // Verify the history entry belongs to this patient
        const existingEntry = await prisma.medicalHistory.findFirst({
            where: {
                id: historyId,
                patientId,
            },
        });

        if (!existingEntry) {
            return NextResponse.json(
                { error: "Medical history entry not found" },
                { status: 404 }
            );
        }

        // Update the entry
        const updatedEntry = await prisma.medicalHistory.update({
            where: { id: historyId },
            data: {
                type: body.type ?? existingEntry.type,
                clinicalStatus: body.clinicalStatus ?? existingEntry.clinicalStatus,
                description: body.description ?? existingEntry.description,
                onsetDate: body.onsetDate ? new Date(body.onsetDate) : existingEntry.onsetDate,
                abatementDate: body.abatementDate ? new Date(body.abatementDate) : existingEntry.abatementDate,
                severity: body.severity ?? existingEntry.severity,
                icd10Code: body.icd10Code ?? existingEntry.icd10Code,
                snomedCode: body.snomedCode ?? existingEntry.snomedCode,
                notes: body.notes ?? existingEntry.notes,
                verificationStatus: body.verificationStatus ?? existingEntry.verificationStatus,
            },
        });

        return NextResponse.json(updatedEntry);
    } catch (error) {
        console.error("Error updating medical history:", error);
        return NextResponse.json(
            { error: "Failed to update medical history" },
            { status: 500 }
        );
    }
}
