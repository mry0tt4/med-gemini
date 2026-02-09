"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { motion } from "motion/react";
import { User, Calendar, Users, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (patient: { id: string; name: string }) => void;
}

export function AddPatientModal({ isOpen, onClose, onSuccess }: AddPatientModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        dateOfBirth: "",
        gender: "",
        symptoms: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/patients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create patient");
            }

            const patient = await response.json();
            onSuccess?.(patient);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: "", dateOfBirth: "", gender: "", symptoms: "" });
        setError("");
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add New Patient"
            description="Enter patient details to create a new record"
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <ModalBody className="space-y-5">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg bg-danger/10 border border-danger/20 p-4 text-sm text-danger"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <User className="h-4 w-4 text-muted" />
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter patient's full name"
                            required
                            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>

                    {/* Date of Birth and Gender */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Calendar className="h-4 w-4 text-muted" />
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                required
                                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Users className="h-4 w-4 text-muted" />
                                Gender
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                required
                                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Initial Symptoms */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <FileText className="h-4 w-4 text-muted" />
                            Initial Symptoms (Optional)
                        </label>
                        <textarea
                            value={formData.symptoms}
                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                            placeholder="Describe initial symptoms or reason for visit..."
                            rows={4}
                            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                        />
                    </div>
                </ModalBody>

                <ModalFooter>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="rounded-xl border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="submit"
                        disabled={isLoading || !formData.name || !formData.dateOfBirth || !formData.gender}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all",
                            "bg-primary text-primary-foreground shadow-primary/25",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Patient"
                        )}
                    </motion.button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
