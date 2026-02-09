"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
    Clock,
    ChevronRight,
    Brain,
    Filter,
    Search,
    RefreshCw,
    Inbox,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface QueueItem {
    id: string;
    encounterId: string;
    patient: string;
    age: number;
    symptoms: string;
    urgency: string;
    waitTime: string;
    aiConfidence: number;
    arrivalTime: string;
}

interface QueueClientProps {
    queueItems: QueueItem[];
}

const urgencyColors: Record<string, string> = {
    CRITICAL: "bg-danger text-white",
    HIGH: "bg-warning text-primary-foreground",
    MEDIUM: "bg-info text-primary-foreground",
    LOW: "bg-success text-primary-foreground",
};

const urgencyBorder: Record<string, string> = {
    CRITICAL: "border-l-danger",
    HIGH: "border-l-warning",
    MEDIUM: "border-l-info",
    LOW: "border-l-success",
};

export function QueueClient({ queueItems }: QueueClientProps) {
    const [filter, setFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredItems = queueItems
        .filter(item => filter === "all" || item.urgency === filter)
        .filter(item =>
            searchQuery === "" ||
            item.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.symptoms.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
                        Triage Queue
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {queueItems.length} patients waiting • AI-ranked by urgency
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </motion.button>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-surface-1 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted" />
                    {["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((urgency) => (
                        <button
                            key={urgency}
                            onClick={() => setFilter(urgency)}
                            className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-colors",
                                filter === urgency
                                    ? urgency === "all"
                                        ? "bg-primary text-primary-foreground"
                                        : urgencyColors[urgency]
                                    : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                            )}
                        >
                            {urgency === "all" ? "All" : urgency}
                        </button>
                    ))}
                </div>
            </div>

            {/* Queue List */}
            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-surface-1"
                    >
                        <Inbox className="h-16 w-16 text-muted mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No patients in queue</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            {queueItems.length === 0
                                ? "New patient encounters will appear here for AI-assisted triage."
                                : "No patients match your current filters."}
                        </p>
                    </motion.div>
                ) : (
                    filteredItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link
                                href={`/dashboard/reports/${item.encounterId}`}
                                className={cn(
                                    "group flex items-center gap-6 rounded-xl border border-border border-l-4 bg-surface-1 p-5 transition-all hover:bg-surface-2 hover:border-primary/30",
                                    urgencyBorder[item.urgency] || urgencyBorder.MEDIUM
                                )}
                            >
                                {/* Priority Number */}
                                <div className={cn(
                                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                    urgencyColors[item.urgency] || urgencyColors.MEDIUM
                                )}>
                                    {item.urgency === "CRITICAL" ? "!" : index + 1}
                                </div>

                                {/* Patient Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-lg font-semibold text-foreground">{item.patient}</p>
                                        <span className="text-sm text-muted-foreground">{item.age} years</span>
                                        <span className="font-mono text-xs text-muted">{item.id}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{item.symptoms}</p>
                                </div>

                                {/* AI Analysis */}
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Brain className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium text-foreground">AI Confidence</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-20 overflow-hidden rounded-full bg-surface-3">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        item.aiConfidence >= 90 ? "bg-success" :
                                                            item.aiConfidence >= 80 ? "bg-info" : "bg-warning"
                                                    )}
                                                    style={{ width: `${item.aiConfidence}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-foreground">{item.aiConfidence}%</span>
                                        </div>
                                    </div>

                                    <div className="text-center border-l border-border pl-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-4 w-4 text-muted" />
                                            <span className="text-sm text-muted-foreground">Waiting</span>
                                        </div>
                                        <p className="text-lg font-semibold text-foreground">{item.waitTime}</p>
                                    </div>

                                    <div className="text-center border-l border-border pl-6">
                                        <span className="text-sm text-muted-foreground">Arrived</span>
                                        <p className="text-sm font-medium text-foreground">{item.arrivalTime}</p>
                                    </div>
                                </div>

                                <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
                            </Link>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
