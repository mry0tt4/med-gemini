"use client";

import { useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
    Stethoscope,
    Brain,
    Zap,
    Shield,
    FileText,
    Sparkles,
    ArrowRight,
    Users,
    Heart,
    Globe,
    Clock,
    Scan,
    Menu,
    X,
} from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";

const bentoFeatures = [
    {
        icon: Brain,
        title: "Multi-Agent AI Team",
        description: "Five specialized agents—History, Scan, Diagnosis, Coding, and Orchestrator—work together for comprehensive analysis.",
        size: "large", // 40%
    },
    {
        icon: Users,
        title: "Human in the Loop",
        description: "AI provides recommendations, but doctors always have final say. Every triage requires physician approval before action.",
        size: "xlarge", // 60%
    },
    {
        icon: Zap,
        title: "Instant Triage",
        description: "Get accurate urgency assessments in under 2 seconds.",
        size: "equal",
    },
    {
        icon: Scan,
        title: "Vision Analysis",
        description: "X-rays, MRIs, and CT scans analyzed with AI Vision.",
        size: "equal",
    },
    {
        icon: FileText,
        title: "Auto Documentation",
        description: "ICD-10/CPT codes generated automatically.",
        size: "equal",
    },
];

const impactStats = [
    { value: "500+", label: "Patients per doctor daily in rural areas" },
    { value: "60%", label: "Reduction in diagnostic time" },
    { value: "10k+", label: "Patients triaged successfully" },
];

