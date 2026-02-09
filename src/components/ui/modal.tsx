"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    showCloseButton?: boolean;
}

const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = "md",
    showCloseButton = true,
}: ModalProps) {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleEscape]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={cn(
                                "relative w-full rounded-2xl border border-border bg-surface-1 shadow-2xl shadow-black/30 pointer-events-auto",
                                sizeClasses[size]
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between px-5 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {title}
                                    </h2>
                                    {description && (
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors -mr-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

// Modal Footer component for consistent button placement
interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-end gap-2.5 px-5 py-4 border-t border-border bg-surface-2/30",
                className
            )}
        >
            {children}
        </div>
    );
}

// Modal Body component for consistent padding
interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
    return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
