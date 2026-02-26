"use client";

import { useState } from "react";
import {
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [mode, setMode] = useState<"signup" | "signin">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handlePostLoginRedirect = async (uid: string) => {
        const pendingPrompt = sessionStorage.getItem("pending_ai_intro_prompt");
        if (pendingPrompt) {
            try {
                const projectsQuery = query(collection(db, "projects"), where("ownerId", "==", uid));
                const snapshot = await getDocs(projectsQuery);
                const existing = snapshot.docs.map((d) => d.data());
                const unnamedCount = existing.filter((p) => p.title && p.title.startsWith("Unnamed")).length;
                const title = unnamedCount > 0 ? `Unnamed ${unnamedCount + 1}` : "Unnamed";
                const newDoc = await addDoc(collection(db, "projects"), {
                    title,
                    content: "",
                    ownerId: uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    progress: "writing",
                    creationMethod: "ai",
                });
                sessionStorage.setItem(`ai_prompt_${newDoc.id}`, pendingPrompt);
                sessionStorage.removeItem("pending_ai_intro_prompt");
                router.push(`/project/${newDoc.id}/editor?mode=ai`);
                return;
            } catch (err) {
                console.error("Error creating project from pending prompt:", err);
                sessionStorage.removeItem("pending_ai_intro_prompt");
            }
        }
        router.push("/projects");
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            if (mode === "signup") {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                if (firstName || lastName) {
                    await updateProfile(result.user, {
                        displayName: `${firstName} ${lastName}`.trim(),
                    });
                }
                await handlePostLoginRedirect(result.user.uid);
            } else {
                const result = await signInWithEmailAndPassword(auth, email, password);
                await handlePostLoginRedirect(result.user.uid);
            }
        } catch (err: any) {
            const msg = err.code === "auth/email-already-in-use"
                ? "An account with this email already exists."
                : err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
                    ? "Invalid email or password."
                    : err.code === "auth/weak-password"
                        ? "Password must be at least 6 characters."
                        : err.code === "auth/invalid-email"
                            ? "Please enter a valid email address."
                            : err.message;
            setError(msg);
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            await handlePostLoginRedirect(result.user.uid);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setError("");
        setIsLoading(true);
        try {
            const provider = new OAuthProvider("apple.com");
            provider.addScope("email");
            provider.addScope("name");
            const result = await signInWithPopup(auth, provider);
            await handlePostLoginRedirect(result.user.uid);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white relative overflow-hidden px-4">
            {/* Aurora Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-black" />
                <div className="absolute top-[5%] left-[10%] w-[800px] h-[400px] rounded-full bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-transparent blur-[100px] rotate-[-15deg]" />
                <div className="absolute bottom-[5%] right-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-rose-500/15 via-orange-400/10 to-emerald-500/15 blur-[120px]" />
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-[440px]">
                <div className="bg-[#1a1a1e]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-7 md:p-9 shadow-2xl shadow-black/50">

                    {/* Close Button */}
                    <div className="flex justify-between items-center mb-6">
                        {/* Tab Switcher */}
                        <div className="flex bg-white/[0.06] border border-white/[0.08] rounded-full p-1">
                            <button
                                onClick={() => { setMode("signup"); setError(""); }}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${mode === "signup"
                                    ? "bg-white/[0.12] text-white shadow-sm"
                                    : "text-neutral-400 hover:text-white"
                                    }`}
                            >
                                Sign up
                            </button>
                            <button
                                onClick={() => { setMode("signin"); setError(""); }}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${mode === "signin"
                                    ? "bg-white/[0.12] text-white shadow-sm"
                                    : "text-neutral-400 hover:text-white"
                                    }`}
                            >
                                Sign in
                            </button>
                        </div>
                        <button
                            onClick={() => router.push("/")}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black mb-7 tracking-tight">
                        {mode === "signup" ? "Create an account" : "Welcome back"}
                    </h2>

                    {/* Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {/* Name Fields (Sign Up Only) */}
                        {mode === "signup" && (
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="First name"
                                        className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Last name"
                                        className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                                required
                                minLength={6}
                                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-11 pr-12 py-3.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                                {error}
                            </p>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 text-sm shadow-lg shadow-white/5"
                        >
                            {isLoading
                                ? "Please wait..."
                                : mode === "signup"
                                    ? "Create an account"
                                    : "Sign in"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/[0.08]" />
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.15em]">
                            or sign in with
                        </span>
                        <div className="flex-1 h-px bg-white/[0.08]" />
                    </div>

                    {/* Social Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-all disabled:opacity-50"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.462.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                        </button>
                        <button
                            onClick={handleAppleLogin}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-all disabled:opacity-50"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 22" fill="white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.94 0c.12 1.54-.45 3.06-1.48 4.15-.98 1.09-2.57 1.93-4.14 1.82-.13-1.5.53-3.08 1.44-4.06C11.76.82 13.4.08 14.94 0zM17.74 7.4c-1.08.63-2.54 2.1-2.47 4.55.09 2.96 2.6 3.95 2.64 3.96-.02.07-.41 1.42-1.36 2.81-.82 1.2-1.67 2.39-3.02 2.42-1.32.03-1.74-.78-3.25-.78s-1.98.76-3.23.8c-1.3.05-2.29-1.3-3.12-2.5C2.19 15.8.87 11.7 2.68 8.9c.9-1.39 2.5-2.26 4.24-2.29 1.27-.02 2.47.86 3.25.86.78 0 2.24-1.06 3.78-.91.64.03 2.45.26 3.61 1.96l-.82.88z" />
                            </svg>
                        </button>
                    </div>

                    {/* Terms */}
                    <p className="text-[11px] text-neutral-500 text-center mt-6 leading-relaxed">
                        By creating an account, you agree to our{" "}
                        <span className="text-neutral-300 cursor-pointer hover:underline">Terms & Service</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
