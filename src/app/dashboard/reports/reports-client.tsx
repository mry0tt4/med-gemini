"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
    Search,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Brain,
    FileX,
    Eye,
} from "lucide-react";
import { useState } from "react";
import { ViewReportModal } from "@/components/modals";
import { useRouter } from "next/navigation";

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

interface ReportsClientProps {
    reports: Report[];
}

const urgencyColors: Record<string, string> = {
    CRITICAL: "bg-danger text-white",
    HIGH: "bg-warning text-primary-foreground",
    MEDIUM: "bg-info text-primary-foreground",
    LOW: "bg-success text-primary-foreground",
};

// Helper to strip markdown for list preview
function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
        .replace(/\*([^*]+)\*/g, '$1')       // Italic
        .replace(/^#+\s*/gm, '')             // Headers
        .replace(/^-\s+/gm, '')              // List items
        .replace(/⚠️/g, '')                  // Warning emoji
        .replace(/\n+/g, ' ')                // Newlines to spaces
        .trim();
}

export function ReportsClient({ reports }: ReportsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const router = useRouter();

    const filteredReports = reports
        .filter(report =>
            searchQuery === "" ||
            report.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.summary.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(report => !statusFilter || report.status === statusFilter);

    const handleApproveReport = async (reportId: string) => {
        try {
            const response = await fetch(`/api/reports/${reportId}/approve`, {
                method: "POST",
            });
            if (response.ok) {
                setSelectedReport(null);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to approve report:", error);
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
                            Triage Reports
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {reports.length} reports • {reports.filter(r => r.status === "DRAFT").length} pending review
                        </p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-xl border border-border bg-surface-1 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setStatusFilter(null)}
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                !statusFilter
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-surface-2 text-foreground hover:bg-surface-3"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter(statusFilter === "DRAFT" ? null : "DRAFT")}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                statusFilter === "DRAFT"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-surface-2 text-foreground hover:bg-surface-3"
                            )}
                        >
                            <AlertCircle className="h-4 w-4 text-warning" />
                            Drafts
                        </button>
                        <button
                            onClick={() => setStatusFilter(statusFilter === "FINALIZED" ? null : "FINALIZED")}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                statusFilter === "FINALIZED"
                                    ? "bg-success/20 text-success"
                                    : "bg-surface-2 text-foreground hover:bg-surface-3"
                            )}
                        >
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            Finalized
                        </button>
                    </div>
                </div>

                {/* Reports List */}
                <div className="space-y-3">
                    {filteredReports.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-surface-1"
                        >
                            <FileX className="h-16 w-16 text-muted mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
                            <p className="text-muted-foreground text-center max-w-md">
                                {reports.length === 0
                                    ? "Triage reports will appear here after patient encounters are processed."
                                    : "No reports match your current filters."}
                            </p>
                        </motion.div>
                    ) : (
                        filteredReports.map((report, index) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div
                                    onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                                    className="group flex items-center gap-6 rounded-xl border border-border bg-surface-1 p-5 transition-all hover:border-primary/30 hover:bg-surface-2 cursor-pointer"
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
                                        report.status === "DRAFT"
                                            ? "bg-warning/10 text-warning"
                                            : "bg-success/10 text-success"
                                    )}>
                                        <FileText className="h-6 w-6" />
                                    </div>

                                    {/* Report Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-semibold text-foreground">{report.patient}</p>
                                            <span className="font-mono text-xs text-muted">{report.id.slice(0, 8)}</span>
                                            <span className={cn(
                                                "rounded-full px-2 py-0.5 text-xs font-bold",
                                                urgencyColors[report.urgency] || urgencyColors.MEDIUM
                                            )}>
                                                {report.urgency}
                                            </span>
                                            <span className={cn(
                                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                                report.status === "DRAFT"
                                                    ? "bg-warning/10 text-warning"
                                                    : "bg-success/10 text-success"
                                            )}>
                                                {report.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{stripMarkdown(report.summary)}</p>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Brain className="h-4 w-4 text-primary" />
                                                <span className="text-xs text-muted-foreground">Confidence</span>
                                            </div>
                                            <span className="text-lg font-bold text-foreground">{report.aiConfidence}%</span>
                                        </div>

                                        <div className="text-center border-l border-border pl-6">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Clock className="h-4 w-4 text-muted" />
                                                <span className="text-xs text-muted-foreground">Created</span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{report.date}</p>
                                        </div>
                                    </div>

                                    {/* Quick Preview Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedReport(report);
                                        }}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:bg-surface-3 hover:text-primary"
                                        title="Quick Preview"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* View Report Modal */}
            <ViewReportModal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                report={selectedReport}
                onApprove={handleApproveReport}
            />
        </>
    );
}
