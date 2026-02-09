import { getPatients } from "@/lib/actions/dashboard";
import { PatientsClient } from "./patients-client";

export const dynamic = "force-dynamic";

interface Patient {
    id: string;
    name: string;
    age: number;
    gender: string;
    lastVisit: string;
    conditions: string[];
    status: string;
    encounters: number;
}

export default async function PatientsPage() {
    let patients: Patient[];

    try {
        patients = await getPatients();
    } catch (error) {
        console.error("Failed to fetch patients data:", error);
        patients = [];
    }

    return <PatientsClient patients={patients} />;
}
