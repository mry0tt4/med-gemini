"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "motion/react";
import {
    User,
    Settings,
    LogOut,
    ChevronUp,
    Shield,
    Camera,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function UserProfileMenu() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get user initials
    const getInitials = () => {
        if (!user) return "U";
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U";
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-surface-3" />
                <div className="flex-1 min-w-0">
                    <div className="h-4 w-24 bg-surface-3 rounded mb-1" />
                    <div className="h-3 w-20 bg-surface-3 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div ref={menuRef} className="relative">
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-3 rounded-lg bg-surface-2 p-3 transition-all hover:bg-surface-3",
                    isOpen && "bg-surface-3"
                )}
            >
                {user?.imageUrl ? (
                    <img
                        src={user.imageUrl}
                        alt={user.fullName || "Profile"}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
                    />
                ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-info text-sm font-bold text-primary-foreground">
                        {getInitials()}
                    </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-foreground">
                        {user?.fullName || "My Account"}
                    </p>
                    <p className="truncate text-xs text-muted">
                        {user?.emailAddresses[0]?.emailAddress || "Manage profile"}
                    </p>
                </div>
                <ChevronUp
                    className={cn(
                        "h-4 w-4 text-muted transition-transform",
                        isOpen ? "rotate-180" : "rotate-0"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-surface-1 shadow-xl shadow-black/20"
                    >
                        {/* User Info Header */}
                        <div className="p-4 border-b border-border bg-surface-2/50">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {user?.imageUrl ? (
                                        <img
                                            src={user.imageUrl}
                                            alt={user.fullName || "Profile"}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-info text-lg font-bold text-primary-foreground">
                                            {getInitials()}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-1 border border-border">
                                        <Camera className="h-3 w-3 text-muted" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {user?.fullName || "User"}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {user?.emailAddresses[0]?.emailAddress}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            <Link
                                href="/dashboard/settings?section=profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-2"
                            >
                                <User className="h-4 w-4 text-muted" />
                                Manage Account
                            </Link>
                            <Link
                                href="/dashboard/settings?section=security"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-2"
                            >
                                <Shield className="h-4 w-4 text-muted" />
                                Security Settings
                            </Link>

                        </div>

                        {/* Sign Out */}
                        <div className="p-2 border-t border-border">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    signOut({ redirectUrl: "/sign-in" });
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
