import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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

        // Verify the triage report exists
        const triageReport = await prisma.triageReport.findUnique({
            where: { id },
        });

        if (!triageReport) {
            return NextResponse.json(
                { error: "Triage Report not found" },
                { status: 404 }
            );
        }

        // Delete the report
        await prisma.triageReport.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting triage report:", error);
        return NextResponse.json(
            { error: "Failed to delete triage report" },
            { status: 500 }
        );
    }
}
