"use client";

import { useState } from "react";
import { useSignUp, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    AlertCircle,
    User,
    Check,
    Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
    const { isLoaded, signUp, setActive } = useSignUp();
    // We need signIn to handle OAuth even on sign-up page (Clerk convention)
    const { signIn } = useSignIn();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError("");

        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName,
                lastName,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError("");

        try {
            const result = await signUp.attemptEmailAddressVerification({ code });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.push("/dashboard");
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        // We use signUp.authenticateWithRedirect if accessible, otherwise signIn handles creation for OAuth too
        if (!isLoaded || !signIn) return;
        try {
            // Typically OAuth flows initiate from signIn even for new users in Clerk
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (err) {
            console.error("OAuth error", err);
        }
    };

    // Password strength indicators
    const passwordChecks = [
        { label: "8+ characters", valid: password.length >= 8 },
        { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
        { label: "Number", valid: /[0-9]/.test(password) },
    ];

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
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
                            <Stethoscope className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-[13px] font-medium text-white/90">
                            Med-Gemini
                        </span>
                    </Link>
                </div>

                <div className="p-8 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] shadow-2xl shadow-black/20">
                    {!pendingVerification ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-light text-white mb-2">Create account</h2>
                                <p className="text-sm text-white/40">Join Med-Gemini today</p>
                            </div>

                            {/* Google Sign Up */}
                            <button
                                onClick={handleGoogleSignUp}
                                className="w-full h-11 mb-6 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all flex items-center justify-center gap-3 text-sm font-medium text-white/80"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="flex items-center gap-4 py-4">
                                <div className="h-px flex-1 bg-white/[0.1]" />
                                <span className="text-xs uppercase text-white/30 font-medium tracking-wider">Or with email</span>
                                <div className="h-px flex-1 bg-white/[0.1]" />
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

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="First Name"
                                            required
                                            className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/[0.08] pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Last Name"
                                            required
                                            className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                        />
                                    </div>
                                </div>

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

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create password"
                                            required
                                            className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/[0.08] pl-11 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    {/* Password Strength */}
                                    {password && (
                                        <div className="flex gap-3 px-1">
                                            {passwordChecks.map((check) => (
                                                <span
                                                    key={check.label}
                                                    className={cn(
                                                        "text-[10px] flex items-center gap-1 transition-colors",
                                                        check.valid ? "text-emerald-400" : "text-white/30"
                                                    )}
                                                >
                                                    <Check className={cn("h-3 w-3", !check.valid && "opacity-30")} />
                                                    {check.label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
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
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create account
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-light text-white mb-2">Verify email</h2>
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

                            <form onSubmit={handleVerify} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        Verification code
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        required
                                        className="w-full h-14 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center text-2xl tracking-[0.5em] font-light text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
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
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify email
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="text-center mt-6">
                        <p className="text-sm text-white/40">
                            Already have an account?{" "}
                            <Link href="/sign-in" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
