"use client";

import { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { motion } from "motion/react";
import {
    User,
    Mic,
    MicOff,
    FileText,
    Brain,
    Loader2,
    AlertTriangle,
    Sparkles,
    ChevronDown,
    Image,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
    id: string;
    name: string;
}

interface Scan {
    id: string;
    type: string;
    createdAt: string;
    fileUrl: string;
    encounter?: {
        patientId: string;
        patient?: {
            id: string;
            name: string;
        };
    };
}

interface StartTriageModalProps {
    isOpen: boolean;
    onClose: () => void;
    patients: Patient[];
    selectedPatientId?: string;
    onSuccess?: (result: { encounterId: string; patientId: string }) => void;
    availableScans?: Scan[];
}

// Modern input styling
const inputBaseStyles = "w-full h-11 rounded-lg border border-border bg-surface-2 px-3 pr-10 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";
const labelStyles = "block text-sm font-medium text-foreground mb-2.5";

export function StartTriageModal({
    isOpen,
    onClose,
    patients,
    selectedPatientId,
    onSuccess,
    availableScans = [],
}: StartTriageModalProps) {
    const [formData, setFormData] = useState({
        patientId: "",
        symptoms: "",
        voiceTranscript: "",
    });
    const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    // Update patientId when selectedPatientId changes or modal opens
    useEffect(() => {
        if (isOpen && selectedPatientId) {
            setFormData(prev => ({ ...prev, patientId: selectedPatientId }));
        }
        // Reset selections when modal opens
        if (isOpen) {
            setSelectedScanIds([]);
        }
    }, [isOpen, selectedPatientId]);

    const toggleScan = (scanId: string) => {
        setSelectedScanIds(prev =>
            prev.includes(scanId)
                ? prev.filter(id => id !== scanId)
                : [...prev, scanId]
        );
    };

    // Filter scans to only show those belonging to the selected patient
    const patientScans = formData.patientId
        ? availableScans.filter(scan => scan.encounter?.patientId === formData.patientId)
        : [];

    // Reset selected scans when patient changes
    useEffect(() => {
        setSelectedScanIds([]);
    }, [formData.patientId]);

    // Voice recording state
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: "audio/webm" });
                // In a real app, you'd send this to a speech-to-text service
                // For now, simulate transcription
                setFormData(prev => ({
                    ...prev,
                    voiceTranscript: prev.voiceTranscript + " [Voice recording captured - transcription would appear here]"
                }));
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            setError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setMediaRecorder(null);
            setIsRecording(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");

        try {
            const response = await fetch("/api/triage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    patientId: formData.patientId,
                    symptoms: formData.symptoms,
                    voiceTranscript: formData.voiceTranscript || undefined,
                    scanIds: selectedScanIds.length > 0 ? selectedScanIds : undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to start triage");
            }

            const result = await response.json();
            onSuccess?.(result);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (isProcessing) return;
        if (isRecording) stopRecording();
        setFormData({ patientId: "", symptoms: "", voiceTranscript: "" });
        setSelectedScanIds([]);
        setError("");
        onClose();
    };

    const isFormValid = formData.patientId && formData.symptoms;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Start AI Triage"
            description="Begin AI-powered triage assessment for a patient"
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <ModalBody className="space-y-5">
                    {/* AI Processing Notice */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-info/10 border border-primary/20">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                AI-Powered Analysis
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Our AI will analyze the symptoms, suggest ICD-10/CPT codes, and generate
                                a triage recommendation with confidence scoring.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2.5 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger"
                        >
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Patient Selection */}
                    <div>
                        <label className={labelStyles}>
                            <span className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted" />
                                Patient
                            </span>
                        </label>
                        <div className="relative">
                            <select
                                value={formData.patientId}
                                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                required
                                disabled={isProcessing}
                                className={cn(inputBaseStyles, "appearance-none cursor-pointer")}
                            >
                                <option value="">Select a patient</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                        </div>
                    </div>

                    {/* Symptoms */}
                    <div>
                        <label className={labelStyles}>
                            <span className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted" />
                                Symptoms & Chief Complaint
                            </span>
                        </label>
                        <textarea
                            value={formData.symptoms}
                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                            placeholder="Describe the patient's symptoms, duration, and severity..."
                            rows={4}
                            required
                            disabled={isProcessing}
                            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none disabled:opacity-50"
                        />
                    </div>

                    {/* Scans Selection - Only show when patient is selected and has scans */}
                    {formData.patientId && patientScans.length > 0 && (
                        <div>
                            <label className={labelStyles}>
                                <span className="flex items-center gap-2">
                                    <Image className="h-3.5 w-3.5 text-muted" />
                                    Analyze Recent Scans <span className="text-muted font-normal">(Optional)</span>
                                </span>
                            </label>
                            <div className="rounded-xl border border-border bg-surface-2/50 overflow-hidden">
                                <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                                    {patientScans.map((scan) => (
                                        <div
                                            key={scan.id}
                                            onClick={() => toggleScan(scan.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border",
                                                selectedScanIds.includes(scan.id)
                                                    ? "bg-primary/10 border-primary/30"
                                                    : "bg-surface-1 border-transparent hover:bg-surface-3"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-4 w-4 rounded-lg border flex items-center justify-center transition-colors",
                                                selectedScanIds.includes(scan.id)
                                                    ? "bg-primary border-primary"
                                                    : "border-muted-foreground/30 bg-surface-1"
                                            )}>
                                                {selectedScanIds.includes(scan.id) && (
                                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-foreground">{scan.type}</p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(scan.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Selected scans will be processed by the AI for enhanced diagnostic accuracy.
                            </p>
                        </div>
                    )}

                    {/* Voice Input */}
                    <div>
                        <label className={labelStyles}>
                            <span className="flex items-center gap-2">
                                <Mic className="h-3.5 w-3.5 text-muted" />
                                Voice Notes <span className="text-muted font-normal">(Optional)</span>
                            </span>
                        </label>
                        <div className="p-4 rounded-lg border border-border bg-surface-2/50">
                            <div className="flex items-center gap-4">
                                <motion.button
                                    type="button"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={isProcessing}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "flex items-center justify-center h-11 w-11 rounded-full transition-all",
                                        isRecording
                                            ? "bg-danger text-white animate-pulse"
                                            : "bg-primary/10 text-primary hover:bg-primary/20",
                                        isProcessing && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isRecording ? (
                                        <MicOff className="h-4 w-4" />
                                    ) : (
                                        <Mic className="h-4 w-4" />
                                    )}
                                </motion.button>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        {isRecording ? "Recording..." : "Click to record"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isRecording
                                            ? "Click the button again to stop"
                                            : "Add voice notes for additional context"}
                                    </p>
                                </div>
                            </div>

                            {formData.voiceTranscript && (
                                <div className="mt-4 p-3 rounded-lg bg-surface-3 text-sm text-muted-foreground">
                                    <p className="text-xs font-medium text-muted mb-1">Transcript:</p>
                                    {formData.voiceTranscript}
                                </div>
                            )}
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="submit"
                        disabled={!isFormValid || isProcessing}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center gap-2 rounded-xl btn-triage-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Brain className="h-4 w-4" />
                                Start AI Triage
                            </>
                        )}
                    </motion.button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
