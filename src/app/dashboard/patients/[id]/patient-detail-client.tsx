"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    User,
    Activity,
    FileText,
    Brain,
    AlertTriangle,
    Image,
    Clock,
    Heart,
    Pill,
    Stethoscope,
    Plus,
    X,
    CheckCircle2,
    Loader2,
    Send,
    Upload,
    FileType,
    Clipboard,
    Trash2,
    ClipboardList,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
    StartTriageModal,
    UploadScanModal,
    ViewScanModal,
    AddMedicalHistoryModal,
    AddMedicationModal,
    AddReportModal,
} from "@/components/modals";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DicomViewer } from "@/components/ui/dicom-viewer";

interface Scan {
    id: string;
    type: string;
    fileUrl: string;
    analysis: string | null;
    createdAt: string;
}

interface TriageReport {
    id: string;
    summary: string;
    urgencyLevel: string;
    recommendedAction: string;
    confidenceScore: number | null;
    status: string;
    suggestedICD10: string[];
    suggestedCPT: string[];
    createdAt?: string;
}

interface Encounter {
    id: string;
    symptoms: string;
    voiceTranscript: string | null;
    createdAt: string;
    scans: Scan[];
    triageReports: TriageReport[];
}

interface MedicalHistoryItem {
    id: string;
    type: string;
    clinicalStatus: string;
    description: string;
    onsetDate: string | null;
    severity: string | null;
    icd10Code: string | null;
}

interface Medication {
    id: string;
    name: string;
    genericName: string | null;
    dosage: string | null;
    frequency: string | null;
    route: string | null;
    status: string;
    startDate: string | null;
    reason: string | null;
}

interface ExternalReport {
    id: string;
    type: string;
    title: string;
    reportDate: string;
    providerName: string | null;
    findings: string | null;
    conclusion: string | null;
    fileUrl: string | null;
}

interface Patient {
    id: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    medicalHistorySummary: string | null;
    createdAt: string;
    encounters: Encounter[];
    medicalHistory: MedicalHistoryItem[];
    medications: Medication[];
    externalReports: ExternalReport[];
}

interface PatientDetailClientProps {
    patient: Patient;
}

const urgencyColors: Record<string, { bg: string; text: string; border: string }> = {
    LOW: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
    MEDIUM: { bg: "bg-info/10", text: "text-info", border: "border-info/20" },
    HIGH: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
    CRITICAL: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-success/10", text: "text-success" },
    completed: { bg: "bg-muted/10", text: "text-muted-foreground" },
    stopped: { bg: "bg-danger/10", text: "text-danger" },
    "on-hold": { bg: "bg-warning/10", text: "text-warning" },
};

const reportTypeLabels: Record<string, string> = {
    lab: "Lab",
    pathology: "Pathology",
    radiology: "Radiology",
    cardiology: "Cardiology",
    other: "Other",
};

