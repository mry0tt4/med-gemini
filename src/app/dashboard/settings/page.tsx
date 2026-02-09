"use client";

import { useState, useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
    User,
    Shield,
    Palette,
    LogOut,
    ChevronRight,
    Check,
    Camera,
    Save,
    Loader2,
    ArrowLeft,
    Lock,
    Mail,
    Eye,
    EyeOff,
} from "lucide-react";

type SettingsSection = "main" | "profile" | "security" | "appearance";

function SettingsContent() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const searchParams = useSearchParams();
    const { theme, setTheme } = useTheme();

    // Initialize section from URL param
    const [activeSection, setActiveSection] = useState<SettingsSection>("main");

    useEffect(() => {
        const section = searchParams.get("section");
        if (section && ["profile", "security", "appearance"].includes(section)) {
            setActiveSection(section as SettingsSection);
        }
    }, [searchParams]);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Profile form state
    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");

    // Security form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsLoading(true);
        setMessage(null);

        try {
            await user.update({
                firstName,
                lastName,
            });
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update profile. Please try again." });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!user) return;
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (newPassword.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters." });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            await user.updatePassword({
                currentPassword,
                newPassword,
            });
            setMessage({ type: "success", text: "Password updated successfully!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update password. Check your current password." });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsLoading(true);
        setMessage(null);

        try {
            await user.setProfileImage({ file });
            setMessage({ type: "success", text: "Profile photo updated!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to upload image. Please try again." });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="max-w-4xl space-y-8 animate-pulse">
                <div className="h-8 w-32 bg-surface-2 rounded" />
                <div className="h-32 bg-surface-2 rounded-2xl" />
                <div className="space-y-4">
                    <div className="h-20 bg-surface-2 rounded-xl" />
                    <div className="h-20 bg-surface-2 rounded-xl" />
                </div>
            </div>
        );
    }

    // Main settings menu
    if (activeSection === "main") {
        return (
            <div className="max-w-4xl space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
                        Settings
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage your account and application preferences
                    </p>
                </div>

                {/* User Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-surface-1 p-6"
                >
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            {user?.imageUrl ? (
                                <img
                                    src={user.imageUrl}
                                    alt={user.fullName || "Profile"}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-info text-2xl font-bold text-primary-foreground">
                                    {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U"}
                                </div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Camera className="h-6 w-6 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProfileImageUpload}
                                />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-foreground">
                                {user?.fullName || "User"}
                            </h2>
                            <p className="text-muted-foreground">
                                {user?.emailAddresses[0]?.emailAddress || "email@example.com"}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                    <Check className="h-3 w-3" />
                                    Verified
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ redirectUrl: "/sign-in" })}
                            className="flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </motion.div>

                {/* Account Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                        Account
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveSection("profile")}
                            className="group flex w-full items-center gap-4 rounded-xl border border-border bg-surface-1 p-4 text-left transition-all hover:border-primary/30 hover:bg-surface-2"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-foreground">Profile Settings</p>
                                <p className="text-sm text-muted-foreground">Update your name and photo</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
                        </button>

                        <button
                            onClick={() => setActiveSection("security")}
                            className="group flex w-full items-center gap-4 rounded-xl border border-border bg-surface-1 p-4 text-left transition-all hover:border-primary/30 hover:bg-surface-2"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-foreground">Security</p>
                                <p className="text-sm text-muted-foreground">Change password and security settings</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
                        </button>
                    </div>
                </motion.div>

                {/* Application Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                        Application
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveSection("appearance")}
                            className="group flex w-full items-center gap-4 rounded-xl border border-border bg-surface-1 p-4 text-left transition-all hover:border-primary/30 hover:bg-surface-2"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Palette className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-foreground">Appearance</p>
                                <p className="text-sm text-muted-foreground">Theme and display options</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Sub-section layout
    return (
        <div className="max-w-2xl space-y-6">
            {/* Back Button */}
            <button
                onClick={() => {
                    setActiveSection("main");
                    setMessage(null);
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
            </button>

            {/* Message Alert */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border",
                        message.type === "success"
                            ? "bg-success/10 border-success/20 text-success"
                            : "bg-danger/10 border-danger/20 text-danger"
                    )}
                >
                    <Check className="h-5 w-5" />
                    <p className="text-sm">{message.text}</p>
                </motion.div>
            )}

            {/* Profile Settings Section */}
            {activeSection === "profile" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div>
                        <h1 className="text-2xl font-bold text-foreground font-display">
                            Profile Settings
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Update your personal information
                        </p>
                    </div>

                    {/* Profile Photo */}
                    <div className="rounded-2xl border border-border bg-surface-1 p-6">
                        <h3 className="font-semibold text-foreground mb-4">Profile Photo</h3>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                {user?.imageUrl ? (
                                    <img
                                        src={user.imageUrl}
                                        alt={user.fullName || "Profile"}
                                        className="h-20 w-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-info text-2xl font-bold text-primary-foreground">
                                        {user?.firstName?.[0] || "U"}
                                    </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Camera className="h-6 w-6 text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleProfileImageUpload}
                                    />
                                </label>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Click the photo to upload a new image
                                </p>
                                <p className="text-xs text-muted mt-1">
                                    JPG, PNG or GIF. Max size 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Name Fields */}
                    <div className="rounded-2xl border border-border bg-surface-1 p-6 space-y-4">
                        <h3 className="font-semibold text-foreground">Personal Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-border bg-surface-2 px-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-border bg-surface-2 px-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <input
                                    type="email"
                                    value={user?.emailAddresses[0]?.emailAddress || ""}
                                    disabled
                                    className="w-full h-11 rounded-xl border border-border bg-surface-3 pl-11 pr-4 text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-muted mt-1">
                                Email cannot be changed here. Contact support if needed.
                            </p>
                        </div>

                        <button
                            onClick={handleUpdateProfile}
                            disabled={isLoading}
                            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div>
                        <h1 className="text-2xl font-bold text-foreground font-display">
                            Security
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Manage your password and security options
                        </p>
                    </div>

                    {/* Change Password */}
                    <div className="rounded-2xl border border-border bg-surface-1 p-6 space-y-4">
                        <h3 className="font-semibold text-foreground">Change Password</h3>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full h-11 rounded-xl border border-border bg-surface-2 pl-11 pr-12 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full h-11 rounded-xl border border-border bg-surface-2 pl-11 pr-12 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full h-11 rounded-xl border border-border bg-surface-2 pl-11 pr-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleUpdatePassword}
                            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Shield className="h-4 w-4" />
                            )}
                            Update Password
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Appearance Section */}
            {activeSection === "appearance" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div>
                        <h1 className="text-2xl font-bold text-foreground font-display">
                            Appearance
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Customize the look of the application
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface-1 p-6 space-y-4">
                        <h3 className="font-semibold text-foreground">Theme</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {(["dark", "light"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                                        theme === t
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-surface-2 hover:bg-surface-3"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "h-8 w-8 rounded-lg",
                                            t === "dark" ? "bg-gray-900" :
                                                t === "light" ? "bg-white border border-gray-200" :
                                                    "bg-gradient-to-br from-gray-900 to-white"
                                        )}
                                    />
                                    <span className="text-sm font-medium text-foreground capitalize">
                                        {t}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="max-w-4xl space-y-8 animate-pulse">
                <div className="h-8 w-32 bg-surface-2 rounded" />
                <div className="h-32 bg-surface-2 rounded-2xl" />
                <div className="space-y-4">
                    <div className="h-20 bg-surface-2 rounded-xl" />
                    <div className="h-20 bg-surface-2 rounded-xl" />
                </div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
