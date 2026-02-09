"use client";

import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
    FileText,
    Brain,
    Calendar,
    User,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Printer,
    Download,
    Copy,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Report {
    id: string;
    patient: string;
    patientId: string;
    date: string;
    urgency: string;
    summary: string;
    recommendedAction: string;
    aiConfidence: number;
    status: string;
    suggestedICD10: string[];
    suggestedCPT: string[];
}

interface ViewReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report | null;
    onApprove?: (reportId: string) => void;
}

const urgencyColors: Record<string, { bg: string; text: string; border: string }> = {
    LOW: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
    MEDIUM: { bg: "bg-info/10", text: "text-info", border: "border-info/20" },
    HIGH: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
    CRITICAL: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" },
};

export function ViewReportModal({ isOpen, onClose, report, onApprove }: ViewReportModalProps) {
    const [copied, setCopied] = useState(false);

    if (!report) return null;

    const urgencyStyle = urgencyColors[report.urgency] || urgencyColors.MEDIUM;

    const handleCopy = async () => {
        const text = `
TRIAGE REPORT - ${report.id}
Patient: ${report.patient}
Date: ${report.date}
Urgency: ${report.urgency}

SUMMARY:
${report.summary}

RECOMMENDED ACTION:
${report.recommendedAction}

SUGGESTED CODES:
ICD-10: ${report.suggestedICD10.join(", ")}
CPT: ${report.suggestedCPT.join(", ")}

AI Confidence: ${(report.aiConfidence * 100).toFixed(0)}%
Status: ${report.status}
        `.trim();

        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Triage Report"
            description={`${report.urgency} urgency • ${report.date}`}
            size="lg"
        >
            <ModalBody className="space-y-6">
                {/* Urgency Banner */}
                <div
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border",
                        urgencyStyle.bg,
                        urgencyStyle.border
                    )}
                >
                    <div className={cn("p-3 rounded-full", urgencyStyle.bg)}>
                        <AlertTriangle className={cn("h-6 w-6", urgencyStyle.text)} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className={cn("font-bold text-lg", urgencyStyle.text)}>
                                {report.urgency}
                            </span>
                            <span className="text-muted-foreground">Urgency Level</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            AI Confidence: {(report.aiConfidence * 100).toFixed(0)}%
                        </p>
                    </div>
                    <div
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                            report.status === "FINALIZED"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                        )}
                    >
                        {report.status === "FINALIZED" ? (
                            <CheckCircle2 className="h-3 w-3" />
                        ) : (
                            <Clock className="h-3 w-3" />
                        )}
                        {report.status}
                    </div>
                </div>

                {/* Patient Info */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        {report.patient.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">{report.patient}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {report.date}
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-muted" />
                        Summary
                    </h3>
                    <div className="text-sm leading-relaxed p-4 rounded-xl bg-surface-2 prose-report">
                        <ReactMarkdown>{report.summary}</ReactMarkdown>
                    </div>
                </div>

                {/* Recommended Action */}
                <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Brain className="h-4 w-4 text-primary" />
                        Recommended Action
                    </h3>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-info/5 border border-primary/10 prose-report">
                        <ReactMarkdown>{report.recommendedAction}</ReactMarkdown>
                    </div>
                </div>

                {/* Suggested Codes */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">
                            ICD-10 Codes
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {report.suggestedICD10.length > 0 ? (
                                report.suggestedICD10.map((code) => (
                                    <span
                                        key={code}
                                        className="inline-flex items-center gap-1 rounded-lg bg-info/10 px-3 py-1.5 text-sm font-mono text-info"
                                    >
                                        {code}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    No codes suggested
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">
                            CPT Codes
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {report.suggestedCPT.length > 0 ? (
                                report.suggestedCPT.map((code) => (
                                    <span
                                        key={code}
                                        className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-mono text-success"
                                    >
                                        {code}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    No codes suggested
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Report ID */}
                <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted">Report ID</p>
                    <p className="font-mono text-sm text-muted-foreground">{report.id}</p>
                </div>
            </ModalBody>

            <ModalFooter className="flex-wrap gap-2">
                <button
                    onClick={handleCopy}
                    className={cn(
                        "flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium transition-colors",
                        copied ? "text-success" : "text-foreground hover:bg-surface-3"
                    )}
                >
                    {copied ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4" />
                            Copy
                        </>
                    )}
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors"
                >
                    <Printer className="h-4 w-4" />
                    Print
                </button>

                <div className="flex-1" />

                <button
                    onClick={onClose}
                    className="rounded-xl border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition-colors"
                >
                    Close
                </button>

                {report.status === "DRAFT" && onApprove && (
                    <motion.button
                        onClick={() => onApprove(report.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-success/25"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Report
                    </motion.button>
                )}
            </ModalFooter>
        </Modal>
    );
}
