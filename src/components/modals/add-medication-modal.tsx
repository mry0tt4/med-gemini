"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Pill, Plus, Loader2 } from "lucide-react";

interface AddMedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    onSuccess: () => void;
}

const routeOptions = [
    { value: "oral", label: "Oral" },
    { value: "topical", label: "Topical" },
    { value: "injection", label: "Injection" },
    { value: "inhalation", label: "Inhalation" },
    { value: "sublingual", label: "Sublingual" },
    { value: "rectal", label: "Rectal" },
    { value: "transdermal", label: "Transdermal" },
    { value: "other", label: "Other" },
];

const frequencyOptions = [
    { value: "once daily", label: "Once daily" },
    { value: "twice daily", label: "Twice daily" },
    { value: "three times daily", label: "Three times daily" },
    { value: "four times daily", label: "Four times daily" },
    { value: "every 8 hours", label: "Every 8 hours" },
    { value: "every 12 hours", label: "Every 12 hours" },
    { value: "as needed", label: "As needed (PRN)" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "other", label: "Other" },
];

export function AddMedicationModal({
    isOpen,
    onClose,
    patientId,
    patientName,
    onSuccess,
}: AddMedicationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [genericName, setGenericName] = useState("");
    const [dosage, setDosage] = useState("");
    const [frequency, setFrequency] = useState("once daily");
    const [route, setRoute] = useState("oral");
    const [startDate, setStartDate] = useState("");
    const [reason, setReason] = useState("");
    const [prescribedBy, setPrescribedBy] = useState("");
    const [notes, setNotes] = useState("");

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setName("");
            setGenericName("");
            setDosage("");
            setFrequency("once daily");
            setRoute("oral");
            setStartDate(new Date().toISOString().split("T")[0]);
            setReason("");
            setPrescribedBy("");
            setNotes("");
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/patients/${patientId}/medications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    genericName: genericName || null,
                    dosage: dosage || null,
                    frequency,
                    route,
                    status: "active",
                    startDate: startDate || null,
                    reason: reason || null,
                    prescribedBy: prescribedBy || null,
                    notes: notes || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add medication");
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-md border border-border bg-surface-1 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-1 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                                    <Pill className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Add Medication
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {patientName}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-md p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="rounded-md bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
                                    {error}
                                </div>
                            )}

                            {/* Medication Name */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Medication Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g., Metformin"
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Generic Name */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Generic Name
                                </label>
                                <input
                                    type="text"
                                    value={genericName}
                                    onChange={(e) => setGenericName(e.target.value)}
                                    placeholder="e.g., Metformin Hydrochloride"
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Dosage & Frequency */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Dosage
                                    </label>
                                    <input
                                        type="text"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                        placeholder="e.g., 500mg"
                                        className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Frequency
                                    </label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {frequencyOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Route & Start Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Route
                                    </label>
                                    <select
                                        value={route}
                                        onChange={(e) => setRoute(e.target.value)}
                                        className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {routeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Reason / Indication
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Type 2 Diabetes management"
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Prescribed By */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Prescribed By
                                </label>
                                <input
                                    type="text"
                                    value={prescribedBy}
                                    onChange={(e) => setPrescribedBy(e.target.value)}
                                    placeholder="e.g., Dr. Smith"
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Any additional notes..."
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    disabled={isLoading || !name}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-info px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            Add Medication
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
