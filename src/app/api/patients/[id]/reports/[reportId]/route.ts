import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// DELETE /api/patients/[id]/reports/[reportId] - Delete an external report
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; reportId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId, reportId } = await params;

        // Verify the report belongs to this patient
        const report = await prisma.externalReport.findFirst({
            where: {
                id: reportId,
                patientId,
            },
        });

        if (!report) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        // Delete the report
        await prisma.externalReport.delete({
            where: { id: reportId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting report:", error);
        return NextResponse.json(
            { error: "Failed to delete report" },
            { status: 500 }
        );
    }
}

// PATCH /api/patients/[id]/reports/[reportId] - Update an external report
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; reportId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: patientId, reportId } = await params;
        const body = await request.json();

        // Verify the report belongs to this patient
        const existing = await prisma.externalReport.findFirst({
            where: {
                id: reportId,
                patientId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        // Update the report
        const updatedReport = await prisma.externalReport.update({
            where: { id: reportId },
            data: {
                type: body.type ?? existing.type,
                title: body.title ?? existing.title,
                description: body.description ?? existing.description,
                reportDate: body.reportDate ? new Date(body.reportDate) : existing.reportDate,
                providerName: body.providerName ?? existing.providerName,
                providerAddress: body.providerAddress ?? existing.providerAddress,
                providerPhone: body.providerPhone ?? existing.providerPhone,
                fileUrl: body.fileUrl ?? existing.fileUrl,
                fileType: body.fileType ?? existing.fileType,
                extractedData: body.extractedData ?? existing.extractedData,
                findings: body.findings ?? existing.findings,
                conclusion: body.conclusion ?? existing.conclusion,
                status: body.status ?? existing.status,
                loincCode: body.loincCode ?? existing.loincCode,
            },
        });

        return NextResponse.json(updatedReport);
    } catch (error) {
        console.error("Error updating report:", error);
        return NextResponse.json(
            { error: "Failed to update report" },
            { status: 500 }
        );
    }
}
