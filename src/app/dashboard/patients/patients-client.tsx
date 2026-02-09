"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
    Search,
    Plus,
    ChevronRight,
    Calendar,
    Activity,
    AlertCircle,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddPatientModal } from "@/components/modals";
import { useRouter } from "next/navigation";

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

interface PatientsClientProps {
    patients: Patient[];
}

export function PatientsClient({ patients }: PatientsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const router = useRouter();

    const filteredPatients = patients.filter(
        (patient) =>
            searchQuery === "" ||
            patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePatientCreated = () => {
        // Refresh the page to get updated data
        router.refresh();
    };

    return (
        <>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
                            Patients
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {patients.length} patients in your care
                        </p>
                    </div>
                    <motion.button
                        onClick={() => setShowAddModal(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
                    >
                        <Plus className="h-4 w-4" />
                        Add Patient
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search patients by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-surface-1 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                </div>

                {/* Patients Grid */}
                {filteredPatients.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-surface-1"
                    >
                        <Users className="h-16 w-16 text-muted mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No patients found</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            {patients.length === 0
                                ? "Add your first patient to get started with AI-assisted triage."
                                : "No patients match your search criteria."}
                        </p>
                        {patients.length === 0 && (
                            <motion.button
                                onClick={() => setShowAddModal(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
                            >
                                <Plus className="h-4 w-4" />
                                Add First Patient
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredPatients.map((patient, index) => (
                            <motion.div
                                key={patient.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    href={`/dashboard/patients/${patient.id}`}
                                    className="group block rounded-2xl border border-border bg-surface-1 p-6 transition-all hover:border-primary/30 hover:bg-surface-2"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-info/20 text-lg font-bold text-primary">
                                                {patient.name.split(" ").map(n => n[0]).join("")}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {patient.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {patient.age}y • {patient.gender} • {patient.id.slice(0, 8)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "rounded-full px-2 py-0.5 text-xs font-medium",
                                            patient.status === "Active"
                                                ? "bg-success/10 text-success"
                                                : "bg-muted/10 text-muted-foreground"
                                        )}>
                                            {patient.status}
                                        </span>
                                    </div>

                                    {/* Conditions */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="h-4 w-4 text-muted" />
                                            <span className="text-xs font-medium uppercase text-muted">Conditions</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {patient.conditions.length > 0 ? (
                                                patient.conditions.map((condition) => (
                                                    <span
                                                        key={condition}
                                                        className="rounded-md bg-surface-2 px-2 py-1 text-xs text-foreground"
                                                    >
                                                        {condition.trim()}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No conditions recorded</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {patient.lastVisit}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Activity className="h-4 w-4" />
                                                {patient.encounters} visits
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Patient Modal */}
            <AddPatientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handlePatientCreated}
            />
        </>
    );
}
