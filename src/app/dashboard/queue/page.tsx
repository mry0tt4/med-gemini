import { getTriageQueue } from "@/lib/actions/dashboard";
import { QueueClient } from "./queue-client";

export const dynamic = "force-dynamic";

interface QueueItem {
    id: string;
    encounterId: string;
    patient: string;
    age: number;
    symptoms: string;
    urgency: string;
    waitTime: string;
    aiConfidence: number;
    arrivalTime: string;
}

export default async function QueuePage() {
    let queueItems: QueueItem[];

    try {
        queueItems = await getTriageQueue();
    } catch (error) {
        console.error("Failed to fetch queue data:", error);
        queueItems = [];
    }

    return <QueueClient queueItems={queueItems} />;
}