function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDateTime(date: string): string {
    return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

// Component to handle scan image with signed URL
function ScanThumbnail({ scan, onClick }: { scan: Scan; onClick: () => void }) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Check for DICOM file
    const isDicom = scan.fileUrl?.toLowerCase().includes('.dcm') ||
        scan.fileUrl?.toLowerCase().includes('dicom');

    useEffect(() => {
        if (isDicom) {
            setIsLoading(false);
            return;
        }

        if (scan.fileUrl) {
            setIsLoading(true);
            fetch("/api/scans/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl: scan.fileUrl }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.signedUrl) {
                        setSignedUrl(data.signedUrl);
                    } else {
                        setError(true);
                    }
                })
                .catch(() => setError(true))
                .finally(() => setIsLoading(false));
        }
    }, [scan.fileUrl, isDicom]);

    return (
        <div
            onClick={onClick}
            className="group relative aspect-video rounded-lg bg-surface-2 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        >
            {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-muted animate-spin" />
                </div>
            ) : isDicom ? (
                // DICOM Viewer in thumbnail mode
                <DicomViewer
                    imageUrl={scan.fileUrl}
                    thumbnail={true}
                    className="h-full w-full pointer-events-none"
                />
            ) : signedUrl && !error ? (
                <img
                    src={signedUrl}
                    alt={scan.type}
                    className="h-full w-full object-cover"
                    onError={() => setError(true)}
                />
            ) : (
                <div className="h-full w-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block rounded-sm bg-primary/90 px-2 py-0.5 text-xs font-bold text-white">
                    {scan.type}
                </span>
            </div>
            {/* AI Confidence Badge */}
            {
                (() => {
                    let confidence = null;
                    try {
                        if (scan.analysis) {
                            const parsed = JSON.parse(scan.analysis);
                            if (typeof parsed.confidence === 'number') {
                                confidence = parsed.confidence;
                            }
                        }
                    } catch { }

                    return confidence ? (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm ring-1 ring-white/10">
                                <Brain className="h-3 w-3 text-primary" />
                                {(confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                    ) : null;
                })()
            }
        </div >
    );
}

// Small thumbnail for encounter row
function SmallScanThumbnail({ scan }: { scan: Scan }) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);

    // Check for DICOM file
    const isDicom = scan.fileUrl?.toLowerCase().includes('.dcm') ||
        scan.fileUrl?.toLowerCase().includes('dicom');

    useEffect(() => {
        if (isDicom) return;

        if (scan.fileUrl) {
            fetch("/api/scans/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl: scan.fileUrl }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.signedUrl) {
                        setSignedUrl(data.signedUrl);
                    }
                })
                .catch(() => { });
        }
    }, [scan.fileUrl, isDicom]);

    return (
        <div className="h-8 w-8 rounded-lg bg-surface-3 border-2 border-surface-2 overflow-hidden flex items-center justify-center">
            {isDicom ? (
                <DicomViewer
                    imageUrl={scan.fileUrl}
                    thumbnail={true}
                    className="h-full w-full pointer-events-none"
                />
            ) : signedUrl ? (
                <img
                    src={signedUrl}
                    alt={scan.type}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="h-full w-full bg-surface-3" />
            )}
        </div>
    );
}

