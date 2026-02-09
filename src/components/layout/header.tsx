"use client";

import { Bell, Search, Command, X, Users, FileText, Scan as ScanIcon, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MobileMenuButton } from "./sidebar";

interface SearchResult {
    id: string;
    type: "patient" | "scan" | "report" | "action";
    title: string;
    subtitle?: string;
    href: string;
    icon: React.ElementType;
}

const quickActions: SearchResult[] = [
    { id: "dashboard", type: "action", title: "Go to Dashboard", href: "/dashboard", icon: Activity },
    { id: "patients", type: "action", title: "View All Patients", href: "/dashboard/patients", icon: Users },
    { id: "scans", type: "action", title: "View All Scans", href: "/dashboard/scans", icon: ScanIcon },
    { id: "reports", type: "action", title: "View All Reports", href: "/dashboard/reports", icon: FileText },
    { id: "new-patient", type: "action", title: "Add New Patient", href: "/dashboard/patients?new=true", icon: Users },
];

export function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Handle keyboard shortcut (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === "Escape") {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Search functionality
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults(quickActions);
            return;
        }

        setIsLoading(true);
        try {
            // Search patients
            const patientsRes = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
            const patients = patientsRes.ok ? await patientsRes.json() : [];

            const results: SearchResult[] = [];

            // Add matching patients
            if (Array.isArray(patients)) {
                patients.slice(0, 5).forEach((patient: any) => {
                    results.push({
                        id: patient.id,
                        type: "patient",
                        title: patient.name,
                        subtitle: `${patient.gender} · ${patient.age || "N/A"}`,
                        href: `/dashboard/patients/${patient.id}`,
                        icon: Users,
                    });
                });
            }

            // Add matching quick actions
            quickActions.forEach((action) => {
                if (action.title.toLowerCase().includes(query.toLowerCase())) {
                    results.push(action);
                }
            });

            setSearchResults(results.length > 0 ? results : quickActions);
            setSelectedIndex(0);
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults(quickActions);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 200);

        return () => clearTimeout(timer);
    }, [searchQuery, performSearch]);

    // Initialize with quick actions
    useEffect(() => {
        if (isSearchOpen && searchResults.length === 0) {
            setSearchResults(quickActions);
        }
    }, [isSearchOpen, searchResults.length]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && searchResults[selectedIndex]) {
            e.preventDefault();
            router.push(searchResults[selectedIndex].href);
            setIsSearchOpen(false);
            setSearchQuery("");
        }
    };

    const handleResultClick = (result: SearchResult) => {
        router.push(result.href);
        setIsSearchOpen(false);
        setSearchQuery("");
    };

    return (
        <>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface-0/80 backdrop-blur-xl px-4 lg:px-6">
                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                    <MobileMenuButton />
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 flex-1 max-w-xl ml-4 lg:ml-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Search patients, reports, scans..."
                            onClick={() => setIsSearchOpen(true)}
                            readOnly
                            className="h-10 w-full rounded-lg border border-border bg-surface-1 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted">
                            <kbd className="hidden sm:flex h-5 items-center rounded border border-border bg-surface-2 px-1.5 font-mono text-[10px]">
                                <Command className="h-2.5 w-2.5" />
                            </kbd>
                            <kbd className="hidden sm:flex h-5 items-center rounded border border-border bg-surface-2 px-1.5 font-mono text-[10px]">
                                K
                            </kbd>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Status Indicator - Hidden on small screens */}
                    <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1.5">
                        <motion.div
                            className="h-2 w-2 rounded-full bg-success"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                            AI Connected
                        </span>
                    </div>

                    {/* Notifications removed */}
                </div>
            </header>

            {/* Command Palette Modal */}
            <AnimatePresence>
                {isSearchOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSearchOpen(false)}
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        />

                        {/* Command Palette */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15 }}
                            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 px-4"
                        >
                            <div className="rounded-xl border border-border bg-surface-1 shadow-2xl overflow-hidden">
                                {/* Search Input */}
                                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                                    <Search className="h-5 w-5 text-muted" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search patients, scans, or type a command..."
                                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setIsSearchOpen(false)}
                                        className="flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Results */}
                                <div className="max-h-80 overflow-y-auto p-2">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="space-y-1">
                                            {!searchQuery && (
                                                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                                    Quick Actions
                                                </p>
                                            )}
                                            {searchResults.map((result, index) => {
                                                const Icon = result.icon;
                                                return (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => handleResultClick(result)}
                                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${index === selectedIndex
                                                            ? "bg-primary/10 text-primary"
                                                            : "text-foreground hover:bg-surface-2"
                                                            }`}
                                                    >
                                                        <Icon className="h-4 w-4 text-muted" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {result.title}
                                                            </p>
                                                            {result.subtitle && (
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {result.subtitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted capitalize">
                                                            {result.type}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Search className="h-8 w-8 text-muted mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                No results found
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono">↑↓</kbd>
                                        <span>Navigate</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono">↵</kbd>
                                        <span>Select</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono">esc</kbd>
                                        <span>Close</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
