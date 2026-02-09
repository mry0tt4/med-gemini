import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReportPageClient } from "./report-page-client";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
    const { id } = await params;

    // First try to find by report ID, then by encounter ID
    let report = await prisma.triageReport.findUnique({
        where: { id },
        include: {
            encounter: {
                include: {
                    patient: {
                        include: {
                            medications: {
                                where: { status: "active" },
                                orderBy: { createdAt: "desc" },
                            },
                            medicalHistory: {
                                orderBy: { createdAt: "desc" },
                                take: 10,
                            },
                        },
                    },
                },
            },
        },
    });

    // If not found by report ID, try to find by encounter ID
    if (!report) {
        report = await prisma.triageReport.findFirst({
            where: { encounterId: id },
            orderBy: { createdAt: "desc" },
            include: {
                encounter: {
                    include: {
                        patient: {
                            include: {
                                medications: {
                                    where: { status: "active" },
                                    orderBy: { createdAt: "desc" },
                                },
                                medicalHistory: {
                                    orderBy: { createdAt: "desc" },
                                    take: 10,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    if (!report) {
        notFound();
    }

    // Transform data for the client component
    const reportData = {
        id: report.id,
        summary: report.summary,
        urgencyLevel: report.urgencyLevel,
        recommendedAction: report.recommendedAction || "",
        reasoningChain: report.reasoningChain,
        confidenceScore: report.confidenceScore || 0,
        suggestedICD10: report.suggestedICD10 || [],
        suggestedCPT: report.suggestedCPT || [],
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        encounter: {
            id: report.encounter.id,
            symptoms: report.encounter.symptoms || "",
            voiceTranscript: report.encounter.voiceTranscript,
            chiefComplaint: report.encounter.chiefComplaint,
            createdAt: report.encounter.createdAt.toISOString(),
            patient: {
                id: report.encounter.patient.id,
                name: report.encounter.patient.name,
                gender: report.encounter.patient.gender,
                dateOfBirth: report.encounter.patient.dateOfBirth.toISOString(),
                medicalHistorySummary: report.encounter.patient.medicalHistorySummary,
                medications: report.encounter.patient.medications.map((m: typeof report.encounter.patient.medications[number]) => ({
                    id: m.id,
                    name: m.name,
                    dosage: m.dosage,
                    status: m.status,
                })),
                medicalHistory: report.encounter.patient.medicalHistory.map((h: typeof report.encounter.patient.medicalHistory[number]) => ({
                    id: h.id,
                    description: h.description,
                    category: h.type,
                })),
            },
        },
    };

    return <ReportPageClient report={reportData} />;
}
