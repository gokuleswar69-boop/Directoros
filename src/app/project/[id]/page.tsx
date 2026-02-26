"use client";

import { useState, use, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, doc, getDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FileText, Upload, LayoutPanelLeft, ArrowRight, Sparkles, Clock, FileType2, Edit2, Check, X, ImageIcon } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { WebGLShader } from "@/components/ui/web-gl-shader";

export default function ProjectHubPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [projectName, setProjectName] = useState<string>("Loading...");
    const [scripts, setScripts] = useState<any[]>([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Edit & Banner State
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const docSnap = await getDoc(doc(db, "projects", id));
                if (docSnap.exists() && docSnap.data().name) {
                    setProjectName(docSnap.data().name);
                } else if (docSnap.exists() && docSnap.data().title) {
                    setProjectName(docSnap.data().title);
                } else {
                    setProjectName(`Project ${id}`);
                }

                if (docSnap.exists() && docSnap.data().bannerUrl) {
                    setBannerUrl(docSnap.data().bannerUrl);
                }
            } catch (e) {
                console.error("Failed to fetch project name", e);
            }
        };
        fetchProject();

        const q = query(
            collection(db, "projects", id, "scripts"),
            orderBy("updatedAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setScripts(fetched);
        });

        return () => unsubscribe();
    }, [id]);

    const handleCreateScript = async (method: "ai" | "manual" | "imported", initialContent: string = "", initialTitle: string = "Untitled Script") => {
        setIsCreating(true);
        try {
            const newDoc = await addDoc(collection(db, "projects", id, "scripts"), {
                title: initialTitle,
                content: initialContent,
                creationMethod: method,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                progress: "writing"
            });

            // Navigate to editor
            let url = `/project/${id}/editor/${newDoc.id}`;
            if (method === "ai" && aiPrompt) {
                sessionStorage.setItem(`ai_prompt_${newDoc.id}`, aiPrompt);
                url += `?mode=ai`;
            } else if (method === "manual") {
                url += `?mode=manual`;
            } else if (method === "imported") {
                url += `?mode=manual`;
            }

            router.push(url);
        } catch (error) {
            console.error("Error creating script:", error);
            alert("Failed to create script. Please check console (Firestore rules or connection).");
            setIsCreating(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            await handleCreateScript("imported", text, file.name.replace(".txt", ""));
        };
        reader.readAsText(file);
    };

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;
        handleCreateScript("ai", "", aiPrompt.slice(0, 30) + "...");
    };

    const handleNameSave = async () => {
        if (!editNameValue.trim() || editNameValue === projectName) {
            setIsEditingName(false);
            return;
        }
        try {
            await updateDoc(doc(db, "projects", id), {
                name: editNameValue.trim(),
                title: editNameValue.trim()
            });
            setProjectName(editNameValue.trim());
            setIsEditingName(false);
        } catch (e) {
            console.error("Failed to rename project", e);
            alert("Failed to save project name. Please check your connection.");
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optional: rudimentary size check (1MB) to avoid firestore document overflow
        if (file.size > 1024 * 1024 * 1) {
            alert("Image is too large. Please select an image under 1MB.");
            return;
        }

        setIsUploadingBanner(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            try {
                await updateDoc(doc(db, "projects", id), { bannerUrl: dataUrl });
                setBannerUrl(dataUrl);
            } catch (err) {
                console.error("Failed to upload banner", err);
                alert("Image too large for database limits. Try a smaller image.");
            }
            setIsUploadingBanner(false);
        };
        reader.readAsDataURL(file);

        // Reset the input so selecting the same file triggers the onChange again
        e.target.value = '';
    };

    return (
        <div className="relative flex w-full min-h-screen flex-col items-center justify-center overflow-x-hidden bg-black font-sans">
            <WebGLShader />
            <div className="relative border border-[#27272a] p-6 md:p-10 w-full mx-auto max-w-[1400px] rounded-[2rem] bg-black/40 backdrop-blur-2xl shadow-2xl my-8">

                {/* Banner Section */}
                {bannerUrl && (
                    <div className="w-full h-48 md:h-64 rounded-xl mb-10 overflow-hidden relative border border-white/10 group">
                        <img src={bannerUrl} alt="Project Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                        <label className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <ImageIcon size={14} />
                            {isUploadingBanner ? 'Uploading...' : 'Change Banner'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} disabled={isUploadingBanner} />
                        </label>
                    </div>
                )}

                <header className="mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 group flex flex-wrap items-center gap-4">
                            {isEditingName ? (
                                <div className="flex items-center gap-2 w-full max-w-xl">
                                    <input
                                        type="text"
                                        value={editNameValue}
                                        onChange={e => setEditNameValue(e.target.value)}
                                        className="bg-black/40 border border-amber-500/50 rounded-xl px-4 py-2 text-3xl md:text-4xl text-amber-50 font-black focus:outline-none focus:border-amber-400 min-w-0 flex-1 z-50 hover:bg-black/60 relative"
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <button onClick={(e) => { e.stopPropagation(); handleNameSave(); }} className="p-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors border border-emerald-500/30 relative z-50">
                                        <Check size={20} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setIsEditingName(false); }} className="p-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30 relative z-50">
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-sm line-clamp-2">{projectName}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditNameValue(projectName); setIsEditingName(true); }}
                                        className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/5 relative z-50"
                                        title="Edit Project Name"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </>
                            )}
                        </h1>
                        <p className="text-neutral-400 text-lg md:text-xl font-medium tracking-wide">Director's Hub</p>
                    </div>

                    {/* Add Banner Button (if no banner exists) */}
                    {!bannerUrl && (
                        <label className="shrink-0 inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors">
                            <ImageIcon size={16} />
                            {isUploadingBanner ? 'Uploading...' : 'Add Banner Image'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} disabled={isUploadingBanner} />
                        </label>
                    )}
                </header>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

                    {/* Left Column: Actions */}
                    <div className="flex-1 space-y-12 max-w-3xl">

                        {/* AI Prompt Box */}
                        <section>
                            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Draft a script with AI</h2>
                            <form onSubmit={handleAiSubmit} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl transition-all focus-within:border-white/20">
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="A thriller scene where two spies meet at a coffee shop..."
                                        className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none resize-none min-h-[100px] text-lg leading-relaxed"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAiSubmit(e);
                                            }
                                        }}
                                    />
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                                            <Sparkles size={16} className="text-purple-400" />
                                            <span>Press Enter or TAB</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={isCreating || !aiPrompt.trim()}
                                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                            >
                                                Generate Script
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </section>

                        {/* Quick Actions */}
                        <section>
                            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Start writing</h2>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                                <GradientButton onClick={() => handleCreateScript("manual")} disabled={isCreating} className="flex-1 justify-center whitespace-nowrap">
                                    <FileText size={18} className="mr-2 opacity-70" />
                                    Blank Script
                                </GradientButton>

                                <div className="relative flex-1">
                                    <input
                                        type="file"
                                        accept=".txt"
                                        onChange={handleFileUpload}
                                        disabled={isCreating}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                    />
                                    <GradientButton variant="variant" className="w-full justify-center whitespace-nowrap">
                                        <Upload size={18} className="mr-2 opacity-70" />
                                        Upload Script
                                    </GradientButton>
                                </div>

                                <button
                                    onClick={() => router.push(`/project/${id}/production`)}
                                    className="flex-1 flex justify-center items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-white/10 text-white rounded-[11px] px-9 py-4 font-bold transition-colors whitespace-nowrap group"
                                >
                                    <LayoutPanelLeft size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                    Production Board
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Scripts List */}
                    <div className="w-full lg:w-[400px] xl:w-[450px]">
                        <div className="flex items-center gap-8 border-b border-white/10 pb-4 mb-6">
                            <button className="text-sm font-bold text-white border-b-2 border-white pb-4 -mb-[18px]">My Scripts</button>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {scripts.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                    <FileType2 size={32} className="mx-auto mb-3 opacity-20" />
                                    <p>No scripts yet.</p>
                                    <p className="text-sm mt-1">Create one to get started.</p>
                                </div>
                            ) : (
                                scripts.map(script => (
                                    <div
                                        key={script.id}
                                        onClick={() => {
                                            if (script.progress === "production") {
                                                router.push(`/project/${id}/production`);
                                            } else {
                                                router.push(`/project/${id}/editor/${script.id}`);
                                            }
                                        }}
                                        className="group bg-[#1A1A1A] hover:bg-[#222222] border border-white/5 hover:border-white/10 p-5 rounded-2xl cursor-pointer transition-all flex items-start gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-black/50 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-neutral-200 truncate group-hover:text-amber-400 transition-colors">{script.title || "Untitled Script"}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${script.creationMethod === 'ai' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    script.creationMethod === 'imported' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                    {script.creationMethod === 'ai' ? 'AI Writing' : script.creationMethod === 'imported' ? 'Imported' : 'Manual Writing'}
                                                </span>

                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${script.progress === 'production' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                                                    }`}>
                                                    {script.progress === 'production' ? 'Production Phase' : 'Writing Phase'}
                                                </span>

                                                <span className="text-[10px] text-neutral-500 flex items-center gap-1 w-full mt-1">
                                                    <Clock size={10} />
                                                    {script.createdAt?.toDate ? new Date(script.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center h-full pt-2">
                                            <ArrowRight size={18} className="text-neutral-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
