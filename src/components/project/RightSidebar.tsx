"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, CircleDashed, Clock, Users, Calendar, Activity, ChevronRight, Plus, MessageSquare, Lightbulb, Info, X } from "lucide-react";

export default function RightSidebar({ projectId }: { projectId: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [upcomingScenes, setUpcomingScenes] = useState<any[]>([]);

    // Notes state
    const [notes, setNotes] = useState<any[]>([]);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [newNoteType, setNewNoteType] = useState<"Note" | "Idea" | "Hint" | "Meeting">("Note");
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        waiting: 0,
        progress: 0
    });

    useEffect(() => {
        if (!projectId) return;

        // Scenes Listener
        const scenesQ = query(collection(db, "projects", projectId, "scenes"));
        const unsubscribeScenes = onSnapshot(scenesQ, (snapshot) => {
            let total = 0;
            let completed = 0;
            let inProgress = 0;
            let waiting = 0;
            const upcoming: any[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                total++;
                if (data.status === "shot" || data.status === "edit" || data.completed) {
                    completed++;
                } else if (data.status === "scheduled") {
                    inProgress++;
                    if (data.shoot_date) {
                        upcoming.push({ id: doc.id, ...data });
                    }
                } else {
                    waiting++;
                }
            });

            // Sort upcoming dates
            upcoming.sort((a, b) => new Date(a.shoot_date).getTime() - new Date(b.shoot_date).getTime());
            setUpcomingScenes(upcoming);

            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            setStats({ total, completed, inProgress, waiting, progress });
        });

        // Notes Listener
        const notesQ = query(collection(db, "projects", projectId, "notes"), orderBy("createdAt", "desc"));
        const unsubscribeNotes = onSnapshot(notesQ, (snapshot) => {
            const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotes(fetchedNotes);
        });

        return () => {
            unsubscribeScenes();
            unsubscribeNotes();
        };
    }, [projectId]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteContent.trim() || !projectId) return;

        setIsSubmittingNote(true);
        try {
            await addDoc(collection(db, "projects", projectId, "notes"), {
                content: newNoteContent.trim(),
                type: newNoteType,
                createdAt: serverTimestamp()
            });
            setNewNoteContent("");
        } catch (error) {
            console.error("Error adding note:", error);
        }
        setIsSubmittingNote(false);
    };

    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (stats.progress / 100) * circumference;

    const miniCircumference = 2 * Math.PI * 20;
    const miniStrokeDashoffset = miniCircumference - (stats.progress / 100) * miniCircumference;

    return (
        <>
            {isVisible && (
                <div
                    onClick={() => setIsExpanded(true)}
                    className={`fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full bg-neutral-900/80 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-center hover:bg-neutral-800 transition-all cursor-pointer group hover:scale-105 ${isExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}
                    title="Open Analytics"
                >
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="20" className="stroke-neutral-800" strokeWidth="4" fill="transparent" />
                            <circle
                                cx="24" cy="24" r="20"
                                className="stroke-indigo-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                                strokeWidth="4" fill="transparent" strokeLinecap="round"
                                strokeDasharray={miniCircumference}
                                strokeDashoffset={miniStrokeDashoffset}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-white">{stats.progress}%</span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVisible(false);
                        }}
                        className="absolute -top-1 -right-1 bg-neutral-800 rounded-full p-0.5 border border-white/10 text-neutral-400 hover:text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hide trigger"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-[65] bg-black/20 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {/* The Sidebar Panel */}
            <div
                className={`fixed top-0 right-0 h-full z-[70] bg-neutral-900/80 backdrop-blur-3xl border-l border-white/10 flex flex-col py-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden w-80 px-6 shadow-2xl shadow-black/50 ${isExpanded ? 'translate-x-0 visible' : 'translate-x-full invisible'}`}
            >
                <button
                    onClick={() => setIsExpanded(false)}
                    className="absolute top-4 right-4 p-2 z-50 text-white/40 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
                >
                    <ChevronRight size={16} />
                </button>

                <div className="w-full h-full flex flex-col gap-8 overflow-y-auto pr-2 scrollbar-hide relative pt-4">
                    {/* Team Header */}
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Selected</p>
                            <h3 className="text-white font-bold">Production Team</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/50">
                            <Users size={18} />
                        </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="bg-black/30 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center relative shadow-xl">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="45" className="stroke-neutral-800" strokeWidth="12" fill="transparent" />
                                <circle
                                    cx="80" cy="80" r="45"
                                    className="stroke-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">{stats.progress}%</span>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-400 font-bold mt-2 uppercase tracking-wider">Total Progress</p>
                    </div>

                    {/* Stats Grid */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Scenes Overview</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Total</p>
                                <p className="text-2xl font-black text-blue-400 border-l-2 border-blue-500 pl-3">{stats.total}</p>
                            </div>
                            <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Completed</p>
                                <p className="text-2xl font-black text-emerald-400 border-l-2 border-emerald-500 pl-3">{stats.completed}</p>
                            </div>
                            <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">In Progress</p>
                                <p className="text-2xl font-black text-amber-400 border-l-2 border-amber-500 pl-3">{stats.inProgress}</p>
                            </div>
                            <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Waiting</p>
                                <p className="text-2xl font-black text-violet-400 border-l-2 border-violet-500 pl-3">{stats.waiting}</p>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Call Sheets / Scheduled Scenes */}
                    <div className="pb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={16} className="text-indigo-400" />
                            <h4 className="text-white font-bold text-sm">Upcoming Call Sheets</h4>
                        </div>
                        <div className="space-y-3">
                            {upcomingScenes.length === 0 ? (
                                <p className="text-xs text-neutral-500 italic">No scheduled scenes right now.</p>
                            ) : (
                                upcomingScenes.map(scene => (
                                    <div key={scene.id} className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex items-start gap-3 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                        <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                                            <Calendar size={14} />
                                        </div>
                                        <div>
                                            <p className="text-neutral-200 text-xs font-bold leading-tight mb-1" title={scene.slugline}>
                                                Scene {scene.scene_number}: {scene.slugline?.substring(0, 20)}...
                                            </p>
                                            <p className="text-indigo-400 text-[10px] font-bold">
                                                Shoot: {scene.shoot_date}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* --- NEW: PROJECT NOTES & IDEAS --- */}
                    <div className="flex-1 pb-8 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb size={16} className="text-amber-400" />
                            <h4 className="text-white font-bold text-sm">Project Notes & Ideas</h4>
                        </div>

                        {/* Add Note Form */}
                        <form onSubmit={handleAddNote} className="mb-6 bg-black/20 border border-white/5 p-3 rounded-2xl flex flex-col gap-3">
                            <textarea
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                placeholder="Jot down a quick idea or note..."
                                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none h-20 placeholder:text-neutral-600"
                                required
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1.5 flex-wrap">
                                    {(["Note", "Idea", "Hint", "Meeting"] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewNoteType(type)}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${newNoteType === type
                                                ? type === 'Idea' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                    : type === 'Hint' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                        : type === 'Meeting' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                                            : 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40'
                                                : 'bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newNoteContent.trim() || isSubmittingNote}
                                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </form>

                        {/* Notes Timeline/List */}
                        <div className="space-y-4">
                            {notes.length === 0 ? (
                                <p className="text-xs text-neutral-600 italic text-center py-4">No notes yet. Start brainstorming!</p>
                            ) : (
                                notes.map(note => {
                                    const dateStr = note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';

                                    // Styling based on type
                                    let typeColor = "bg-neutral-500";
                                    let typeBg = "bg-neutral-500/10 border-neutral-500/20";
                                    let typeText = "text-neutral-300";
                                    let Icon = MessageSquare;

                                    if (note.type === "Idea") {
                                        typeColor = "bg-amber-500";
                                        typeBg = "bg-amber-500/10 border-amber-500/20";
                                        typeText = "text-amber-300";
                                        Icon = Lightbulb;
                                    } else if (note.type === "Hint") {
                                        typeColor = "bg-emerald-500";
                                        typeBg = "bg-emerald-500/10 border-emerald-500/20";
                                        typeText = "text-emerald-300";
                                        Icon = Info;
                                    } else if (note.type === "Meeting") {
                                        typeColor = "bg-blue-500";
                                        typeBg = "bg-blue-500/10 border-blue-500/20";
                                        typeText = "text-blue-300";
                                        Icon = Calendar;
                                    }

                                    return (
                                        <div key={note.id} className={`p-3 rounded-xl flex items-start gap-3 relative overflow-hidden border ${typeBg}`}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeColor}`} />
                                            <div className={`p-2 rounded-lg bg-black/40 ${typeText}`}>
                                                <Icon size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${typeText}`}>{note.type}</span>
                                                    <span className="text-[9px] text-neutral-500 whitespace-nowrap">{dateStr}</span>
                                                </div>
                                                <p className="text-sm text-neutral-200 leading-relaxed break-words">{note.content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
