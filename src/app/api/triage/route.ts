import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { patientId, name, dob, gender, symptoms, voiceTranscript, scanIds } = body;

        let patient;

        // Use existing patient if ID provided, otherwise create new
        if (patientId) {
            patient = await prisma.patient.findUnique({
                where: { id: patientId },
            });

            if (!patient) {
                return NextResponse.json(
                    { error: "Patient not found" },
                    { status: 404 }
                );
            }
        } else if (name && dob && gender) {
            // Create new patient
            patient = await prisma.patient.create({
                data: {
                    name,
                    dateOfBirth: new Date(dob),
                    gender,
                },
            });
        } else {
            return NextResponse.json(
                { error: "Either patientId or patient details (name, dob, gender) required" },
                { status: 400 }
            );
        }

        // Validate symptoms
        if (!symptoms) {
            return NextResponse.json(
                { error: "Symptoms are required" },
                { status: 400 }
            );
        }

        // Always create a NEW encounter for each triage request (thread-like history)
        const encounter = await prisma.encounter.create({
            data: {
                patientId: patient.id,
                symptoms,
                voiceTranscript: voiceTranscript || null,
                encounterType: "ambulatory",
                status: "in-progress",
            },
        });

        // Create a placeholder Triage Report in PROCESSING state
        const triageReport = await prisma.triageReport.create({
            data: {
                encounterId: encounter.id,
                summary: "AI Analysis in progress...",
                urgencyLevel: "PENDING",
                recommendedAction: "Please wait for AI analysis to complete.",
                suggestedICD10: [],
                suggestedCPT: [],
                status: "PROCESSING",
            }
        });

        // Send Event to Orchestrator (Inngest)
        try {
            await inngest.send({
                name: "triage.requested",
                data: {
                    encounterId: encounter.id,
                    patientId: patient.id,
                    symptoms,
                    voiceTranscript,
                    triageReportId: triageReport.id,
                    scanIds: scanIds || [], // Pass selected scan IDs
                },
            });
        } catch (inngestError) {
            console.error("Failed to trigger triage:", inngestError);
            // Don't fail the request if Inngest fails, but maybe update status to FAILED?
        }

        return NextResponse.json({
            success: true,
            encounterId: encounter.id,
            patientId: patient.id,
            triageReportId: triageReport.id,
        });
    } catch (error) {
        console.error("Triage Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
