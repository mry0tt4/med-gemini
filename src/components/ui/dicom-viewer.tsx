"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, AlertCircle, ImageOff, ZoomIn, ZoomOut, RotateCw, Contrast } from "lucide-react";
import { cn } from "@/lib/utils";

interface DicomViewerProps {
    imageUrl: string | null;
    isLoading?: boolean;
    className?: string;
    onError?: () => void;
    thumbnail?: boolean;
}

interface ViewportState {
    scale: number;
    voi: {
        windowWidth: number;
        windowCenter: number;
    };
    rotation: number;
}

/**
 * DICOM Viewer Component
 * 
 * Supports both DICOM (.dcm) files and regular images (JPEG, PNG, WebP).
 * For DICOM files, it uses cornerstone.js for rendering.
 * For regular images, it falls back to a standard img tag.
 */
export function DicomViewer({
    imageUrl,
    isLoading = false,
    className,
    onError,
    thumbnail = false,
}: DicomViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewerError, setViewerError] = useState<string | null>(null);
    const [isDicom, setIsDicom] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [cornerstoneLoaded, setCornerstoneLoaded] = useState(false);
    const [viewportState, setViewportState] = useState<ViewportState>({
        scale: 1,
        voi: { windowWidth: 400, windowCenter: 40 },
        rotation: 0,
    });

    // Check if the URL points to a DICOM file
    useEffect(() => {
        if (imageUrl) {
            const url = imageUrl.toLowerCase();
            const hasDicomExtension = url.includes('.dcm') || url.includes('dicom') || url.includes('Dicoms');
            // Basic detection. 
            // Note: If using presigned URLs without extension, this might fail. 
            // Ideally backend sends explicit "type".
            // But we'll rely on what we have.
            const hasDicomMimeType = url.includes('application/dicom') || url.includes('image/dicom');
            setIsDicom(hasDicomExtension || hasDicomMimeType);
        }
    }, [imageUrl]);

    // Initialize Cornerstone for DICOM files
    useEffect(() => {
        if (!isDicom || !imageUrl || !containerRef.current) return;

        let cornerstone: typeof import("cornerstone-core") | null = null;
        let cornerstoneWADOLoader: typeof import("cornerstone-wado-image-loader") | null = null;
        let dicomParser: typeof import("dicom-parser") | null = null;
        let element: HTMLDivElement | null = null;
        let isEnabled = false;

        const initCornerstone = async () => {
            setIsInitializing(true);
            setViewerError(null);

            try {
                // Dynamic imports for client-side only
                cornerstone = await import("cornerstone-core");
                cornerstoneWADOLoader = await import("cornerstone-wado-image-loader");
                dicomParser = await import("dicom-parser");

                // Configure the WADO image loader
                cornerstoneWADOLoader.external.cornerstone = cornerstone;
                cornerstoneWADOLoader.external.dicomParser = dicomParser;

                // Configure web workers for decoding
                // Note: These paths must match where the files are served in public/
                // If not found, it might fail silently or throw.
                cornerstoneWADOLoader.webWorkerManager.initialize({
                    maxWebWorkers: navigator.hardwareConcurrency || 1,
                    startWebWorkersOnDemand: true,
                    // transportHandler: undefined, // Removed invalid
                    taskConfiguration: {
                        decodeTask: {
                            initializeCodecsOnStartup: false,
                            usePDFJS: false,
                            strict: false,
                        },
                    },
                });

                element = containerRef.current;
                if (!element) return;

                // Enable the element for Cornerstone
                try {
                    cornerstone.enable(element);
                    isEnabled = true;
                } catch (e) {
                    // Render might be called twice in strict mode
                    // Cornerstone might already be enabled
                }

                setCornerstoneLoaded(true);

                // Load and display the DICOM image
                const imageId = `wadouri:${imageUrl}`;
                const image = await cornerstone.loadImage(imageId);
                cornerstone.displayImage(element, image);

                // Force reset to ensure proper sizing
                cornerstone.reset(element);

                // Get initial viewport info
                const viewport = cornerstone.getViewport(element);
                if (viewport) {
                    setViewportState({
                        scale: viewport.scale || 1,
                        voi: {
                            windowWidth: viewport.voi?.windowWidth || 400,
                            windowCenter: viewport.voi?.windowCenter || 40
                        },
                        rotation: viewport.rotation || 0,
                    });
                }
            } catch (error) {
                console.warn("DICOM viewer initialization warn:", error);
                // Only show error if not thumbnail, or show simplified error
                if (!thumbnail) {
                    setViewerError(
                        "Failed to load DICOM. Use 'Download' to view externally."
                    );
                }
                onError?.();
            } finally {
                setIsInitializing(false);
            }
        };

        // Little delay to ensure container is ready
        const timer = setTimeout(() => {
            initCornerstone();
        }, 500);

        // Cleanup
        return () => {
            clearTimeout(timer);
            if (element && cornerstone && isEnabled) {
                try {
                    cornerstone.disable(element);
                } catch (e) {
                    // Element may already be disabled
                }
            }
        };
    }, [isDicom, imageUrl, onError, thumbnail]);

    // Handle resize events
    useEffect(() => {
        if (!containerRef.current || !cornerstoneLoaded || !isDicom) return;

        const element = containerRef.current;
        const resizeObserver = new ResizeObserver(() => {
            import("cornerstone-core").then((cornerstone) => {
                try {
                    cornerstone.resize(element);
                    cornerstone.reset(element);

                    // Update viewport state after reset
                    const viewport = cornerstone.getViewport(element);
                    if (viewport) {
                        setViewportState({
                            scale: viewport.scale || 1,
                            voi: {
                                windowWidth: viewport.voi?.windowWidth || 400,
                                windowCenter: viewport.voi?.windowCenter || 40
                            },
                            rotation: viewport.rotation || 0,
                        });
                    }
                } catch (e) {
                    // Ignore resize errors if element not enabled
                }
            });
        });

        resizeObserver.observe(element);

        return () => {
            resizeObserver.disconnect();
        };
    }, [cornerstoneLoaded, isDicom]);

    // Zoom handler
    const handleZoom = useCallback((direction: "in" | "out") => {
        if (!containerRef.current || !cornerstoneLoaded) return;

        import("cornerstone-core").then((cornerstone) => {
            const element = containerRef.current;
            if (!element) return;

            const viewport = cornerstone.getViewport(element);
            if (!viewport) return;

            const newScale = direction === "in"
                ? viewport.scale * 1.2
                : viewport.scale / 1.2;

            viewport.scale = Math.max(0.1, Math.min(10, newScale));
            cornerstone.setViewport(element, viewport);
            setViewportState((prev) => ({ ...prev, scale: viewport.scale }));
        });
    }, [cornerstoneLoaded]);

    // Rotation handler
    const handleRotate = useCallback(() => {
        if (!containerRef.current || !cornerstoneLoaded) return;

        import("cornerstone-core").then((cornerstone) => {
            const element = containerRef.current;
            if (!element) return;

            const viewport = cornerstone.getViewport(element);
            if (!viewport) return;

            viewport.rotation = (viewport.rotation + 90) % 360;
            cornerstone.setViewport(element, viewport);
            setViewportState((prev) => ({ ...prev, rotation: viewport.rotation }));
        });
    }, [cornerstoneLoaded]);

    // Window/Level (contrast) reset handler
    const handleResetWindowLevel = useCallback(() => {
        if (!containerRef.current || !cornerstoneLoaded) return;

        import("cornerstone-core").then((cornerstone) => {
            const element = containerRef.current;
            if (!element) return;

            cornerstone.reset(element);
            const viewport = cornerstone.getViewport(element);
            if (viewport) {
                setViewportState({
                    scale: viewport.scale,
                    voi: {
                        windowWidth: viewport.voi?.windowWidth || 400,
                        windowCenter: viewport.voi?.windowCenter || 40
                    },
                    rotation: viewport.rotation || 0,
                });
            }
        });
    }, [cornerstoneLoaded]);

    // Loading state
    if (isLoading || isInitializing) {
        return (
            <div className={cn("flex items-center justify-center bg-black", thumbnail ? "h-full w-full" : "min-h-[300px]", className)}>
                <div className="text-center text-muted">
                    <Loader2 className={cn("mx-auto animate-spin", thumbnail ? "h-4 w-4" : "h-10 w-10 mb-3")} />
                    {!thumbnail && (
                        <p className="text-sm">
                            {isInitializing ? "Initializing..." : "Loading..."}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // No image URL
    if (!imageUrl) {
        return (
            <div className={cn("flex items-center justify-center bg-black", thumbnail ? "h-full w-full" : "min-h-[300px]", className)}>
                <div className="text-center text-muted">
                    <ImageOff className={cn("mx-auto", thumbnail ? "h-6 w-6" : "h-16 w-16 mb-4")} />
                    {!thumbnail && <p>No image available</p>}
                </div>
            </div>
        );
    }

    // Error state
    if (viewerError) {
        return (
            <div className={cn("flex items-center justify-center bg-black", thumbnail ? "h-full w-full" : "min-h-[300px]", className)}>
                <div className="text-center text-danger p-2">
                    <AlertCircle className={cn("mx-auto", thumbnail ? "h-6 w-6" : "h-12 w-12 mb-4")} />
                    {!thumbnail && (
                        <>
                            <p className="text-sm mb-2">{viewerError}</p>
                            <p className="text-xs text-muted">Trying fallback image viewer...</p>
                        </>
                    )}
                    {/* Fallback to regular image */}
                    <img
                        src={imageUrl}
                        alt="Medical scan"
                        className={cn("mx-auto", thumbnail ? "max-h-full object-cover" : "mt-4 max-h-[400px]")}
                        onError={() => !thumbnail && setViewerError("Unable to display file")}
                    />
                </div>
            </div>
        );
    }

    // For DICOM files - use Cornerstone viewer
    if (isDicom) {
        return (
            <div className={cn("relative bg-black", thumbnail ? "h-full w-full" : "h-full w-full", className)}>
                {/* Cornerstone canvas container */}
                <div
                    ref={containerRef}
                    className="w-full h-full"
                    style={{
                        width: "100%",
                        height: thumbnail ? "100%" : "400px",
                        minHeight: thumbnail ? undefined : "300px",
                        cursor: (!thumbnail && cornerstoneLoaded) ? "grab" : "default"
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                />

                {/* Viewer controls - Only show if not thumbnail */}
                {!thumbnail && cornerstoneLoaded && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-lg p-2 z-10">
                        <button
                            onClick={() => handleZoom("in")}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="h-4 w-4 text-white" />
                        </button>
                        <button
                            onClick={() => handleZoom("out")}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="h-4 w-4 text-white" />
                        </button>
                        <div className="w-px h-5 bg-white/20" />
                        <button
                            onClick={handleRotate}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors"
                            title="Rotate 90°"
                        >
                            <RotateCw className="h-4 w-4 text-white" />
                        </button>
                        <button
                            onClick={handleResetWindowLevel}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors"
                            title="Reset View"
                        >
                            <Contrast className="h-4 w-4 text-white" />
                        </button>
                        <div className="w-px h-5 bg-white/20" />
                        <span className="text-xs text-white/70 px-2">
                            {Math.round(viewportState.scale * 100)}%
                        </span>
                    </div>
                )}

                {/* DICOM badge - Only show if not thumbnail */}
                {!thumbnail && (
                    <div className="absolute top-4 left-4 bg-info/80 text-white text-xs font-bold px-2 py-1 rounded z-10">
                        DICOM
                    </div>
                )}
            </div>
        );
    }

    // For regular images - use standard img tag
    return (
        <div className={cn("relative bg-black flex items-center justify-center", thumbnail ? "h-full w-full" : "min-h-[300px]", className)}>
            <img
                src={imageUrl}
                alt="Medical scan"
                className={cn("w-auto object-contain", thumbnail ? "max-h-full max-w-full" : "max-h-[500px]")}
                onError={() => {
                    if (!thumbnail) setViewerError("Failed to load image");
                    onError?.();
                }}
            />
        </div>
    );
}
