import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { PatientDetailClient } from "./patient-detail-client";

interface PatientPageProps {
    params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: PatientPageProps) {
    const { userId } = await auth();
    if (!userId) {
        notFound();
    }

    const { id } = await params;

    const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
            encounters: {
                orderBy: { createdAt: "desc" },
                include: {
                    scans: true,
                    triageReports: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
            // Include EHR data
            medicalHistory: {
                orderBy: { createdAt: "desc" },
            },
            medications: {
                orderBy: [
                    { status: "asc" }, // Active first
                    { createdAt: "desc" },
                ],
            },
            externalReports: {
                orderBy: { reportDate: "desc" },
            },
        },
    });

    if (!patient) {
        notFound();
    }

    // Transform the data for the client component
    const patientData = {
        id: patient.id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth.toISOString(),
        gender: patient.gender,
        medicalHistorySummary: patient.medicalHistorySummary,
        createdAt: patient.createdAt.toISOString(),
        encounters: patient.encounters.map((enc) => ({
            id: enc.id,
            symptoms: enc.symptoms,
            voiceTranscript: enc.voiceTranscript,
            createdAt: enc.createdAt.toISOString(),
            scans: enc.scans.map((scan) => ({
                id: scan.id,
                type: scan.type,
                fileUrl: scan.fileUrl,
                analysis: scan.analysis,
                createdAt: scan.createdAt.toISOString(),
            })),
            triageReports: enc.triageReports.map((report) => ({
                id: report.id,
                summary: report.summary,
                urgencyLevel: report.urgencyLevel,
                recommendedAction: report.recommendedAction,
                confidenceScore: report.confidenceScore,
                status: report.status,
                suggestedICD10: report.suggestedICD10,
                suggestedCPT: report.suggestedCPT,
                createdAt: report.createdAt.toISOString(),
            })),
        })),
        // EHR data
        medicalHistory: patient.medicalHistory.map((h) => ({
            id: h.id,
            type: h.type,
            clinicalStatus: h.clinicalStatus,
            description: h.description,
            onsetDate: h.onsetDate?.toISOString() || null,
            severity: h.severity,
            icd10Code: h.icd10Code,
        })),
        medications: patient.medications.map((m) => ({
            id: m.id,
            name: m.name,
            genericName: m.genericName,
            dosage: m.dosage,
            frequency: m.frequency,
            route: m.route,
            status: m.status,
            startDate: m.startDate?.toISOString() || null,
            reason: m.reason,
        })),
        externalReports: patient.externalReports.map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            reportDate: r.reportDate.toISOString(),
            providerName: r.providerName,
            findings: r.findings,
            conclusion: r.conclusion,
            fileUrl: r.fileUrl,
        })),
    };

    return <PatientDetailClient patient={patientData} />;
}
