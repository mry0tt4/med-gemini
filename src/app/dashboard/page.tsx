import { getDashboardStats, getRecentCases, getPatients } from "@/lib/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

interface RecentCase {
    id: string;
    patient: string;
    age: number;
    symptoms: string;
    urgency: string;
    aiConfidence: number;
    waitTime: string;
}

interface Patient {
    id: string;
    name: string;
}

interface DashboardStats {
    stats: {
        activeCases: number;
        avgWaitTime: string;
        patientsToday: number;
        criticalAlerts: number;
    };
    aiPerformance: {
        accuracyRate: number;
        avgResponse: string;
        casesProcessed: number;
    };
    recentReports: Array<{
        id: string;
        name: string;
        time: string;
        status: string;
    }>;
}

export default async function DashboardPage() {
    // Fetch real data from the database
    let stats: DashboardStats;
    let recentCases: RecentCase[];
    let patients: Patient[];

    try {
        [stats, recentCases] = await Promise.all([
            getDashboardStats(),
            getRecentCases(5),
        ]);
    } catch (error) {
        // Fallback to empty data if database is not available
        console.error("Failed to fetch dashboard data:", error);
        stats = {
            stats: {
                activeCases: 0,
                avgWaitTime: "0m",
                patientsToday: 0,
                criticalAlerts: 0,
            },
            aiPerformance: {
                accuracyRate: 0,
                avgResponse: "0s",
                casesProcessed: 0,
            },
            recentReports: [],
        };
        recentCases = [];
    }

    try {
        const patientsData = await getPatients();
        patients = patientsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
    } catch (error) {
        console.error("Failed to fetch patients:", error);
        patients = [];
    }

    return <DashboardClient data={stats} recentCases={recentCases} patients={patients} />;
}
