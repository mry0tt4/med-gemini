"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { motion } from "motion/react";
import {
    Heart,
    Plus,
    Loader2,
    AlertCircle,
    Pill,
    Activity,
    Scissors,
    AlertTriangle,
    ChevronDown,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddMedicalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    currentHistory: string | null;
    onSuccess?: () => void;
}

const HISTORY_TYPES = [
    { value: "condition", label: "Chronic Condition", icon: Heart, color: "text-danger" },
    { value: "allergy", label: "Allergy", icon: AlertTriangle, color: "text-warning" },
    { value: "medication", label: "Current Medication", icon: Pill, color: "text-info" },
    { value: "surgery", label: "Past Surgery", icon: Scissors, color: "text-primary" },
    { value: "other", label: "Other", icon: Activity, color: "text-muted-foreground" },
];

// Boxy input styling
const inputBaseStyles = "w-full h-10 rounded-md border border-border bg-surface-2 px-3 pr-10 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";
const labelStyles = "block text-sm font-medium text-foreground mb-2";

interface HistoryEntry {
    type: string;
    description: string;
    date?: string;
}

export function AddMedicalHistoryModal({
    isOpen,
    onClose,
    patientId,
    patientName,
    currentHistory,
    onSuccess,
}: AddMedicalHistoryModalProps) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [currentEntry, setCurrentEntry] = useState<HistoryEntry>({
        type: "",
        description: "",
        date: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const addEntry = () => {
        if (!currentEntry.type || !currentEntry.description) {
            setError("Please select a type and enter a description");
            return;
        }
        setEntries([...entries, currentEntry]);
        setCurrentEntry({ type: "", description: "", date: "" });
        setError("");
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Add current entry if filled
        let allEntries = [...entries];
        if (currentEntry.type && currentEntry.description) {
            allEntries.push(currentEntry);
        }

        if (allEntries.length === 0) {
            setError("Please add at least one medical history entry");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Format the history as a summary string
            const newHistorySummary = allEntries.map(entry => {
                const typeInfo = HISTORY_TYPES.find(t => t.value === entry.type);
                const dateStr = entry.date ? ` (${entry.date})` : "";
                return `${typeInfo?.label || entry.type}: ${entry.description}${dateStr}`;
            }).join("; ");

            // Combine with existing history
            const combinedHistory = currentHistory
                ? `${currentHistory}; ${newHistorySummary}`
                : newHistorySummary;

            const response = await fetch(`/api/patients/${patientId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicalHistorySummary: combinedHistory,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update medical history");
            }

            onSuccess?.();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setEntries([]);
        setCurrentEntry({ type: "", description: "", date: "" });
        setError("");
        onClose();
    };

    const getTypeInfo = (type: string) => HISTORY_TYPES.find(t => t.value === type);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add Medical History"
            description={`Adding medical history for ${patientName}`}
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <ModalBody className="space-y-5">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2.5 rounded-md bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger"
                        >
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Current History Display */}
                    {currentHistory && (
                        <div className="p-3 rounded-md bg-surface-2 border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Current Medical History</p>
                            <p className="text-sm text-foreground">{currentHistory}</p>
                        </div>
                    )}

                    {/* Added Entries */}
                    {entries.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">New Entries to Add</p>
                            {entries.map((entry, index) => {
                                const typeInfo = getTypeInfo(entry.type);
                                const Icon = typeInfo?.icon || Activity;
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 rounded-md bg-surface-2 border border-border"
                                    >
                                        <Icon className={cn("h-4 w-4", typeInfo?.color)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {typeInfo?.label}: {entry.description}
                                            </p>
                                            {entry.date && (
                                                <p className="text-xs text-muted-foreground">{entry.date}</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeEntry(index)}
                                            className="p-1 rounded hover:bg-surface-3 text-muted hover:text-foreground transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Type Selection */}
                    <div>
                        <label className={labelStyles}>Type</label>
                        <div className="flex flex-wrap gap-2">
                            {HISTORY_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setCurrentEntry({ ...currentEntry, type: type.value })}
                                        disabled={isSubmitting}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium border transition-all duration-200",
                                            currentEntry.type === type.value
                                                ? "bg-primary/10 text-primary border-primary/30"
                                                : "bg-surface-2 text-muted-foreground border-border hover:bg-surface-3 hover:text-foreground",
                                            isSubmitting && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelStyles}>Description</label>
                        <textarea
                            value={currentEntry.description}
                            onChange={(e) => setCurrentEntry({ ...currentEntry, description: e.target.value })}
                            placeholder="E.g., Type 2 Diabetes, managed with Metformin 500mg..."
                            rows={2}
                            disabled={isSubmitting}
                            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none disabled:opacity-50"
                        />
                    </div>

                    {/* Date (Optional) */}
                    <div>
                        <label className={labelStyles}>
                            Date <span className="text-muted font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={currentEntry.date}
                            onChange={(e) => setCurrentEntry({ ...currentEntry, date: e.target.value })}
                            placeholder="E.g., Since 2020, or June 2023"
                            disabled={isSubmitting}
                            className={cn(inputBaseStyles, "pr-3")}
                        />
                    </div>

                    {/* Add Entry Button */}
                    <button
                        type="button"
                        onClick={addEntry}
                        disabled={!currentEntry.type || !currentEntry.description || isSubmitting}
                        className="flex items-center gap-2 rounded-md border border-dashed border-border bg-surface-2/50 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                    >
                        <Plus className="h-4 w-4" />
                        Add Another Entry
                    </button>
                </ModalBody>

                <ModalFooter>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="submit"
                        disabled={isSubmitting || (entries.length === 0 && (!currentEntry.type || !currentEntry.description))}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200",
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Heart className="h-4 w-4" />
                                Save Medical History
                            </>
                        )}
                    </motion.button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
