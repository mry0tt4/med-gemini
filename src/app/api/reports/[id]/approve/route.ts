import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// POST /api/reports/[id]/approve - Approve/finalize a triage report
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if report exists
        const report = await prisma.triageReport.findUnique({
            where: { id },
        });

        if (!report) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        // Update report status to FINALIZED
        const updatedReport = await prisma.triageReport.update({
            where: { id },
            data: { status: "FINALIZED" },
        });

        return NextResponse.json({
            success: true,
            report: updatedReport,
        });
    } catch (error) {
        console.error("Error approving report:", error);
        return NextResponse.json(
            { error: "Failed to approve report" },
            { status: 500 }
        );
    }
}
