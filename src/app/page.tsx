"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, type Variants, type Easing } from "framer-motion";
import Image from "next/image";
import {
    Sparkles, ArrowRight, Clapperboard, PenTool, Calendar,
    Wand2, Brain, LayoutGrid, ChevronDown, Play, Film, Zap,
    Users, BarChart3, Star
} from "lucide-react";

const EASE_OUT: Easing = "easeOut";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.7, ease: EASE_OUT },
    }),
};

const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.1 } },
};

export default function FrontPage() {
    const [prompt, setPrompt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setIsSubmitting(true);

        // Save prompt to sessionStorage for post-login retrieval
        sessionStorage.setItem("pending_ai_intro_prompt", prompt.trim());

        // Redirect to login
        setTimeout(() => {
            router.push("/login?redirect=onboarding_ai");
        }, 600);
    };

    const features = [
        {
            icon: <Wand2 size={28} />,
            title: "AI Script Generation",
            description: "Describe your vision in plain language. Our AI Director writes industry-standard screenplays with proper formatting, scene structure, and compelling dialogue.",
            gradient: "from-purple-500 to-indigo-600",
            glow: "shadow-purple-500/20",
        },
        {
            icon: <PenTool size={28} />,
            title: "Professional Script Editor",
            description: "A rich text editor built for screenwriters. Tanglish support, auto-formatting, font controls, and export to PDF/DOCX — all without leaving the app.",
            gradient: "from-amber-400 to-orange-600",
            glow: "shadow-amber-500/20",
        },
        {
            icon: <LayoutGrid size={28} />,
            title: "Smart Production Board",
            description: "Drag-and-drop Kanban boards to manage scenes through every phase. From unscheduled to wrapped — track your entire production visually.",
            gradient: "from-emerald-400 to-teal-600",
            glow: "shadow-emerald-500/20",
        },
        {
            icon: <Calendar size={28} />,
            title: "Master Schedule",
            description: "A 24-hour timeline calendar built for directors. Color-coded projects, scene details, cast lists, and shoot-day planning — all in one view.",
            gradient: "from-rose-400 to-pink-600",
            glow: "shadow-rose-500/20",
        },
        {
            icon: <Brain size={28} />,
            title: "AI Scene Analysis",
            description: "Automatic mood detection, prop identification, and character extraction. Every scene is analyzed by AI to give you a complete breakdown instantly.",
            gradient: "from-cyan-400 to-blue-600",
            glow: "shadow-cyan-500/20",
        },
        {
            icon: <Users size={28} />,
            title: "Cast & Crew Management",
            description: "Track characters across scenes, manage your team, and see who is needed where. The production assistant you always wished you had.",
            gradient: "from-violet-400 to-purple-600",
            glow: "shadow-violet-500/20",
        },
    ];

    const stats = [
        { value: "10x", label: "Faster Script Writing" },
        { value: "24/7", label: "AI Director Available" },
        { value: "100%", label: "Free to Start" },
    ];

    return (
        <div className="relative min-h-screen bg-black text-white overflow-x-hidden font-sans">

            {/* Animated Grid Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
            </div>

            {/* Floating Orbs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]"
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[120px]"
                />
                <motion.div
                    animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[10%] left-[40%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[150px]"
                />
            </div>

            {/* Navigation Bar */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-black/40 backdrop-blur-xl border-b border-white/5"
            >
                <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Director's Cut" width={36} height={36} className="rounded-xl bg-white/10 p-0.5" />
                    <span className="text-lg font-black tracking-tight hidden sm:block">DIRECTOR'S CUT</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/login")}
                        className="text-sm font-bold text-neutral-400 hover:text-white transition-colors px-4 py-2"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => router.push("/login")}
                        className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                        Get Started Free
                    </button>
                </div>
            </motion.nav>

            {/* ============== HERO SECTION ============== */}
            <motion.section
                ref={heroRef}
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-32 pb-20"
            >
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 text-neutral-300 text-sm font-bold px-5 py-2 rounded-full mb-8 backdrop-blur-md"
                >
                    <Sparkles size={14} className="text-amber-400" />
                    <span>AI-Powered Filmmaking Platform</span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-center max-w-5xl leading-[0.95] tracking-tight mb-6"
                >
                    <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                        Write. Direct.{" "}
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Produce.
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.7 }}
                    className="text-lg md:text-xl text-neutral-400 max-w-2xl text-center leading-relaxed mb-12"
                >
                    Your all-in-one AI filmmaking ecosystem. Describe your scene —
                    we'll generate the script, break down the shots, and schedule the shoot. All from one prompt.
                </motion.p>

                {/* AI Prompt Box */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.7 }}
                    className="w-full max-w-3xl relative group"
                >
                    {/* Glow ring */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 group-focus-within:opacity-50 transition-all duration-700" />

                    <form onSubmit={handleSubmit} className="relative">
                        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-xl focus-within:border-white/20 transition-all">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your movie idea... e.g., A noir thriller in rain-drenched Tokyo where a detective discovers his partner is the killer..."
                                className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none resize-none min-h-[120px] text-lg leading-relaxed"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                    <Sparkles size={14} className="text-purple-400" />
                                    <span>Press Enter to generate your project</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !prompt.trim()}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                >
                                    {isSubmitting ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                            <Sparkles size={16} />
                                        </motion.div>
                                    ) : (
                                        <>
                                            Start Creating <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>

                {/* Example Prompts */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="flex flex-wrap justify-center gap-3 mt-8 max-w-3xl"
                >
                    {[
                        "A sci-fi short film on Mars",
                        "Two friends road trip comedy",
                        "Horror in an abandoned hospital",
                        "A love story set in 1960s Paris"
                    ].map((example, i) => (
                        <button
                            key={i}
                            onClick={() => setPrompt(example)}
                            className="text-xs font-bold text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 px-4 py-2 rounded-full transition-all"
                        >
                            {example}
                        </button>
                    ))}
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute bottom-8 text-neutral-500"
                >
                    <ChevronDown size={28} />
                </motion.div>
            </motion.section>

            {/* ============== STATS BAR ============== */}
            <section className="relative z-10 border-y border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={fadeUp}
                            custom={i}
                            className="text-center"
                        >
                            <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                {stat.value}
                            </div>
                            <div className="text-neutral-500 font-bold text-sm uppercase tracking-widest">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ============== HOW IT WORKS ============== */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="text-center mb-20"
                    >
                        <span className="text-indigo-400 text-sm font-black uppercase tracking-widest mb-4 block">How It Works</span>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">
                            From idea to{" "}
                            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                                production
                            </span>{" "}
                            in minutes
                        </h2>
                        <p className="text-neutral-400 text-lg max-w-xl mx-auto">
                            Three simple steps to turn your creative vision into a fully-organized film production.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "01", icon: <Sparkles size={32} />, title: "Describe Your Vision", desc: "Type your movie idea into the AI prompt box. Be as detailed or vague as you'd like." },
                            { step: "02", icon: <Film size={32} />, title: "AI Generates Your Script", desc: "Our AI Director writes a properly formatted screenplay with scenes, dialogue, and action." },
                            { step: "03", icon: <Clapperboard size={32} />, title: "Plan & Produce", desc: "Drag scenes to your Kanban board, schedule shoots, and track progress — all in one place." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                custom={i}
                                className="relative bg-[#111] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all group"
                            >
                                <div className="text-[80px] font-black text-white/[0.03] absolute top-4 right-6 leading-none select-none">
                                    {item.step}
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============== FEATURES GRID ============== */}
            <section className="relative z-10 py-32 px-6 bg-gradient-to-b from-transparent to-[#0A0A0A]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="text-center mb-20"
                    >
                        <span className="text-purple-400 text-sm font-black uppercase tracking-widest mb-4 block">Features</span>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">
                            Everything a director{" "}
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">needs</span>
                        </h2>
                        <p className="text-neutral-400 text-lg max-w-xl mx-auto">
                            A complete digital toolbox designed for modern filmmakers — from script to screen.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                custom={i}
                                className={`relative bg-[#111] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all group hover:shadow-2xl ${feature.glow}`}
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black mb-3">{feature.title}</h3>
                                <p className="text-neutral-400 leading-relaxed text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ============== CTA SECTION ============== */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/30">
                            <Clapperboard size={40} className="text-white" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black mb-6">
                            Ready to{" "}
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                direct
                            </span>
                            ?
                        </h2>
                        <p className="text-neutral-400 text-lg mb-10 max-w-xl mx-auto">
                            Stop juggling tools. Start creating. Your next masterpiece is one prompt away.
                        </p>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 inline-flex items-center gap-3"
                        >
                            <Play size={20} /> Start Creating — It's Free
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ============== FOOTER ============== */}
            <footer className="relative z-10 border-t border-white/5 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-lg bg-white/10 p-0.5" />
                        <span className="font-black text-sm tracking-tight text-neutral-400">DIRECTOR'S CUT</span>
                    </div>
                    <p className="text-neutral-600 text-sm">
                        © 2026 Director's Cut. Built for creators, by creators.
                    </p>
                </div>
            </footer>
        </div>
    );
}
