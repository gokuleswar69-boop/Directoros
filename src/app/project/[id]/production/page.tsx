"use client";

import { useState, use, useEffect } from "react";
import { Columns, Calendar as CalendarIcon, ArrowLeft, Upload, FileText, Sparkles, Edit3 } from "lucide-react";
import KanbanBoard from "@/components/project/KanbanBoard";
import ScheduleBoard from "@/components/project/ScheduleBoard";
import RightSidebar from "@/components/project/RightSidebar";
import { doc, getDoc, updateDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { parseScriptWithGemini } from "@/app/actions";
import { GradientButton } from "@/components/ui/gradient-button";

export default function ProductionWorkspace({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"script" | "board" | "schedule">("board");
    const [projectName, setProjectName] = useState<string>("Loading...");
    const [scriptText, setScriptText] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    // Fetch Project metadata
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const docSnap = await getDoc(doc(db, "projects", id));
                if (docSnap.exists()) {
                    setProjectName(docSnap.data()?.title || docSnap.data()?.name || `Project ${id}`);
                    if (docSnap.data()?.content) {
                        setScriptText(docSnap.data().content);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch project", e);
            }
        };
        fetchProject();
    }, [id]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            setScriptText(text);
        };
        reader.readAsText(file);

        // Reset so same file maps trigger onChange again if needed
        e.target.value = '';
    };

    const handleParse = async () => {
        if (!scriptText.trim()) return;
        setIsParsing(true);
        try {
            const scenes = await parseScriptWithGemini(scriptText);

            // 1. Save the raw content
            await updateDoc(doc(db, "projects", id), {
                content: scriptText
            });

            // 2. Write all parsed scenes to the 'scenes' subcollection
            if (scenes && Array.isArray(scenes)) {
                const batch = writeBatch(db);
                scenes.forEach((scene: any) => {
                    const sceneRef = doc(collection(db, "projects", id, "scenes"));
                    batch.set(sceneRef, {
                        ...scene,
                        status: "unscheduled", // Default status for Kanban
                        createdAt: new Date()
                    });
                });
                await batch.commit();
            }

            setActiveTab("board");
            alert("Analysis complete! Check the Kanban board.");
        } catch (error) {
            console.error("Parse Error:", error);
            alert("Failed to parse script. See console.");
        }
        setIsParsing(false);
    };

    return (
        <div className="h-full flex flex-col bg-neutral-950 overflow-hidden font-sans">
            {/* Top Navigation Bar */}
            <header className="flex flex-col gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-neutral-900/50 backdrop-blur-xl border-b border-white/5 z-10 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 sm:flex-row">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push(`/projects`)}
                            className="text-neutral-400 hover:text-white transition-colors"
                            title="Back to Projects"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white truncate max-w-[180px] sm:max-w-none">{projectName}</h2>
                        <div className="h-5 w-px bg-white/10 hidden md:block" />
                    </div>

                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("script")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "script" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
                        >
                            <FileText size={14} /> Upload Script
                        </button>
                        <button
                            onClick={() => setActiveTab("board")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "board" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
                        >
                            <Columns size={14} /> Board
                        </button>
                        <button
                            onClick={() => setActiveTab("schedule")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "schedule" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
                        >
                            <CalendarIcon size={14} /> Schedule
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area Layout */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative z-0">
                <div className="h-full w-full flex-1 overflow-auto p-3 sm:p-6 lg:p-8">

                    {activeTab === "script" && (
                        <div className="max-w-4xl mx-auto flex flex-col h-full space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Script Input</h2>
                                    <p className="text-neutral-400 text-sm">Paste your script here or upload a file.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                    <button
                                        onClick={() => router.push(`/project/${id}/editor`)}
                                        className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        <Edit3 size={16} />
                                        Back to Editor
                                    </button>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".txt"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            title="Upload .txt Script"
                                        />
                                        <button className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                            <Upload size={16} />
                                            Upload
                                        </button>
                                    </div>
                                    <GradientButton
                                        onClick={handleParse}
                                        disabled={isParsing || !scriptText.trim()}
                                    >
                                        {isParsing ? "Analyzing..." : <><Sparkles size={16} className="mr-2" /> Parse with AI</>}
                                    </GradientButton>
                                </div>
                            </div>

                            <textarea
                                value={scriptText}
                                onChange={(e) => setScriptText(e.target.value)}
                                placeholder="INT. COFFEE SHOP - DAY\n\nJOHN sits at the table..."
                                className="flex-1 w-full bg-[#1A1A1A] text-neutral-200 p-6 rounded-xl border border-white/10 focus:border-indigo-500 outline-none resize-none font-mono text-sm leading-relaxed"
                            />
                        </div>
                    )}

                    {activeTab === "board" && (
                        <div className="h-full min-h-[600px]">
                            <KanbanBoard projectId={id} />
                        </div>
                    )}

                    {activeTab === "schedule" && (
                        <div className="h-full min-h-[600px]">
                            <ScheduleBoard projectId={id} />
                        </div>
                    )}
                </div>

                {/* Right Analytics Sidebar */}
                {activeTab !== "script" && (
                    <div className="hidden md:block">
                        <RightSidebar projectId={id} />
                    </div>
                )}
            </div>
        </div>
    );
}