export function PatientDetailClient({ patient }: PatientDetailClientProps) {
    const router = useRouter();
    const [showTriageModal, setShowTriageModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showMedicalHistoryModal, setShowMedicalHistoryModal] = useState(false);
    const [showMedicationModal, setShowMedicationModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
    const [deletingMedication, setDeletingMedication] = useState<string | null>(null);
    const [deletingReport, setDeletingReport] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        type: 'triage' | 'external' | 'medication';
        id: string;
    } | null>(null);
    const [expandedEncounters, setExpandedEncounters] = useState<Set<string>>(new Set());

    const age = calculateAge(patient.dateOfBirth);
    const totalEncounters = patient.encounters.length;
    const totalScans = patient.encounters.reduce((acc, enc) => acc + enc.scans.length, 0);
    const latestEncounter = patient.encounters[0];
    const activeMedications = patient.medications.filter(m => m.status === "active");

    const handleTriageSuccess = () => {
        router.refresh();
    };

    const toggleEncounterExpanded = (encounterId: string) => {
        setExpandedEncounters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(encounterId)) {
                newSet.delete(encounterId);
            } else {
                newSet.add(encounterId);
            }
            return newSet;
        });
    };

    const handleScanSuccess = () => {
        router.refresh();
    };

    const handleMedicalHistorySuccess = () => {
        router.refresh();
    };

    const handleMedicationSuccess = () => {
        router.refresh();
    };

    const handleReportSuccess = () => {
        router.refresh();
    };

    const handleDeleteMedication = (medicationId: string) => {
        setDeleteConfirm({
            isOpen: true,
            type: 'medication',
            id: medicationId
        });
    };

    const handleDeleteExternalReport = (reportId: string) => {
        setDeleteConfirm({
            isOpen: true,
            type: 'external',
            id: reportId
        });
    };

    const handleDeleteTriageReport = (reportId: string) => {
        setDeleteConfirm({
            isOpen: true,
            type: 'triage',
            id: reportId
        });
    };

    const executeDelete = async () => {
        if (!deleteConfirm) return;

        const { type, id } = deleteConfirm;

        try {
            if (type === 'medication') {
                setDeletingMedication(id);
                const response = await fetch(`/api/patients/${patient.id}/medications/${id}`, {
                    method: "DELETE",
                });
                if (response.ok) router.refresh();
            } else if (type === 'external') {
                setDeletingReport(id);
                const response = await fetch(`/api/patients/${patient.id}/reports/${id}`, {
                    method: "DELETE",
                });
                if (response.ok) router.refresh();
            } else if (type === 'triage') {
                setDeletingReport(id);
                const response = await fetch(`/api/triage/${id}`, {
                    method: "DELETE",
                });
                if (response.ok) router.refresh();
            }
        } catch (error) {
            console.error(`Failed to delete ${type}:`, error);
        } finally {
            setDeletingMedication(null);
            setDeletingReport(null);
            setDeleteConfirm(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => router.back()}
                            className="mt-1 rounded-lg p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-info/20 text-2xl font-bold text-primary">
                                    {patient.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground font-display">
                                        {patient.name}
                                    </h1>
                                    <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <User className="h-4 w-4" />
                                            {age}y • {patient.gender}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            DOB: {formatDate(patient.dateOfBirth)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            onClick={() => setShowScanModal(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                        >
                            <Image className="h-4 w-4" />
                            Upload Scan
                        </motion.button>
                        <motion.button
                            onClick={() => setShowTriageModal(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 rounded-xl btn-triage-gradient px-5 py-2.5 text-sm font-semibold"
                        >
                            <Brain className="h-4 w-4" />
                            Start Triage
                        </motion.button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-border bg-surface-1 p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm text-muted-foreground">Total Encounters</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{totalEncounters}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-2xl border border-border bg-surface-1 p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                                <Image className="h-5 w-5 text-info" />
                            </div>
                            <span className="text-sm text-muted-foreground">Medical Scans</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{totalScans}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-border bg-surface-1 p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                                <Calendar className="h-5 w-5 text-success" />
                            </div>
                            <span className="text-sm text-muted-foreground">Patient Since</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">{formatDate(patient.createdAt)}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="rounded-2xl border border-border bg-surface-1 p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                                <Clock className="h-5 w-5 text-warning" />
                            </div>
                            <span className="text-sm text-muted-foreground">Last Visit</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                            {latestEncounter ? formatDate(latestEncounter.createdAt) : "No visits"}
                        </p>
                    </motion.div>
                </div>

                {/* Main Content Grid - Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Medical History */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-border bg-surface-1 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Heart className="h-5 w-5 text-danger" />
                                Medical History
                            </h2>
                            <button
                                onClick={() => setShowMedicalHistoryModal(true)}
                                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>
                        {patient.medicalHistory.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {patient.medicalHistory.map((item) => (
                                    <div key={item.id} className="p-2 rounded-lg bg-surface-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-foreground">{item.description}</span>
                                            <span className={cn(
                                                "text-xs px-1.5 py-0.5 rounded-lg",
                                                item.clinicalStatus === "active" ? "bg-success/10 text-success" : "bg-muted/10 text-muted-foreground"
                                            )}>
                                                {item.clinicalStatus}
                                            </span>
                                        </div>
                                        {item.icd10Code && (
                                            <span className="text-xs text-muted-foreground">ICD-10: {item.icd10Code}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : patient.medicalHistorySummary ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {patient.medicalHistorySummary}
                            </p>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Pill className="h-12 w-12 text-muted mb-3" />
                                <p className="text-sm text-muted-foreground mb-3">
                                    No medical history recorded yet
                                </p>
                                <button
                                    onClick={() => setShowMedicalHistoryModal(true)}
                                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Medical History
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Medical Scans */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="lg:col-span-2 rounded-2xl border border-border bg-surface-1 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Image className="h-5 w-5 text-info" />
                                Medical Scans
                            </h2>
                            <button
                                onClick={() => setShowScanModal(true)}
                                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add Scan
                            </button>
                        </div>

                        {totalScans === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Image className="h-12 w-12 text-muted mb-3" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    No scans uploaded yet
                                </p>
                                <button
                                    onClick={() => setShowScanModal(true)}
                                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Upload First Scan
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {patient.encounters.flatMap(enc => enc.scans).slice(0, 6).map((scan) => (
                                    <ScanThumbnail
                                        key={scan.id}
                                        scan={scan}
                                        onClick={() => setSelectedScan(scan)}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Main Content Grid - Row 2: Medications & Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Medications Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-2xl border border-border bg-surface-1 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Pill className="h-5 w-5 text-primary" />
                                Medications
                                {activeMedications.length > 0 && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        {activeMedications.length} active
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => setShowMedicationModal(true)}
                                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>

                        {patient.medications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Pill className="h-12 w-12 text-muted mb-3" />
                                <p className="text-sm text-muted-foreground mb-3">
                                    No medications recorded
                                </p>
                                <button
                                    onClick={() => setShowMedicationModal(true)}
                                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Medication
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {patient.medications.map((med) => (
                                    <div key={med.id} className="group p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">{med.name}</span>
                                                    <span className={cn(
                                                        "text-xs px-1.5 py-0.5 rounded-lg",
                                                        statusColors[med.status]?.bg || "bg-muted/10",
                                                        statusColors[med.status]?.text || "text-muted-foreground"
                                                    )}>
                                                        {med.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {med.dosage && <span>{med.dosage}</span>}
                                                    {med.frequency && <span> • {med.frequency}</span>}
                                                    {med.route && <span> • {med.route}</span>}
                                                </div>
                                                {med.reason && (
                                                    <p className="text-xs text-muted mt-1">For: {med.reason}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMedication(med.id)}
                                                disabled={deletingMedication === med.id}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-danger transition-all"
                                            >
                                                {deletingMedication === med.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* External Reports Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="rounded-2xl border border-border bg-surface-1 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <ClipboardList className="h-5 w-5 text-info" />
                                External Reports
                                {patient.externalReports.length > 0 && (
                                    <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full">
                                        {patient.externalReports.length}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>

                        {patient.externalReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <FileText className="h-12 w-12 text-muted mb-3" />
                                <p className="text-sm text-muted-foreground mb-3">
                                    No external reports uploaded
                                </p>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Report
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {patient.externalReports.map((report) => (
                                    <div key={report.id} className="group p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">{report.title}</span>
                                                    <span className="text-xs bg-info/10 text-info px-1.5 py-0.5 rounded-lg">
                                                        {reportTypeLabels[report.type] || report.type}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {formatDate(report.reportDate)}
                                                    {report.providerName && <span> • {report.providerName}</span>}
                                                </div>
                                                {report.conclusion && (
                                                    <p className="text-xs text-muted mt-1 line-clamp-1">{report.conclusion}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteExternalReport(report.id)}
                                                disabled={deletingReport === report.id}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-danger transition-all"
                                            >
                                                {deletingReport === report.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Encounters Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl border border-border bg-surface-1 p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <Stethoscope className="h-5 w-5 text-primary" />
                            Encounter History
                        </h2>
                        <button
                            onClick={() => setShowTriageModal(true)}
                            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New Encounter
                        </button>
                    </div>

                    {patient.encounters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Clipboard className="h-12 w-12 text-muted mb-3" />
                            <p className="text-muted-foreground mb-4">
                                No encounters recorded for this patient
                            </p>
                            <button
                                onClick={() => setShowTriageModal(true)}
                                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                            >
                                <Brain className="h-4 w-4" />
                                Start First Triage
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {patient.encounters.map((encounter, encIndex) => (
                                <div key={encounter.id} className="relative">
                                    {/* Encounter Connector Line */}
                                    {encIndex !== patient.encounters.length - 1 && (
                                        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border -z-10" />
                                    )}

                                    {/* Encounter Header / Start */}
                                    <div className="flex gap-4 mb-4">
                                        <div className="flex-shrink-0 relative z-10">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-2 border-2 border-surface-1 shadow-sm">
                                                <Stethoscope className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-surface-1 border border-border rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-foreground">Encounter Started</p>
                                                        <p className="text-xs text-muted-foreground">{formatDateTime(encounter.createdAt)}</p>
                                                    </div>
                                                    {/* Expand/Collapse Button */}
                                                    <button
                                                        onClick={() => toggleEncounterExpanded(encounter.id)}
                                                        className="p-1.5 rounded-lg hover:bg-surface-3 transition-colors text-muted-foreground hover:text-foreground"
                                                        title={expandedEncounters.has(encounter.id) ? "Collapse" : "Expand"}
                                                    >
                                                        {expandedEncounters.has(encounter.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="text-sm text-foreground">
                                                    <span className="font-medium text-muted-foreground mr-1">Symptoms:</span>
                                                    {encounter.symptoms}
                                                </div>

                                                {/* Scans associated with encounter - always show summary */}
                                                {encounter.scans.length > 0 && (
                                                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
                                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                            <Image className="h-3.5 w-3.5" />
                                                            {encounter.scans.length} Scan{encounter.scans.length !== 1 ? 's' : ''}
                                                        </span>
                                                        <div className="flex -space-x-2">
                                                            {encounter.scans.slice(0, 5).map((scan) => (
                                                                <SmallScanThumbnail key={scan.id} scan={scan} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Triage Reports for this Encounter - Only show when expanded */}
                                    {expandedEncounters.has(encounter.id) && (
                                        <div className="space-y-4 ml-14">
                                            {encounter.triageReports.map((report, repIndex) => {
                                                const urgencyStyle = urgencyColors[report.urgencyLevel] || urgencyColors.MEDIUM;

                                                return (
                                                    <motion.div
                                                        key={report.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="relative flex gap-4"
                                                    >
                                                        {/* Report Connector Line (if not last item in encounter flow) */}
                                                        <div className="absolute -left-[37px] top-0 bottom-[-16px] w-0.5 bg-border -z-10 border-l border-dashed border-muted/30 opacity-50" />

                                                        {/* Horizontal connector */}
                                                        <div className="absolute -left-[37px] top-5 w-8 h-px bg-border -z-10 border-t border-dashed border-muted/30 opacity-70" />

                                                        <div className="flex-1 rounded-lg border border-border bg-surface-2 p-4 hover:border-primary/20 transition-colors">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn(
                                                                        "flex h-8 w-8 items-center justify-center rounded-lg",
                                                                        urgencyStyle.bg
                                                                    )}>
                                                                        <Activity className={cn("h-4 w-4", urgencyStyle.text)} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-medium text-foreground">
                                                                                Triage Report
                                                                            </span>
                                                                            <span className={cn(
                                                                                "rounded-lg px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                                                                urgencyStyle.bg,
                                                                                urgencyStyle.text
                                                                            )}>
                                                                                {report.urgencyLevel}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {formatDateTime(report.createdAt || encounter.createdAt)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {report.confidenceScore && (
                                                                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-surface-3 px-2 py-1 rounded-full">
                                                                        <Brain className="h-3 w-3" />
                                                                        {Math.round(report.confidenceScore * 100)}%
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Status Indicator for Processing */}
                                                            {report.status === "PROCESSING" ? (
                                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-1 border border-border/50 animate-pulse">
                                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                    <span className="text-sm text-muted-foreground">AI Analysis in progress...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-foreground prose-report line-clamp-4 hover:line-clamp-none transition-all">
                                                                    <ReactMarkdown>
                                                                        {report.summary}
                                                                    </ReactMarkdown>
                                                                </div>
                                                            )}

                                                            {/* Actions & Codes */}
                                                            <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-border/50">
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                    <span>Status: <span className="font-medium text-foreground capitalize">{report.status.toLowerCase()}</span></span>
                                                                </div>

                                                                {/* Delete Button */}
                                                                <div className="ml-auto">
                                                                    <button
                                                                        onClick={() => handleDeleteTriageReport(report.id)}
                                                                        disabled={deletingReport === report.id}
                                                                        className="text-muted-foreground hover:text-danger p-1 rounded-lg transition-colors"
                                                                        title="Delete Report"
                                                                    >
                                                                        {deletingReport === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}

                                            {encounter.triageReports.length === 0 && (
                                                <div className="ml-1 relative pl-6 pb-2">
                                                    <div className="absolute -left-[37px] top-0 bottom-[50%] w-0.5 bg-border -z-10 border-l border-dashed border-muted/30 opacity-50" />
                                                    <div className="absolute -left-[37px] top-3 w-8 h-px bg-border -z-10 border-t border-dashed border-muted/30 opacity-70" />
                                                    <p className="text-sm text-muted-foreground italic">No triage reports generated yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ... other modals will go here via next replacement targeting them specifically if needed or just append */}
            {/* Since I can't guarantee '970' line number, I will target the known StartTriageModal closing tag or similar */}
            <StartTriageModal
                isOpen={showTriageModal}
                onClose={() => setShowTriageModal(false)}
                patients={[{ id: patient.id, name: patient.name }]}
                selectedPatientId={patient.id}
                onSuccess={handleTriageSuccess}
                availableScans={patient.encounters.flatMap((e) =>
                    e.scans.map(scan => ({
                        ...scan,
                        encounter: { patientId: patient.id }
                    }))
                )}
            />

            <UploadScanModal
                isOpen={showScanModal}
                onClose={() => setShowScanModal(false)}
                patients={[{ id: patient.id, name: patient.name }]}
                onSuccess={handleScanSuccess}
            />

            <AddMedicalHistoryModal
                isOpen={showMedicalHistoryModal}
                onClose={() => setShowMedicalHistoryModal(false)}
                patientId={patient.id}
                patientName={patient.name}
                currentHistory={patient.medicalHistorySummary}
                onSuccess={handleMedicalHistorySuccess}
            />

            <AddMedicationModal
                isOpen={showMedicationModal}
                onClose={() => setShowMedicationModal(false)}
                patientId={patient.id}
                patientName={patient.name}
                onSuccess={handleMedicationSuccess}
            />

            <AddReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                patientId={patient.id}
                patientName={patient.name}
                onSuccess={handleReportSuccess}
            />

            {selectedScan && (
                <ViewScanModal
                    isOpen={!!selectedScan}
                    onClose={() => setSelectedScan(null)}
                    scan={{
                        id: selectedScan.id,
                        type: selectedScan.type,
                        bodyPart: "General",
                        patient: patient.name,
                        patientId: patient.id,
                        date: formatDate(selectedScan.createdAt),
                        status: selectedScan.analysis ? "Analyzed" : "Pending",
                        aiFindings: selectedScan.analysis || "Analysis pending...",
                        fileUrl: selectedScan.fileUrl,
                        analysis: selectedScan.analysis,
                    }}
                />
            )}

            <AlertDialog open={!!deleteConfirm?.isOpen} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {' '}
                            {deleteConfirm?.type === 'medication' ? 'medication record' :
                                deleteConfirm?.type === 'triage' ? 'triage report' : 'report'}
                            from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                executeDelete();
                            }}
                            className="bg-danger hover:bg-danger/90 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
