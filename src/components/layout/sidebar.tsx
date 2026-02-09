"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfileMenu } from "./user-profile-menu";
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    Activity,
    Scan,
    Stethoscope,
    X,
    Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Triage Queue", href: "/dashboard/queue", icon: Activity },
    { label: "Patients", href: "/dashboard/patients", icon: Users },
    { label: "Scans", href: "/dashboard/scans", icon: Scan },
    { label: "Reports", href: "/dashboard/reports", icon: FileText },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// Sidebar context for mobile toggle
interface SidebarContextType {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider");
    }
    return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);
    const close = () => setIsOpen(false);

    // Close sidebar on route change (mobile)
    const pathname = usePathname();
    useEffect(() => {
        close();
    }, [pathname]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, close }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function MobileMenuButton() {
    const { toggle, isOpen } = useSidebar();

    return (
        <button
            onClick={toggle}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-1 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label={isOpen ? "Close menu" : "Open menu"}
        >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const { isOpen, close } = useSidebar();

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={close}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-surface-1 flex flex-col transition-transform duration-300 ease-in-out",
                    // Mobile: hidden by default, show when open
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-5">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold tracking-tight text-foreground">
                                Med-Gemini
                            </h1>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                Triage AI
                            </p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={close}
                        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1 stagger-reveal">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-nav"
                                                className="absolute inset-0 rounded-lg bg-primary/10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <Icon
                                            className={cn(
                                                "relative z-10 h-4 w-4 transition-colors",
                                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                            )}
                                        />
                                        <span className="relative z-10">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Profile Menu */}
                <div className="border-t border-border p-4">
                    <UserProfileMenu />
                </div>
            </aside>
        </>
    );
}
