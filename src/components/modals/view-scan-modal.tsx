"use client";

import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { DicomViewer } from "@/components/ui/dicom-viewer";
import { motion } from "motion/react";
import {
    Download,
    Calendar,
    User,
    FileType,
    Maximize2,
    Minimize2,
    ExternalLink,
    CheckCircle2,
    Clock,
    Loader2,
    Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface Scan {
    id: string;
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

interface ViewScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    scan: Scan | null;
}

const typeColors: Record<string, string> = {
    "X-RAY": "bg-info/10 text-info border-info/20",
    "MRI": "bg-primary/10 text-primary border-primary/20",
    "CT": "bg-warning/10 text-warning border-warning/20",
    "DERM": "bg-success/10 text-success border-success/20",
    "ULTRASOUND": "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export function ViewScanModal({ isOpen, onClose, scan }: ViewScanModalProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const handleExitFullscreen = () => {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error);
        }
    };

    // Fetch pre-signed URL when modal opens
    useEffect(() => {
        if (isOpen && scan?.fileUrl) {
            setIsLoadingUrl(true);
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
                .catch(console.error)
                .finally(() => setIsLoadingUrl(false));
        }

        return () => {
            setSignedUrl(null);
        };
    }, [isOpen, scan?.fileUrl]);

    if (!scan) return null;

    const imageUrl = signedUrl || scan.fileUrl;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // Get a fresh pre-signed URL for download
            const response = await fetch("/api/scans/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl: scan.fileUrl }),
            });
            const { signedUrl: downloadUrl } = await response.json();

            if (!downloadUrl) throw new Error("Failed to get download URL");

            const fileResponse = await fetch(downloadUrl);
            const blob = await fileResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `scan-${scan.id}.${scan.type.toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleOpenOriginal = async () => {
        try {
            const response = await fetch("/api/scans/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl: scan.fileUrl }),
            });
            const { signedUrl: viewUrl } = await response.json();
            if (viewUrl) {
                window.open(viewUrl, "_blank");
            }
        } catch (error) {
            console.error("Failed to open:", error);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen && !isFullscreen}
                onClose={onClose}
                title="Scan Details"
                description={`${scan.type} scan of ${scan.bodyPart}`}
                size="xl"
            >
                <ModalBody className="p-0">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Preview */}
                        <div className="relative bg-black flex items-center justify-center h-[400px]">
                            <DicomViewer
                                imageUrl={imageUrl}
                                isLoading={isLoadingUrl}
                                className="h-[400px] w-full"
                            />

                            {/* Fullscreen button */}
                            {imageUrl && !isLoadingUrl && (
                                <button
                                    onClick={() => {
                                        setIsFullscreen(true);
                                        document.documentElement.requestFullscreen().catch(console.error);
                                    }}
                                    className="absolute top-4 right-4 p-2 rounded-md bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Details Panel */}
                        <div className="p-5 space-y-5">
                            {/* Scan Type Badge */}
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        "rounded-md px-3 py-1.5 text-sm font-bold border",
                                        typeColors[scan.type] || "bg-surface-3"
                                    )}
                                >
                                    {scan.type}
                                </span>
                                <span
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                                        scan.status === "Failed"
                                            ? "bg-danger/10 text-danger"
                                            : "bg-success/10 text-success"
                                    )}
                                >
                                    {scan.status === "Failed" ? (
                                        <Clock className="h-3 w-3" />
                                    ) : (
                                        <CheckCircle2 className="h-3 w-3" />
                                    )}
                                    {scan.status === "Failed" ? "Failed" : "Uploaded"}
                                </span>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted" />
                                    <div>
                                        <p className="text-xs text-muted">Patient</p>
                                        <p className="text-sm font-medium text-foreground">
                                            {scan.patient}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FileType className="h-4 w-4 text-muted" />
                                    <div>
                                        <p className="text-xs text-muted">Body Part</p>
                                        <p className="text-sm font-medium text-foreground">
                                            {scan.bodyPart}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted" />
                                    <div>
                                        <p className="text-xs text-muted">Upload Date</p>
                                        <p className="text-sm font-medium text-foreground">
                                            {scan.date}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Analysis */}
                            {scan.analysis && (() => {
                                let content = scan.analysis;
                                let confidence = 0;
                                let hasConfidence = false;

                                try {
                                    const parsed = JSON.parse(scan.analysis);
                                    if (parsed.rawAnalysis || parsed.detailedAnalysis) {
                                        content = parsed.rawAnalysis || parsed.detailedAnalysis || parsed.findings;
                                        if (typeof parsed.confidence === 'number') {
                                            confidence = parsed.confidence;
                                            hasConfidence = true;
                                        }
                                    }
                                } catch (e) {
                                    // Not JSON, treat as plain text
                                }

                                return (
                                    <div className="pt-4 border-t border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-primary" />
                                                <p className="text-xs font-semibold text-foreground">AI Analysis</p>
                                            </div>
                                            {hasConfidence && (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 bg-surface-3 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-500",
                                                                confidence > 0.8 ? "bg-success" : confidence > 0.5 ? "bg-warning" : "bg-danger"
                                                            )}
                                                            style={{ width: `${confidence * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground font-medium">
                                                        {(confidence * 100).toFixed(0)}% Conf.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground bg-surface-1 p-3 rounded-lg border border-border max-h-[300px] overflow-y-auto">
                                            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Scan ID */}
                            <div className="pt-4 border-t border-border">
                                <p className="text-xs text-muted">Scan ID</p>
                                <p className="font-mono text-sm text-muted-foreground">
                                    {scan.id}
                                </p>
                            </div>
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors"
                    >
                        Close
                    </button>
                    <motion.button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        Download
                    </motion.button>
                    <motion.button
                        onClick={handleOpenOriginal}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center gap-2 rounded-xl bg-surface-3 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-3/80"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Open Original
                    </motion.button>
                </ModalFooter>
            </Modal >

            {/* Fullscreen Viewer */}
            {
                isFullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
                        onClick={handleExitFullscreen}
                    >
                        <button
                            onClick={handleExitFullscreen}
                            className="absolute top-4 right-4 p-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors z-20"
                        >
                            <Minimize2 className="h-5 w-5" />
                        </button>
                        <div
                            className="w-full h-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DicomViewer
                                imageUrl={imageUrl}
                                className="w-full h-full"
                            />
                        </div>
                    </motion.div>
                )
            }
        </>
    );
}
