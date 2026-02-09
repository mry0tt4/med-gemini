"use client";

import { useState, useRef, useCallback } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { motion, AnimatePresence } from "motion/react";
import {
    Upload,
    Image,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileImage,
    User,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
    id: string;
    name: string;
}

interface UploadScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    patients: Patient[];
    onSuccess?: (scan: { id: string; type: string }) => void;
}

const SCAN_TYPES = [
    { value: "X-RAY", label: "X-Ray", color: "bg-info/10 text-info border-info/30" },
    { value: "MRI", label: "MRI", color: "bg-primary/10 text-primary border-primary/30" },
    { value: "CT", label: "CT Scan", color: "bg-warning/10 text-warning border-warning/30" },
    { value: "DERM", label: "Dermatology", color: "bg-success/10 text-success border-success/30" },
    { value: "ULTRASOUND", label: "Ultrasound", color: "bg-violet-500/10 text-violet-400 border-violet-400/30" },
];

const BODY_PARTS = [
    "Head", "Neck", "Chest", "Abdomen", "Spine", "Upper Extremity",
    "Lower Extremity", "Pelvis", "Full Body", "Skin", "Other"
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Boxy input styling
const inputBaseStyles = "w-full h-10 rounded-md border border-border bg-surface-2 px-3 pr-10 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";
const labelStyles = "block text-sm font-medium text-foreground mb-2";

export function UploadScanModal({ isOpen, onClose, patients, onSuccess }: UploadScanModalProps) {
    const [formData, setFormData] = useState({
        patientId: "",
        scanType: "",
        bodyPart: "",
        notes: "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((selectedFile: File) => {
        // Validate file size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError("File size exceeds 50MB limit");
            return;
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/dicom", "application/dicom"];
        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".dcm")) {
            setError("Invalid file type. Please upload JPEG, PNG, WebP, or DICOM files");
            return;
        }

        setError("");
        setFile(selectedFile);

        // Create preview for image files
        if (selectedFile.type.startsWith("image/")) {
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setUploadStatus("uploading");
        setError("");
        setUploadProgress(0);

        try {
            let uploadedPreviewUrl = null;

            // Step 1: Handle DICOM Preview Generation & Upload
            const isDicom = file.name.toLowerCase().endsWith(".dcm") || file.type === "application/dicom";

            if (isDicom) {
                try {
                    setUploadProgress(5);
                    console.log("Generating DICOM preview...");

                    // Dynamically import libraries to avoid SSR issues
                    const cornerstone = (await import("cornerstone-core")).default;
                    const cornerstoneWADOImageLoader = (await import("cornerstone-wado-image-loader")).default as any;
                    const dicomParser = (await import("dicom-parser")).default;

                    // Initialize loader if not already done
                    // @ts-ignore
                    if (!window.cornerstoneWADOImageLoaderInitialized) {
                        cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
                        cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
                        cornerstoneWADOImageLoader.configure({
                            useWebWorkers: false,
                            decodeConfig: {
                                convertFloatPixelDataToInt: false,
                            },
                        });
                        // @ts-ignore
                        window.cornerstoneWADOImageLoaderInitialized = true;
                    }

                    // Load DICOM Image
                    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
                    const image = await cornerstone.loadImage(imageId);

                    // Render to Canvas
                    const canvas = document.createElement("canvas");
                    canvas.width = image.width;
                    canvas.height = image.height;
                    const context = canvas.getContext("2d");

                    // Enable cornerstone on the temp canvas
                    cornerstone.enable(canvas);
                    cornerstone.displayImage(canvas, image);

                    // Wait for render
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Get Blob from canvas
                    const previewBlob = await new Promise<Blob | null>(resolve =>
                        canvas.toBlob(blob => resolve(blob), "image/png")
                    );

                    if (previewBlob) {
                        // Upload Preview Image
                        console.log("Uploading preview image...");
                        const previewFileName = `preview-${file.name.replace(/\.[^/.]+$/, "")}.png`;

                        const presignResponse = await fetch("/api/scans/presign", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                fileName: previewFileName,
                                contentType: "image/png",
                            }),
                        });

                        if (presignResponse.ok) {
                            const { uploadUrl, publicUrl } = await presignResponse.json();

                            await fetch(uploadUrl, {
                                method: "PUT",
                                body: previewBlob,
                                headers: { "Content-Type": "image/png" },
                            });

                            uploadedPreviewUrl = publicUrl;
                        }
                    }

                    // Cleanup
                    cornerstone.disable(canvas);
                    cornerstoneWADOImageLoader.wadouri.fileManager.remove(imageId);

                } catch (previewErr) {
                    console.error("Failed to generate DICOM preview:", previewErr);
                    // Continue without preview if generation fails
                }
            }

            // Step 2: Upload Original File
            setUploadProgress(20);

            // Get pre-signed URL for original file
            const presignResponse = await fetch("/api/scans/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type || "application/octet-stream",
                }),
            });

            if (!presignResponse.ok) throw new Error("Failed to get upload URL");

            const { uploadUrl, fileKey, publicUrl } = await presignResponse.json();

            // Upload to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type || "application/octet-stream",
                },
            });

            if (!uploadResponse.ok) throw new Error("Failed to upload file");

            setUploadProgress(80);

            // Step 3: Create Database Record
            const createResponse = await fetch("/api/scans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: formData.patientId,
                    scanType: formData.scanType,
                    bodyPart: formData.bodyPart,
                    notes: formData.notes,
                    fileUrl: publicUrl,
                    fileKey,
                    previewUrl: uploadedPreviewUrl, // Save the preview URL!
                }),
            });

            if (!createResponse.ok) throw new Error("Failed to save scan record");

            const scan = await createResponse.json();

            setUploadProgress(100);
            setUploadStatus("success");

            setTimeout(() => {
                onSuccess?.(scan);
                handleClose();
            }, 1500);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Upload failed");
            setUploadStatus("error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (isUploading) return;

        // Cleanup preview URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setFormData({ patientId: "", scanType: "", bodyPart: "", notes: "" });
        setFile(null);
        setPreviewUrl(null);
        setUploadProgress(0);
        setUploadStatus("idle");
        setError("");
        onClose();
    };

    const removeFile = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(null);
        setPreviewUrl(null);
    };

    const isFormValid = formData.patientId && formData.scanType && formData.bodyPart && file;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Upload Medical Scan"
            description="Upload a scan for AI-powered analysis"
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <ModalBody className="space-y-5">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2.5 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger"
                        >
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
                                disabled={isUploading}
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

                    {/* Scan Type */}
                    <div>
                        <label className={labelStyles}>Scan Type</label>
                        <div className="flex flex-wrap gap-2">
                            {SCAN_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, scanType: type.value })}
                                    disabled={isUploading}
                                    className={cn(
                                        "rounded-md px-3 py-2 text-xs font-medium border transition-all duration-200",
                                        formData.scanType === type.value
                                            ? type.color + " shadow-sm"
                                            : "bg-surface-2 text-muted-foreground border-border hover:bg-surface-3 hover:text-foreground",
                                        isUploading && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Body Part */}
                    <div>
                        <label className={labelStyles}>Body Part</label>
                        <div className="relative">
                            <select
                                value={formData.bodyPart}
                                onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                                required
                                disabled={isUploading}
                                className={cn(inputBaseStyles, "appearance-none cursor-pointer")}
                            >
                                <option value="">Select body part</option>
                                {BODY_PARTS.map((part) => (
                                    <option key={part} value={part}>{part}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div>
                        <label className={labelStyles}>Scan Image</label>

                        <AnimatePresence mode="wait">
                            {!file ? (
                                <motion.div
                                    key="dropzone"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-surface-2/50 p-6 cursor-pointer hover:border-primary/50 hover:bg-surface-2 transition-all duration-200"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                        <Upload className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">
                                            Drag and drop your scan here
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            or click to browse • JPEG, PNG, WebP, DICOM • Max 50MB
                                        </p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp,.dcm"
                                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                        className="hidden"
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="relative rounded-lg border border-border bg-surface-2/50 p-4"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Preview Image or Icon */}
                                        <div className="flex-shrink-0 h-20 w-20 rounded-md bg-surface-3 flex items-center justify-center overflow-hidden">
                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt="Scan preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <FileImage className="h-8 w-8 text-muted" />
                                            )}
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>

                                            {/* Upload Progress */}
                                            {uploadStatus === "uploading" && (
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                                        <span className="text-muted-foreground">Uploading...</span>
                                                        <span className="text-primary font-medium">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-primary"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadProgress}%` }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Success State */}
                                            {uploadStatus === "success" && (
                                                <div className="flex items-center gap-2 mt-3 text-success">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Upload complete!</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Remove Button */}
                                        {!isUploading && (
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="p-1.5 rounded-md hover:bg-surface-3 text-muted hover:text-foreground transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelStyles}>
                            Additional Notes <span className="text-muted font-normal">(Optional)</span>
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any relevant clinical notes for the AI analysis..."
                            rows={3}
                            disabled={isUploading}
                            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none disabled:opacity-50"
                        />
                    </div>
                </ModalBody>

                <ModalFooter>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isUploading}
                        className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="submit"
                        disabled={!isFormValid || isUploading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Image className="h-4 w-4" />
                                Upload & Analyze
                            </>
                        )}
                    </motion.button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
