"use client";

import { motion } from "motion/react";
import {
    Activity,
    Clock,
    Users,
    AlertTriangle,
    ArrowRight,
    Zap,
    TrendingUp,
    FileText,
    Brain,
    Plus,
    Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StartTriageModal, AddPatientModal, UploadScanModal } from "@/components/modals";

interface DashboardClientProps {
    data: {
        stats: {
            activeCases: number;
            avgWaitTime: string;
            patientsToday: number;
            criticalAlerts: number;
        };
        aiPerformance: {
            accuracyRate: number;
            avgResponse: string;
            casesProcessed: number;
        };
        recentReports: Array<{
            id: string;
            name: string;
            time: string;
            status: string;
        }>;
    };
    recentCases: Array<{
        id: string;
        patient: string;
        age: number;
        symptoms: string;
        urgency: string;
        aiConfidence: number;
        waitTime: string;
    }>;
    patients: Array<{
        id: string;
        name: string;
    }>;
}

interface Scan {
    id: string;
    type: string;
    createdAt: string;
    fileUrl: string;
}

const urgencyColors: Record<string, string> = {
    CRITICAL: "bg-danger/10 text-danger border-danger/20",
    HIGH: "bg-warning/10 text-warning border-warning/20",
    MEDIUM: "bg-info/10 text-info border-info/20",
    LOW: "bg-success/10 text-success border-success/20",
};

export function DashboardClient({ data, recentCases, patients }: DashboardClientProps) {
    const [showTriageModal, setShowTriageModal] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [availableScans, setAvailableScans] = useState<Scan[]>([]);
    const router = useRouter();

    const handleTriageSuccess = () => {
        router.refresh();
    };

    const handlePatientSuccess = () => {
        router.refresh();
    };

    const handleScanSuccess = () => {
        router.refresh();
    };

    // Fetch all scans when the triage modal opens
    const handleOpenTriageModal = async () => {
        setShowTriageModal(true);
        try {
            const response = await fetch("/api/scans");
            if (response.ok) {
                const scans = await response.json();
                setAvailableScans(scans);
            }
        } catch (error) {
            console.error("Failed to fetch scans:", error);
        }
    };

    const stats = [
        {
            label: "Active Cases",
            value: data.stats.activeCases.toString(),
            change: "Pending triage",
            icon: Activity,
            color: "primary",
        },
        {
            label: "Avg. Wait Time",
            value: data.stats.avgWaitTime,
            change: "Current average",
            icon: Clock,
            color: "info",
        },
        {
            label: "Encounters Today",
            value: data.stats.patientsToday.toString(),
            change: "Today's encounters",
            icon: Users,
            color: "success",
        },
        {
            label: "Critical Alerts",
            value: data.stats.criticalAlerts.toString(),
            change: "Requires attention",
            icon: AlertTriangle,
            color: "danger",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground font-display">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time overview of your triage operations
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        onClick={() => setShowPatientModal(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Patient
                    </motion.button>
                    <motion.button
                        onClick={() => setShowScanModal(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Scan
                    </motion.button>
                    <motion.button
                        onClick={handleOpenTriageModal}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 rounded-xl btn-triage-gradient px-5 py-2.5 text-sm font-semibold"
                    >
                        <Brain className="h-4 w-4" />
                        Start AI Triage
                    </motion.button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative overflow-hidden rounded-2xl border border-border bg-surface-1 p-6"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stat.value}
                                </p>
                                <p className={`text-xs mt-2 text-${stat.color}`}>{stat.change}</p>
                            </div>
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${stat.color}/10`}
                            >
                                <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Priority Queue - Takes 2 columns */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 rounded-2xl border border-border bg-surface-1 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    AI Triage Queue
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Priority-sorted by AI analysis
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/queue"
                            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                            View all
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="divide-y divide-border">
                        {recentCases.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">No pending cases</p>
                                <p className="text-sm">New cases will appear here</p>
                            </div>
                        ) : (
                            recentCases.map((caseItem, index) => (
                                <motion.div
                                    key={caseItem.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.05 }}
                                    className="p-4 hover:bg-surface-2 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">
                                                    {caseItem.id}
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    {caseItem.patient}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {caseItem.symptoms}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${urgencyColors[caseItem.urgency] || urgencyColors.MEDIUM
                                                        }`}
                                                >
                                                    {caseItem.urgency}
                                                </span>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    Wait: {caseItem.waitTime}
                                                </div>
                                            </div>
                                            <div className="w-16">
                                                <div className="text-xs text-muted-foreground mb-1">
                                                    AI: {caseItem.aiConfidence}%
                                                </div>
                                                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${caseItem.aiConfidence}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* AI Performance Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="rounded-2xl border border-border bg-surface-1 p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                                <TrendingUp className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">AI Performance</h3>
                                <p className="text-xs text-muted-foreground">Last 24 hours</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Accuracy Rate</span>
                                    <span className="text-foreground font-medium">{data.aiPerformance.accuracyRate}%</span>
                                </div>
                                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                    <div className="h-full bg-success rounded-full" style={{ width: `${data.aiPerformance.accuracyRate}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Avg. Response</span>
                                    <span className="text-foreground font-medium">{data.aiPerformance.avgResponse}</span>
                                </div>
                                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                    <div className="h-full bg-info rounded-full w-[88%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Cases Processed</span>
                                    <span className="text-foreground font-medium">{data.aiPerformance.casesProcessed.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full w-[72%]" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Reports Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="rounded-2xl border border-border bg-surface-1 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                                    <FileText className="h-5 w-5 text-warning" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        Recent Reports
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        AI-generated triage
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/reports"
                                className="text-sm text-primary hover:text-primary/80"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {data.recentReports.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    <p className="text-sm">No reports yet</p>
                                </div>
                            ) : (
                                data.recentReports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {report.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{report.time}</p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-1 rounded-lg ${report.status === "FINALIZED"
                                                ? "bg-success/10 text-success"
                                                : "bg-warning/10 text-warning"
                                                }`}
                                        >
                                            {report.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
            {/* Modals */}
            <StartTriageModal
                isOpen={showTriageModal}
                onClose={() => setShowTriageModal(false)}
                patients={patients}
                onSuccess={handleTriageSuccess}
                availableScans={availableScans}
            />
            <AddPatientModal
                isOpen={showPatientModal}
                onClose={() => setShowPatientModal(false)}
                onSuccess={handlePatientSuccess}
            />
            <UploadScanModal
                isOpen={showScanModal}
                onClose={() => setShowScanModal(false)}
                patients={patients}
                onSuccess={handleScanSuccess}
            />
        </div>
    );
}
