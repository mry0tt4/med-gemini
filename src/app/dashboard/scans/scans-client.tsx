"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
    Search,
    Upload,
    Image,
    Eye,
    Download,
    ImageOff,
    Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { UploadScanModal, ViewScanModal } from "@/components/modals";
import { useRouter } from "next/navigation";
import { DicomViewer } from "@/components/ui/dicom-viewer";

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

interface ScansClientProps {
    scans: Scan[];
    patients: Patient[];
}

const typeColors: Record<string, string> = {
    "X-RAY": "bg-info/10 text-info",
    "MRI": "bg-primary/10 text-primary",
    "CT": "bg-warning/10 text-warning",
    "DERM": "bg-success/10 text-success",
    "ULTRASOUND": "bg-violet-500/10 text-violet-400",
};

// Component to handle scan image with signed URL
function ScanCard({
    scan,
    index,
    onView
}: {
    scan: Scan;
    index: number;
    onView: (scan: Scan) => void;
}) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Check if this is a DICOM file (can't be displayed as regular image in thumbnail)
    const isDicom = scan.fileUrl?.toLowerCase().includes('.dcm') ||
        scan.fileUrl?.toLowerCase().includes('dicom');

    useEffect(() => {
        // Don't try to load DICOM files as regular images for thumbnails
        if (isDicom) {
            setIsLoading(false);
            return;
        }

        if (scan.fileUrl) {
            setIsLoading(true);
            setError(false);
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
        } else {
            setIsLoading(false);
        }
    }, [scan.fileUrl, isDicom]);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
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
            a.download = `scan-${scan.id}.${isDicom ? 'dcm' : 'jpg'}`;
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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group rounded-2xl border border-border bg-surface-1 overflow-hidden transition-all hover:border-primary/30"
        >
            {/* Image Preview */}
            <div
                className="relative aspect-video bg-surface-2 flex items-center justify-center cursor-pointer"
                onClick={() => onView(scan)}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-muted animate-spin" />
                        <span className="text-xs text-muted mt-2">Loading...</span>
                    </div>
                ) : isDicom ? (
                    // DICOM files - show viewer in thumbnail mode
                    <DicomViewer
                        imageUrl={scan.fileUrl}
                        thumbnail={true}
                        className="h-full w-full pointer-events-none"
                    />
                ) : signedUrl && !error ? (
                    <img
                        src={signedUrl}
                        alt={`${scan.type} scan`}
                        className="h-full w-full object-cover"
                        onError={() => setError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <ImageOff className="h-12 w-12 text-muted" />
                        {error && <span className="text-xs text-muted mt-2">Failed to load</span>}
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium text-sm">Click to view DICOM Scan</p>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(scan);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-surface-1/90 backdrop-blur py-2 text-xs font-medium text-foreground hover:bg-surface-1"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        View
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                        }}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-surface-1/90 backdrop-blur py-2 text-xs font-medium text-foreground hover:bg-surface-1 disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Download className="h-3.5 w-3.5" />
                        )}
                        Download
                    </button>
                </div>
            </div>

            {/* Details */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                                "rounded-md px-2 py-0.5 text-xs font-bold",
                                typeColors[scan.type] || "bg-surface-3"
                            )}>
                                {scan.type}
                            </span>
                            <span className="text-sm font-medium text-foreground">{scan.bodyPart}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{scan.patient}</p>
                    </div>
                    <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        scan.status === "Failed"
                            ? "bg-danger/10 text-danger"
                            : scan.analysis
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                    )}>
                        {scan.status === "Failed" ? "Failed" : scan.analysis ? "Analyzed" : "Pending"}
                    </span>
                </div>

                {/* AI Analysis Section */}
                {scan.analysis && (
                    <div className="mt-3 p-3 rounded-lg bg-surface-2 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-semibold text-primary">AI Analysis</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {scan.analysis.length > 150 ? scan.analysis.slice(0, 150) + "..." : scan.analysis}
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{scan.date}</span>
                    <span className="font-mono text-xs text-muted">{scan.id.slice(0, 8)}</span>
                </div>
            </div>
        </motion.div>
    );
}

export function ScansClient({ scans, patients }: ScansClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
    const router = useRouter();

    const filteredScans = scans
        .filter(scan =>
            searchQuery === "" ||
            scan.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scan.aiFindings.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(scan => !typeFilter || scan.type === typeFilter);

    const scanTypes = Array.from(new Set(scans.map(s => s.type)));

    const handleScanCreated = () => {
        router.refresh();
    };

    const handleViewScan = (scan: Scan) => {
        setSelectedScan(scan);
    };

    return (
        <>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
                            Medical Scans
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {scans.length} scans uploaded • {scans.filter(s => s.status === "Analyzed").length} analyzed
                        </p>
                    </div>
                    <motion.button
                        onClick={() => setShowUploadModal(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Scan
                    </motion.button>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Search scans..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-xl border border-border bg-surface-1 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setTypeFilter(null)}
                            className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                                !typeFilter
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                            )}
                        >
                            All
                        </button>
                        {scanTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                                    typeFilter === type
                                        ? typeColors[type] || "bg-surface-3"
                                        : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scans Grid */}
                {filteredScans.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-surface-1"
                    >
                        <ImageOff className="h-16 w-16 text-muted mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No scans found</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            {scans.length === 0
                                ? "Upload medical scans to get AI-powered analysis."
                                : "No scans match your search criteria."}
                        </p>
                        {scans.length === 0 && (
                            <motion.button
                                onClick={() => setShowUploadModal(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
                            >
                                <Upload className="h-4 w-4" />
                                Upload First Scan
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredScans.map((scan, index) => (
                            <ScanCard
                                key={scan.id}
                                scan={scan}
                                index={index}
                                onView={handleViewScan}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Scan Modal */}
            <UploadScanModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                patients={patients}
                onSuccess={handleScanCreated}
            />

            {/* View Scan Modal */}
            <ViewScanModal
                isOpen={!!selectedScan}
                onClose={() => setSelectedScan(null)}
                scan={selectedScan}
            />
        </>
    );
}
