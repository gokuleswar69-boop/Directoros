"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ParsedScene } from "@/lib/script-parser";
import { Clock, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import SceneDetailModal from "./SceneDetailModal";
import { createPortal } from "react-dom";

export default function ScheduleBoard({ projectId }: { projectId: string }) {
    type SceneWithStatus = ParsedScene & { status: string; id?: string };
    const [scenes, setScenes] = useState<SceneWithStatus[]>([]);
    const [selectedScene, setSelectedScene] = useState<SceneWithStatus | null>(null);

    useEffect(() => {
        if (!projectId) return;

        const q = query(
            collection(db, "projects", projectId, "scenes"),
            orderBy("shoot_date")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedScenes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SceneWithStatus[];
            setScenes(fetchedScenes);
        });

        return () => unsubscribe();
    }, [projectId]);

    // Group scenes by date
    const scheduledScenes = scenes.filter(s => s.shoot_date && s.shoot_date.trim() !== "");
    const grouped = scheduledScenes.reduce((acc, scene) => {
        const date = scene.shoot_date!;
        if (!acc[date]) acc[date] = [];
        acc[date].push(scene);
        return acc;
    }, {} as Record<string, SceneWithStatus[]>);

    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (scenes.length === 0) {
        return <div className="p-8 text-neutral-500 text-center">Loading scenes...</div>;
    }

    if (sortedDates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-500">
                <CalendarIcon size={48} className="mb-4 opacity-50" />
                <p>No scenes have been scheduled yet.</p>
                <p className="text-sm">Assign a shoot date to a scene in the Board view to see it here.</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-8 max-w-4xl mx-auto py-8">
                {sortedDates.map((date) => {
                    const dayScenes = grouped[date];
                    // Sort by scene number within the day
                    dayScenes.sort((a, b) => parseInt(a.scene_number) - parseInt(b.scene_number));

                    return (
                        <div key={date} className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                            {/* Header for Day */}
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 flex items-center justify-center rounded-full border border-amber-500/30">
                                    <CalendarIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                    <p className="text-sm text-neutral-400">{dayScenes.length} Scenes Scheduled</p>
                                </div>
                            </div>

                            {/* Scene List for Day */}
                            <div className="space-y-3 relative z-10">
                                {dayScenes.map(scene => (
                                    <div key={scene.id}
                                        onClick={() => setSelectedScene(scene)}
                                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:border-white/20 ${scene.completed ? 'bg-emerald-500/10 border-emerald-500/20 opacity-70' : 'bg-white/5 border-white/10 hover:bg-white/10'} transition-all`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 flex justify-center">
                                                {scene.completed ? <CheckCircle2 size={20} className="text-emerald-500" /> : <span className="text-white/40 font-mono text-sm max-w-[32px] block break-words">#{scene.scene_number}</span>}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-white ${scene.completed ? 'line-through opacity-70' : ''}`}>{scene.slugline}</h4>
                                                {scene.analysis?.title && <p className="text-xs text-amber-300/80 mt-1">"{scene.analysis.title}"</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs bg-black/40 text-white/70 px-2 py-1 rounded border border-white/5">
                                                {scene.time_of_day || '---'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border shadow-inner ${scene.analysis?.complexity === "High" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                                                scene.analysis?.complexity === "Medium" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                                    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                                }`}>
                                                {scene.analysis?.complexity || 'Medium'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Portal */}
            {
                selectedScene && typeof document !== 'undefined' && createPortal(
                    <SceneDetailModal
                        projectId={projectId}
                        scene={selectedScene}
                        analysis={selectedScene.analysis}
                        onClose={() => setSelectedScene(null)}
                    />,
                    document.body
                )
            }
        </>
    );
}
