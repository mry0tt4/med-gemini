"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, FileText, Plus, Loader2, Upload, Sparkles, Check } from "lucide-react";

interface AddReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    onSuccess: () => void;
}

const reportTypes = [
    { value: "lab", label: "Lab Report" },
    { value: "pathology", label: "Pathology Report" },
    { value: "radiology", label: "Radiology Report" },
    { value: "cardiology", label: "Cardiology Report" },
    { value: "other", label: "Other" },
];

export function AddReportModal({
    isOpen,
    onClose,
    patientId,
    patientName,
    onSuccess,
}: AddReportModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractionSuccess, setExtractionSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [type, setType] = useState("lab");
    const [title, setTitle] = useState("");
    const [reportDate, setReportDate] = useState("");
    const [providerName, setProviderName] = useState("");
    const [findings, setFindings] = useState("");
    const [conclusion, setConclusion] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [fileType, setFileType] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setType("lab");
            setTitle("");
            setReportDate(new Date().toISOString().split("T")[0]);
            setProviderName("");
            setFindings("");
            setConclusion("");
            setFileUrl("");
            setFileType(null);
            setError(null);
            setExtractionSuccess(false);
        }
    }, [isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            // Get presigned URL for upload
            const presignRes = await fetch("/api/scans/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type,
                }),
            });

            if (!presignRes.ok) throw new Error("Failed to get upload URL");
            const { uploadUrl, publicUrl: uploadedUrl } = await presignRes.json();

            // Upload file to S3
            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            setFileUrl(uploadedUrl);
            const type = file.type.includes("pdf") ? "pdf" : "image";
            setFileType(type);

            // Auto-extract data using AI
            await handleExtractData(uploadedUrl, type);
            setExtractionSuccess(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload file");
            setIsLoading(false); // Stop loading only on error, otherwise extraction keeps it loading? 
            // Actually handleExtractData sets isExtracting, maybe we should manage loading state carefully.
        } finally {
            // If we called handleExtractData, it manages its own state. 
            // But if we want the valid loading state to persist transition...
            // Let's just set isLoading false here, handleExtractData sets isExtracting true.
            setIsLoading(false);
        }
    };

    const handleExtractData = async (url?: string, type?: string) => {
        const targetUrl = url || fileUrl;
        const targetType = type || fileType || "image";

        if (!targetUrl) return;

        setIsExtracting(true);
        setError(null);

        try {
            const response = await fetch(`/api/patients/${patientId}/reports/extract`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileUrl: targetUrl,
                    fileType: targetType,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to extract data");
            }

            const { formData } = await response.json();

            // Auto-fill form with extracted data
            if (formData.type) setType(formData.type);
            if (formData.title) setTitle(formData.title);
            if (formData.reportDate) setReportDate(formData.reportDate);
            if (formData.providerName) setProviderName(formData.providerName);
            if (formData.findings) setFindings(formData.findings);
            if (formData.conclusion) setConclusion(formData.conclusion);

            setExtractionSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to extract data");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/patients/${patientId}/reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    title,
                    reportDate,
                    providerName: providerName || null,
                    findings: findings || null,
                    conclusion: conclusion || null,
                    fileUrl: fileUrl || null,
                    fileType: fileType || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add report");
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
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-info/10">
                                    <FileText className="h-5 w-5 text-info" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Add External Report
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

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Upload Report (PDF or Image)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*,.pdf"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}
                                        {fileUrl ? "Change File" : "Choose File"}
                                    </button>
                                    {fileUrl && (
                                        <span className="text-sm text-success flex items-center gap-1">
                                            <Check className="h-4 w-4" />
                                            File uploaded
                                        </span>
                                    )}
                                </div>

                                {/* AI Extraction Button */}
                                {fileUrl && (
                                    <motion.button
                                        type="button"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => handleExtractData()}
                                        disabled={isExtracting}
                                        className="mt-3 flex items-center gap-2 rounded-md bg-gradient-to-r from-primary/10 to-info/10 border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary hover:from-primary/20 hover:to-info/20 transition-colors disabled:opacity-50"
                                    >
                                        {isExtracting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Extracting with AI...
                                            </>
                                        ) : extractionSuccess ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Data Extracted!
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Extract Data with AI
                                            </>
                                        )}
                                    </motion.button>
                                )}
                            </div>

                            {/* Report Type & Title */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Report Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {reportTypes.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Report Date <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={reportDate}
                                        onChange={(e) => setReportDate(e.target.value)}
                                        required
                                        className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Title <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g., Complete Blood Count"
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Provider */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Provider / Facility
                                </label>
                                <input
                                    type="text"
                                    value={providerName}
                                    onChange={(e) => setProviderName(e.target.value)}
                                    placeholder="e.g., LabCorp"
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Findings */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Key Findings
                                </label>
                                <textarea
                                    value={findings}
                                    onChange={(e) => setFindings(e.target.value)}
                                    rows={3}
                                    placeholder="Key findings or results from the report..."
                                    className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                />
                            </div>

                            {/* Conclusion */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Conclusion / Impression
                                </label>
                                <textarea
                                    value={conclusion}
                                    onChange={(e) => setConclusion(e.target.value)}
                                    rows={2}
                                    placeholder="Doctor's conclusion or impression..."
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
                                    disabled={isLoading || !title || !reportDate}
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
                                            Add Report
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
