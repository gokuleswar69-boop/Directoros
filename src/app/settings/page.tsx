"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Mail, Shield, Save } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        // In a real scenario we'd update Firebase Auth Profile
        // Example: await updateProfile(auth.currentUser, { displayName })
        setTimeout(() => {
            setIsSaving(false);
            alert("Settings saved successfully.");
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] w-full font-sans text-white p-4 md:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
                <header>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">Account Settings</h1>
                    <p className="text-neutral-400 text-base md:text-lg">Manage your director profile and preferences.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-8 md:gap-12 items-start">

                    <div className="space-y-8 flex-1">
                        {/* Profile Section */}
                        <section className="bg-[#161616] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-xl">
                            <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                                <User className="text-indigo-400" size={20} />
                                <h2 className="text-lg sm:text-2xl font-bold">Profile Details</h2>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="E.g. Jules Vega"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">Email Address</label>
                                    <div className="w-full bg-[#1C1C1C] border border-white/5 rounded-xl px-4 py-3 text-neutral-500 flex items-center gap-3 cursor-not-allowed">
                                        <Mail size={18} />
                                        {user?.email || "director@example.com"}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2 italic">Email cannot be changed directly.</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
                                </button>
                            </div>
                        </section>

                        {/* Security Section (Placeholder) */}
                        <section className="bg-[#161616] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-xl">
                            <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                                <Shield className="text-emerald-400" size={20} />
                                <h2 className="text-lg sm:text-2xl font-bold">Security & Limits</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 py-3 border-b border-white/5">
                                    <span className="font-bold text-sm sm:text-base text-neutral-300">Password</span>
                                    <button className="text-indigo-400 text-sm font-bold hover:text-indigo-300">Change Password</button>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="font-bold text-neutral-300">Two-Factor Auth</span>
                                    <span className="text-neutral-500 text-sm font-bold px-3 py-1 bg-white/5 rounded-lg border border-white/5">Disabled</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="bg-[#161616] border border-white/5 rounded-3xl p-6 shadow-xl sticky top-8">
                        <h3 className="font-bold text-neutral-400 uppercase tracking-widest text-xs mb-4">Danger Zone</h3>
                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                        <p className="text-xs text-neutral-500 mt-4 text-center leading-relaxed">
                            Signing out will require you to enter your credentials on the next visit.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
