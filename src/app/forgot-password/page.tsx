"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "motion/react";
import {
    Mail,
    ArrowRight,
    Loader2,
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
    const { isLoaded, signIn } = useSignIn();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [complete, setComplete] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError("");

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });
            setSuccessfulCreation(true);
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Failed to send reset code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError("");

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code,
                password,
            });

            if (result.status === "complete") {
                setComplete(true);
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Password reset failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050508] text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[20%] w-[800px] h-[800px] bg-emerald-600/8 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-cyan-500/6 rounded-full blur-[180px]" />
            </div>

            {/* Grain overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10 px-6 my-8"
            >
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/[0.05] transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4 text-white"
                            >
                                <path d="M4.8 2.3A.3.3 0 1 0 5.2 2l-.4.3z" />
                                <path d="M6 5a6 6 0 0 1 12 0v14" />
                                <path d="M9 17h6" />
                                <circle cx="12" cy="2" r=".3" />
                                <path d="M11 2h2" />
                            </svg>
                        </div>
                        <span className="text-[15px] font-medium text-white/90">
                            Med-Gemini
                        </span>
                    </Link>
                </div>

                <div className="p-8 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] shadow-2xl shadow-black/20">
                    {complete ? (
                        <div className="text-center py-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
                            >
                                <CheckCircle2 className="h-8 w-8" />
                            </motion.div>
                            <h2 className="text-2xl font-light text-white mb-2">Password reset successful</h2>
                            <p className="text-sm text-white/40 mb-8">
                                Your passsword has been updated. You can now sign in with your new password.
                            </p>
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-lg bg-emerald-600 font-medium text-white hover:bg-emerald-500 transition-all w-full"
                            >
                                Sign in now
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            {!successfulCreation ? (
                                <>
                                    <div className="text-center mb-8">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 mx-auto mb-4">
                                            <KeyRound className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-2xl font-light text-white mb-2">Reset password</h2>
                                        <p className="text-sm text-white/40">
                                            Enter your email and we&apos;ll send you a code to reset your password.
                                        </p>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20"
                                        >
                                            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                            <p className="text-xs text-red-400">{error}</p>
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleSendCode} className="space-y-4">
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Email address"
                                                required
                                                className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/[0.08] pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={cn(
                                                "w-full h-11 rounded-lg font-medium text-[14px] text-white transition-all flex items-center justify-center gap-2",
                                                isLoading
                                                    ? "bg-emerald-600/50 cursor-not-allowed"
                                                    : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                                            )}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Sending code...
                                                </>
                                            ) : (
                                                <>
                                                    Send reset code
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-light text-white mb-2">Check your email</h2>
                                        <p className="text-sm text-white/40">
                                            We sent a code to <span className="text-white font-medium">{email}</span>
                                        </p>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20"
                                        >
                                            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                            <p className="text-xs text-red-400">{error}</p>
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleReset} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-2">
                                                Reset code
                                            </label>
                                            <input
                                                type="text"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                placeholder="Enter 6-digit code"
                                                required
                                                className="w-full h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center text-xl tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-2">
                                                New password
                                            </label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Enter new password"
                                                    required
                                                    className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/[0.08] pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={cn(
                                                "w-full h-11 rounded-lg font-medium text-[14px] text-white transition-all flex items-center justify-center gap-2 mt-2",
                                                isLoading
                                                    ? "bg-emerald-600/50 cursor-not-allowed"
                                                    : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                                            )}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Resetting...
                                                </>
                                            ) : (
                                                <>
                                                    Reset password
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}

                            <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
                                <Link
                                    href="/sign-in"
                                    className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to sign in
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
