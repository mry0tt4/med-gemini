import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// GET /api/patients/[id]/reports - Get all external reports for a patient
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

        const reports = await prisma.externalReport.findMany({
            where: { patientId },
            orderBy: { reportDate: "desc" },
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json(
            { error: "Failed to fetch reports" },
            { status: 500 }
        );
    }
}

// POST /api/patients/[id]/reports - Create a new external report
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
        if (!body.type || !body.title || !body.reportDate) {
            return NextResponse.json(
                { error: "type, title, and reportDate are required" },
                { status: 400 }
            );
        }

        // Create external report entry (FHIR DiagnosticReport compliant)
        const report = await prisma.externalReport.create({
            data: {
                patientId,
                type: body.type,
                title: body.title,
                description: body.description || null,
                reportDate: new Date(body.reportDate),
                providerName: body.providerName || null,
                providerAddress: body.providerAddress || null,
                providerPhone: body.providerPhone || null,
                fileUrl: body.fileUrl || null,
                fileType: body.fileType || null,
                extractedData: body.extractedData || null,
                findings: body.findings || null,
                conclusion: body.conclusion || null,
                status: body.status || "final",
                loincCode: body.loincCode || null,
            },
        });

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error("Error creating report:", error);
        return NextResponse.json(
            { error: "Failed to create report" },
            { status: 500 }
        );
    }
}