export function LandingContent() {
    const { isSignedIn, isLoaded } = useAuth();
    const { scrollY } = useScroll();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Lighting effect transforms
    const borderOpacity = useTransform(scrollY, [0, 300], [0.05, 0.4]);
    const glowOpacity = useTransform(scrollY, [0, 300], [0, 0.5]);
    const glowSpread = useTransform(scrollY, [0, 300], [0, 40]);

    return (
        <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
            {/* Subtle gradient orbs */}
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

            {/* Floating Navigation - Dynamic Island Style */}
            {/* Floating Navigation - Dynamic Island Style */}
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-none">
                <div className="pointer-events-auto w-full md:w-auto mx-auto max-w-fit px-2 py-2 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/[0.08] shadow-lg shadow-black/20 relative">
                    <div className="flex items-center justify-between gap-2 px-2 md:px-0">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/[0.05] transition-colors">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
                                <Stethoscope className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-[13px] font-medium text-white/90 hidden sm:block">
                                Med-Gemini
                            </span>
                        </Link>

                        {/* Desktop Nav Items */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Divider */}
                            <div className="w-px h-5 bg-white/[0.1]" />

                            {/* Nav Links */}
                            <div className="flex items-center">
                                <a href="#features" className="px-3 py-1.5 text-[12px] font-light text-white/50 hover:text-white/90 transition-colors rounded-full hover:bg-white/[0.05]">Features</a>
                                <a href="#impact" className="px-3 py-1.5 text-[12px] font-light text-white/50 hover:text-white/90 transition-colors rounded-full hover:bg-white/[0.05]">Impact</a>
                                <a href="#how-it-works" className="px-3 py-1.5 text-[12px] font-light text-white/50 hover:text-white/90 transition-colors rounded-full hover:bg-white/[0.05]">Process</a>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-5 bg-white/[0.1]" />

                            {/* Auth Buttons */}
                            <div className="flex items-center gap-1">
                                {isLoaded && isSignedIn ? (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/dashboard"
                                            className="px-3 py-1.5 text-[12px] font-medium text-white/70 hover:text-white transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <UserButton
                                            afterSignOutUrl="/"
                                            appearance={{
                                                elements: {
                                                    avatarBox: "h-7 w-7"
                                                }
                                            }}
                                        />
                                    </div>
                                ) : isLoaded ? (
                                    <>
                                        <Link
                                            href="/sign-in"
                                            className="px-3 py-1.5 text-[12px] font-medium text-white/70 hover:text-white transition-colors"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            href="/sign-up"
                                            className="px-4 py-1.5 rounded-full bg-primary text-[12px] font-medium text-white hover:bg-primary/90 transition-all"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                ) : (
                                    <div className="h-7 w-16 bg-white/5 rounded-full animate-pulse" />
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-white/70 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Side Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-[280px] bg-[#0a0a0f] border-l border-white/[0.08] z-50 md:hidden p-6"
                        >
                            <div className="flex justify-end mb-8">
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-white/50 hover:text-white"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="flex flex-col space-y-6">
                                <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-light text-white/70 hover:text-white">Features</a>
                                <a href="#impact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-light text-white/70 hover:text-white">Impact</a>
                                <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-light text-white/70 hover:text-white">Process</a>
                                <div className="h-px bg-white/[0.08] my-4" />
                                {isLoaded && isSignedIn ? (
                                    <Link
                                        href="/dashboard"
                                        className="text-lg font-medium text-emerald-400"
                                    >
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/sign-in" className="text-lg font-medium text-white">Sign In</Link>
                                        <Link href="/sign-up" className="text-lg font-medium text-emerald-400">Get Started</Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-32 pb-12">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[11px] font-medium tracking-widest uppercase text-emerald-400">
                                Powered by Gemini 3
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-[clamp(3.5rem,7vw,5.5rem)] font-thin leading-[0.95] tracking-tighter mb-8">
                            When doctors<br /> <span className="font-medium italic" style={{ fontFamily: 'var(--font-cursive)' }}>save time,</span>
                            <br />
                            <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent font-medium italic" style={{ fontFamily: 'var(--font-cursive)' }}>
                                they save lives.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base md:text-lg font-extralight text-white/50 leading-relaxed mb-10 max-w-2xl mx-auto tracking-wide">
                            A force multiplier for healthcare in developing nations. Our multi-agent AI automates triage and documentation, empowering doctors to focus on what matters most; saving lives.
                        </p>

                        {/* CTA Buttons - App Style */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                href={isSignedIn ? "/dashboard" : "/sign-up"}
                                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-[14px] font-medium text-white hover:bg-primary/90 transition-all"
                            >
                                {isSignedIn ? "Open Dashboard" : "Start for Free"}
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-surface-1 text-[14px] font-medium text-white/80 hover:bg-surface-2 transition-colors"
                            >
                                See How It Works
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* Dashboard Mockup - Larger & Proportionate */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-6xl mx-auto mt-16 px-4"
                >
                    {/* Glass container */}
                    <div className="relative rounded-2xl p-[1px]">
                        {/* Scroll-based active border */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500 to-cyan-500"
                            style={{ opacity: borderOpacity }}
                        />

                        {/* Static subtle border */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.15] to-white/[0.02] opacity-100" />

                        {/* Glow effect */}
                        <motion.div
                            className="absolute -top-20 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-emerald-500/30 rounded-full blur-3xl"
                            style={{ opacity: glowOpacity, filter: 'blur(60px)' }}
                        />

                        {/* Edge lighting glow */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl z-[-1]"
                            style={{ opacity: glowOpacity }}
                        />

                        <div className="rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-xl overflow-hidden border border-white/[0.05]">
                            {/* Window Controls */}
                            <div className="bg-white/[0.02] backdrop-blur-xl px-5 py-3 flex items-center gap-4 border-b border-white/[0.05]">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="h-6 px-4 flex items-center gap-2 bg-white/[0.04] rounded-lg max-w-sm w-full">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                        <span className="text-[10px] text-white/30 font-light">med-gemini.app/dashboard</span>
                                    </div>
                                </div>
                                <div className="w-16" />
                            </div>

                            {/* Dashboard Content */}
                            <div className="p-6 flex gap-6" style={{ aspectRatio: "16/9", maxHeight: "500px" }}>
                                {/* Sidebar */}
                                <div className="hidden md:flex flex-col w-48 space-y-1.5 border-r border-white/[0.04] pr-6">
                                    <div className="flex items-center gap-2 mb-4 px-3">
                                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                                            <Stethoscope className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-medium text-white/90">Med-Gemini</p>
                                            <p className="text-[9px] text-white/40">Triage AI</p>
                                        </div>
                                    </div>
                                    {["Dashboard", "Triage Queue", "Patients", "Scans", "Reports", "Settings"].map((item, i) => (
                                        <div
                                            key={item}
                                            className={`h-9 rounded-lg flex items-center px-3 text-[12px] font-light transition-all ${i === 0
                                                ? "bg-primary/15 text-emerald-400"
                                                : "text-white/35 hover:text-white/50 hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 space-y-5 overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-light text-white/90">Dashboard</h2>
                                            <p className="text-[11px] text-white/40">Welcome back, Dr. Smith</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 px-3 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                                                <span className="text-[10px] text-white/50">AI Connected</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { label: "Active Cases", value: "24", change: "+3" },
                                            { label: "Avg Wait", value: "8m", change: "-2m" },
                                            { label: "Today", value: "156", change: "+12" },
                                            { label: "Critical", value: "3", change: "" },
                                        ].map((stat) => (
                                            <div key={stat.label} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                                                <p className="text-white/30 text-[10px] font-light uppercase tracking-wider mb-1">{stat.label}</p>
                                                <div className="flex items-end gap-2">
                                                    <p className="text-2xl font-light text-white/90">{stat.value}</p>
                                                    {stat.change && (
                                                        <span className={`text-[10px] ${stat.change.startsWith('+') ? 'text-success' : 'text-info'}`}>{stat.change}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Chart and Queue */}
                                    <div className="grid grid-cols-5 gap-4 flex-1">
                                        {/* Chart */}
                                        <div className="col-span-3 bg-white/[0.02] rounded-xl p-5 border border-white/[0.04]">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[11px] text-white/50">Triage Volume</p>
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Week</span>
                                                </div>
                                            </div>
                                            <div className="flex items-end justify-between gap-3 h-24">
                                                {[35, 55, 40, 70, 50, 85, 60].map((h, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h}%` }}
                                                        transition={{ duration: 0.6, delay: 0.8 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                                    <span key={day} className="text-[9px] text-white/30 flex-1 text-center">{day}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recent Queue */}
                                        <div className="col-span-2 bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                                            <p className="text-[11px] text-white/50 mb-3">Recent Queue</p>
                                            <div className="space-y-2">
                                                {[
                                                    { name: "Sarah M.", urgency: "HIGH", time: "2m" },
                                                    { name: "John D.", urgency: "MEDIUM", time: "5m" },
                                                    { name: "Emily R.", urgency: "LOW", time: "8m" },
                                                ].map((patient, i) => (
                                                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-white/[0.05] flex items-center justify-center text-[9px] text-white/50">
                                                                {patient.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <span className="text-[11px] text-white/70">{patient.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${patient.urgency === 'HIGH' ? 'bg-danger/20 text-danger' :
                                                                patient.urgency === 'MEDIUM' ? 'bg-warning/20 text-warning' :
                                                                    'bg-success/20 text-success'
                                                                }`}>{patient.urgency}</span>
                                                            <span className="text-[9px] text-white/30">{patient.time}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section - Bento Grid */}
            <section id="features" className="relative py-32 px-6">
                {/* Glass divider */}


                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-center mb-16"
                    >
                        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-emerald-400/80 mb-4">
                            Capabilities
                        </p>
                        <h2 className="text-3xl md:text-4xl font-extralight tracking-tight mb-4">
                            Multi-agent system for best results
                        </h2>
                        <p className="text-white/40 font-light max-w-lg mx-auto">
                            Powered by Gemini 3. Specialized AI agents work together
                            while keeping doctors in full control.
                        </p>
                    </motion.div>

                    {/* Bento Grid - 2 rows */}
                    <div className="space-y-4">
                        {/* First Row - 40% + 60% */}
                        <div className="grid md:grid-cols-5 gap-4">
                            {bentoFeatures.slice(0, 2).map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className={`group relative p-6 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500 ${i === 0 ? 'md:col-span-2' : 'md:col-span-3'
                                            }`}
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-2 text-white/90">{feature.title}</h3>
                                        <p className="text-[14px] font-light text-white/40 leading-relaxed">{feature.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Second Row - 3 equal */}
                        <div className="grid md:grid-cols-3 gap-4">
                            {bentoFeatures.slice(2, 5).map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.5, delay: (i + 2) * 0.1 }}
                                        className="group relative p-6 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-medium mb-1.5 text-white/90">{feature.title}</h3>
                                        <p className="text-[13px] font-light text-white/40 leading-relaxed">{feature.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="impact" className="relative py-32 px-6">
                {/* Glass divider */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-center mb-16"
                    >
                        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-emerald-400/80 mb-4">
                            Impact
                        </p>
                        <h2 className="text-3xl md:text-4xl font-extralight tracking-tight mb-4">
                            Built for the frontlines of healthcare
                        </h2>
                        <p className="text-white/40 font-light max-w-2xl mx-auto">
                            In developing countries, a single doctor often sees over 500 patients daily.
                            Med-Gemini was built to give these heroes the support they deserve.
                        </p>
                    </motion.div>

                    {/* Impact Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/10"
                        >
                            <Globe className="h-8 w-8 text-emerald-400 mb-6" />
                            <h3 className="text-xl font-light mb-3 text-white/90">Designed for Access</h3>
                            <p className="text-[14px] font-light text-white/50 leading-relaxed">
                                In rural health centers across India, Africa, and Southeast Asia, doctors face
                                impossible patient loads. Our AI doesn&apos;t replace doctors—it amplifies their
                                capabilities, helping them serve more patients without compromising care quality.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="p-8 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-rose-500/10 to-orange-500/5 border border-rose-500/10"
                        >
                            <Heart className="h-8 w-8 text-rose-400 mb-6" />
                            <h3 className="text-xl font-light mb-3 text-white/90">Social Mission</h3>
                            <p className="text-[14px] font-light text-white/50 leading-relaxed">
                                This isn&apos;t just a product—it&apos;s a mission. Every feature is designed with
                                resource-constrained environments in mind. Low bandwidth? Works offline.
                                Limited hardware? Runs on basic devices. Healthcare equity is at our core.
                            </p>
                        </motion.div>
                    </div>

                    {/* Impact Stats */}
                    <div className="grid grid-cols-3 gap-6">
                        {impactStats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center p-6 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]"
                            >
                                <p className="text-3xl md:text-4xl font-extralight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </p>
                                <p className="text-[12px] text-white/40 font-light">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="relative py-32 px-6">
                {/* Glass divider */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-center mb-20"
                    >
                        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-emerald-400/80 mb-4">
                            Process
                        </p>
                        <h2 className="text-3xl md:text-4xl font-extralight tracking-tight">
                            Three steps to better outcomes
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-12 md:gap-8">
                        {[
                            {
                                step: "01",
                                title: "Upload",
                                description: "Add patient data, symptoms, and medical scans to the system.",
                                icon: Clock,
                            },
                            {
                                step: "02",
                                title: "Analyze",
                                description: "Multi-agent AI collaborates to assess urgency and risks.",
                                icon: Brain,
                            },
                            {
                                step: "03",
                                title: "Review & Act",
                                description: "Doctor reviews AI recommendations and approves action.",
                                icon: Shield,
                            },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.step}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: i * 0.15 }}
                                    className="text-center"
                                >
                                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-6">
                                        <Icon className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <span className="text-4xl font-extralight text-white/[0.08] block mb-3">{item.step}</span>
                                    <h3 className="text-lg font-medium mb-2 text-white/90">{item.title}</h3>
                                    <p className="text-[14px] font-light text-white/40 leading-relaxed">{item.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <h2 className="text-3xl md:text-4xl font-extralight tracking-tight mb-4">
                            Ready to transform care?
                        </h2>
                        <p className="text-white/40 font-light mb-10">
                            Join healthcare teams using Med-Gemini to improve patient outcomes.
                        </p>
                        <Link
                            href={isSignedIn ? "/dashboard" : "/sign-up"}
                            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-[14px] font-medium text-white hover:bg-primary/90 transition-all"
                        >
                            {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer with Top Border */}
            <footer className="relative py-8 px-6 border-t border-emerald-500/10 bg-emerald-950/30 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-emerald-500" />
                            <span className="text-[13px] font-medium text-white/50">Med-Gemini</span>
                        </div>
                        <p className="text-[12px] text-white/30 font-light text-center md:text-left">
                            © 2026 Med-Gemini AI. Built with ❤️ for healthcare workers everywhere.
                        </p>
                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto mt-4 md:mt-0">
                            <a href="#" className="text-[12px] text-white/30 hover:text-white/50 transition-colors">Privacy</a>
                            <a href="#" className="text-[12px] text-white/30 hover:text-white/50 transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
