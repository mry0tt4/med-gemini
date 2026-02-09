import { getReports } from "@/lib/actions/dashboard";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

interface Report {
    id: string;
    patient: string;
    patientId: string;
    date: string;
    urgency: string;
    summary: string;
    recommendedAction: string;
    aiConfidence: number;
    status: string;
    suggestedICD10: string[];
    suggestedCPT: string[];
}

export default async function ReportsPage() {
    let reports: Report[];

    try {
        reports = await getReports();
    } catch (error) {
        console.error("Failed to fetch reports data:", error);
        reports = [];
    }

    return <ReportsClient reports={reports} />;
}
