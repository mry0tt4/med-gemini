import { getScans, getPatients } from "@/lib/actions/dashboard";
import { ScansClient } from "./scans-client";

export const dynamic = "force-dynamic";

interface Scan {
    id: string;
    scanId: string;
    type: string;
    bodyPart: string;
    patient: string;
    patientId: string;
    date: string;
    status: string;
    aiFindings: string;
    fileUrl: string;
    analysis?: string | null;
}

interface Patient {
    id: string;
    name: string;
}

export default async function ScansPage() {
    let scans: Scan[];
    let patients: Patient[];

    try {
        scans = await getScans();
    } catch (error) {
        console.error("Failed to fetch scans data:", error);
        scans = [];
    }

    try {
        const patientsData = await getPatients();
        patients = patientsData.map(p => ({ id: p.id, name: p.name }));
    } catch (error) {
        console.error("Failed to fetch patients data:", error);
        patients = [];
    }

    return <ScansClient scans={scans} patients={patients} />;
}
