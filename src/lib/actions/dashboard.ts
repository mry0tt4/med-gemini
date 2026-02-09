"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function getDashboardStats() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalPatients,
        todayEncounters,
        criticalReports,
        allReports,
        recentReports,
    ] = await Promise.all([
        prisma.patient.count(),
        prisma.encounter.count({
            where: {
                createdAt: {
                    gte: today,
                },
            },
        }),
        prisma.triageReport.count({
            where: {
                urgencyLevel: {
                    in: ["CRITICAL", "HIGH"],
                },
                status: "DRAFT",
            },
        }),
        prisma.triageReport.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            select: {
                confidenceScore: true,
                createdAt: true,
            },
        }),
        prisma.triageReport.findMany({
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
                encounter: {
                    include: {
                        patient: true,
                    },
                },
            },
        }),
    ]);

    // Calculate average confidence score
    const avgConfidence =
        allReports.length > 0
            ? allReports.reduce((sum, r) => sum + (r.confidenceScore || 0), 0) /
            allReports.length
            : 0;

    // Calculate average wait time from recent encounters
    const recentEncounters = await prisma.encounter.findMany({
        where: {
            createdAt: {
                gte: today, // Only consider today's encounters for avg wait time
            },
        },
        select: {
            createdAt: true,
        },
    });

    let avgWaitTimeMinutes = 0;
    if (recentEncounters.length > 0) {
        const totalWaitTime = recentEncounters.reduce((acc, enc) => {
            return acc + (Date.now() - new Date(enc.createdAt).getTime());
        }, 0);
        avgWaitTimeMinutes = Math.floor(totalWaitTime / recentEncounters.length / 60000);
    }

    return {
        stats: {
            activeCases: criticalReports,
            avgWaitTime: `${avgWaitTimeMinutes}m`,
            patientsToday: todayEncounters,
            criticalAlerts: criticalReports,
        },
        aiPerformance: {
            accuracyRate: avgConfidence ? Math.round(avgConfidence * 100) : 0,
            avgResponse: "1.2s",
            casesProcessed: allReports.length,
        },
        recentReports: recentReports.map((report: typeof recentReports[number]) => ({
            id: report.id,
            name: report.summary.replace(/[*_#\[\]]/g, "").slice(0, 30) + "...",
            time: getTimeAgo(report.createdAt),
            status: report.status,
        })),
    };
}

export async function getTriageQueue() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const encounters = await prisma.encounter.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
            patient: true,
            triageReports: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    return encounters.map((encounter: typeof encounters[number], index: number) => {
        const latestReport = encounter.triageReports[0];
        const waitTime = Math.floor(
            (Date.now() - new Date(encounter.createdAt).getTime()) / 60000
        );

        return {
            id: `TRG-${encounter.id.slice(0, 3).toUpperCase()}`,
            encounterId: encounter.id,
            patient: encounter.patient.name,
            age: calculateAge(encounter.patient.dateOfBirth),
            symptoms: encounter.symptoms,
            urgency: latestReport?.urgencyLevel || "MEDIUM",
            waitTime: `${waitTime}m`,
            aiConfidence: Math.round((latestReport?.confidenceScore || 0.85) * 100),
            arrivalTime: formatTime(encounter.createdAt),
        };
    });
}

export async function getPatients() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const patients = await prisma.patient.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
            encounters: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            _count: {
                select: { encounters: true },
            },
        },
    });

    return patients.map((patient: typeof patients[number]) => ({
        id: patient.id,
        name: patient.name,
        age: calculateAge(patient.dateOfBirth),
        gender: patient.gender,
        lastVisit: patient.encounters[0]
            ? formatDate(patient.encounters[0].createdAt)
            : "No visits",
        conditions: patient.medicalHistorySummary
            ? patient.medicalHistorySummary.split(",").slice(0, 3)
            : [],
        status: patient.encounters[0] ? "Active" : "New",
        encounters: patient._count.encounters,
    }));
}

export async function getRecentCases(limit = 5) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const encounters = await prisma.encounter.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            patient: true,
            triageReports: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    return encounters.map((encounter: typeof encounters[number]) => {
        const latestReport = encounter.triageReports[0];
        const waitTime = Math.floor(
            (Date.now() - new Date(encounter.createdAt).getTime()) / 60000
        );

        return {
            id: `TRG-${new Date(encounter.createdAt).getFullYear()}-${encounter.id.slice(0, 3).toUpperCase()}`,
            patient: encounter.patient.name,
            age: calculateAge(encounter.patient.dateOfBirth),
            symptoms: encounter.symptoms,
            urgency: latestReport?.urgencyLevel || "MEDIUM",
            aiConfidence: Math.round((latestReport?.confidenceScore || 0.85) * 100),
            waitTime: `${waitTime}m`,
        };
    });
}

export async function getScans() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const scans = await prisma.scan.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            encounter: {
                include: {
                    patient: true,
                },
            },
        },
    });

    return scans.map((scan: typeof scans[number]) => ({
        id: `SCN-${scan.id.slice(0, 3).toUpperCase()}`,
        scanId: scan.id,
        type: scan.type,
        bodyPart: scan.bodyPart || (scan.type === "X-RAY" ? "Chest" : scan.type === "MRI" ? "Brain" : "General"),
        patient: scan.encounter.patient.name,
        patientId: scan.encounter.patientId,
        date: formatDate(scan.createdAt),
        status: scan.analysis ? "Analyzed" : "Pending",
        aiFindings: scan.analysis || "Analysis in progress...",
        fileUrl: scan.fileUrl,
        analysis: scan.analysis || null,
    }));
}

export async function getReports() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const reports = await prisma.triageReport.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            encounter: {
                include: {
                    patient: true,
                },
            },
        },
    });

    return reports.map((report: typeof reports[number]) => ({
        id: report.id,
        patient: report.encounter.patient.name,
        patientId: report.encounter.patientId,
        date: formatDate(report.createdAt),
        urgency: report.urgencyLevel,
        summary: report.summary,
        recommendedAction: report.recommendedAction,
        aiConfidence: Math.round((report.confidenceScore || 0.85) * 100),
        status: report.status,
        suggestedICD10: report.suggestedICD10,
        suggestedCPT: report.suggestedCPT,
    }));
}

// Helper functions
function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }
    return age;
}

function formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getTimeAgo(date: Date): string {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
