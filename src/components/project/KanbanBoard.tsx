"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from 'react-dom';
import { ParsedScene } from "@/lib/script-parser";
import { DndContext, DragEndEvent, closestCorners, useSensor, useSensors, PointerSensor, TouchSensor, MouseSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle2, Circle, Clock, Plus, Settings, MoreHorizontal, Edit, Activity, Copy, Trash, Video } from "lucide-react";
import { analyzeScene } from "@/app/actions";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SceneDetailModal from "./SceneDetailModal";
import CustomFieldModal from "./CustomFieldModal";
import FloatingActionMenu from "../ui/floating-action-menu";
import { GlassyButton } from "../ui/button";

// --- Components ---

function SceneCard({ scene, id, projectId, progress, onEdit }: { scene: ParsedScene & { id?: string; status?: string }; id: string; projectId: string; progress: number, onEdit: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const [analysis, setAnalysis] = useState<any>(scene.analysis || null);
    const [loading, setLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = ((x - centerX) / centerX) * 6; // Subtle 3D tilt
        const rotateX = ((y - centerY) / centerY) * -6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'none'; // Snap to mouse
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (card) {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }
    };

    const handleUpdate = async (field: string, value: any) => {
        if (!scene.id) return;
        try {
            const docRef = doc(db, "projects", projectId, "scenes", scene.id);
            const updates: any = { [field]: value };

            // Auto move to scheduled if we are setting a date and we are currently unscheduled
            if (field === "shoot_date" && value && (!scene.status || scene.status === "unscheduled")) {
                updates.status = "scheduled";
            }

            await updateDoc(docRef, updates);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await analyzeScene(scene.body);
            setAnalysis(result);

            // Save to Firestore
            if (scene.id) {
                const docRef = doc(db, "projects", projectId, "scenes", scene.id);
                const updates: any = { analysis: result };

                // If AI provides a time of day, save it automatically so it displays!
                if (result.time_of_day) {
                    updates.time_of_day = result.time_of_day;
                }

                await updateDoc(docRef, updates);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleDuplicate = async () => {
        if (!scene.id) return;
        try {
            const newDocRef = doc(collection(db, "projects", projectId, "scenes"));
            await addDoc(collection(db, "projects", projectId, "scenes"), {
                ...scene,
                id: newDocRef.id,
                status: "unscheduled",
                scene_number: `${scene.scene_number} -copy`,
                createdAt: new Date()
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        if (!scene.id) return;
        if (confirm("Are you sure you want to delete this scene?")) {
            try {
                await deleteDoc(doc(db, "projects", projectId, "scenes", scene.id));
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="touch-pan-y mb-4 perspective-1000">
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={onEdit}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl group relative cursor-default hover:bg-white/10 transition-colors duration-300"
                style={{ transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            >
                {/* Glossy Reflection Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl overflow-hidden" />

                <div className="flex items-center gap-2 mb-3">
                    <button {...attributes} {...listeners} className="text-white/40 hover:text-white cursor-grab active:cursor-grabbing transition-colors">
                        <GripVertical size={16} />
                    </button>
                    <button onClick={() => handleUpdate("completed", !scene.completed)} className="text-white/40 hover:text-emerald-400 transition-colors">
                        {scene.completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                    </button>
                    <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded-full shadow-inner border border-white/5">#{scene.scene_number}</span>
                </div>
                <h4 className={"font-bold text-sm text-white line-clamp-2 leading-snug " + (scene.completed ? "line-through opacity-40" : "")}>{scene.slugline}</h4>
                {scene.analysis?.title && (
                    <p className="text-[11px] text-amber-300/90 font-bold mt-1.5 line-clamp-1 tracking-wide uppercase">"{scene.analysis.title}"</p>
                )}

                <div className="flex gap-2 mt-3 items-center flex-wrap">
                    {/* Inline Scheduling for Unscheduled Cards */}
                    {scene.status === "unscheduled" ? (
                        <input
                            type="date"
                            value={scene.shoot_date || ""}
                            onChange={(e) => handleUpdate("shoot_date", e.target.value)}
                            className="bg-white/10 text-white border border-white/20 px-2 py-1 rounded-md text-[11px] font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                            title="Schedule Shoot Date"
                        />
                    ) : scene.shoot_date ? (
                        <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-md text-[11px] font-bold shadow-inner backdrop-blur-md">
                            <Clock size={12} className="opacity-80" /> {scene.shoot_date}
                        </span>
                    ) : null}

                    {/* Complexity Badge */}
                    {analysis?.complexity && (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border shadow-inner ${analysis.complexity === "High" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            analysis.complexity === "Medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                "bg-green-500/20 text-green-400 border-green-500/30"
                            }`}>
                            {analysis.complexity}
                        </span>
                    )}
                </div>

                {/* Analysis Result Preview */}
                {analysis && (
                    <div className="mt-4 text-xs text-white/60 border-t border-white/10 pt-3 space-y-2">
                        <p className="line-clamp-2 italic leading-relaxed">"{analysis.summary}"</p>
                        <div className="flex justify-between items-center mt-2">
                            <div className="flex gap-2 flex-wrap">
                                {(scene.time_of_day || analysis?.time_of_day) && (
                                    <span className="bg-black/20 text-white/80 border border-white/5 px-2 py-1 rounded-md text-[10px] font-bold flex items-center justify-center shadow-inner min-w-[28px]">
                                        <span className="opacity-90 text-sm leading-none">
                                            {String(scene.time_of_day || analysis.time_of_day).trim()}
                                        </span>
                                    </span>
                                )}
                                <span className="bg-black/20 text-white/80 border border-white/5 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-inner">
                                    <span className="opacity-70">👥</span> {analysis?.cast?.length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mt-4 w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Progress</span>
                        <span className="text-[10px] font-bold text-white/50">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}% ` }}
                        />
                    </div>
                </div>

                <div
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onEdit} className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors" title="Edit Scene">
                        <span className="text-sm">✏️</span>
                    </button>
                    <button onClick={handleAnalyze} className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors" title="Analyze Scene">
                        <span className="text-sm">🤖</span>
                    </button>
                    <FloatingActionMenu
                        className="ml-1 z-[100]"
                        icon={<MoreHorizontal size={18} />}
                        options={[
                            { label: "Edit Scene", Icon: <Edit size={14} />, onClick: onEdit },
                            { label: "Analyze", Icon: <Activity size={14} />, onClick: handleAnalyze },
                            { label: "Duplicate", Icon: <Copy size={14} />, onClick: handleDuplicate },
                            { label: "Delete", Icon: <Trash size={14} className="text-red-400" />, onClick: handleDelete }
                        ]}
                    />
                </div>
            </div>

        </div >
    );
}

function Column({ id, title, scenes, projectId, progressValue, onEditScene }: { id: string; title: string, scenes: (ParsedScene & { id?: string })[], projectId: string, progressValue: number, onEditScene: (scene: any) => void }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div ref={setNodeRef} className="bg-black/20 backdrop-blur-3xl rounded-3xl p-5 flex flex-col min-h-[600px] border border-white/5 shadow-2xl relative overflow-hidden">
            {/* Glossy Column Highlight */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative z-10 px-1">
                <div className="flex items-center gap-3">
                    <div className={`w - 3 h - 3 rounded - full shadow - inner ${id === 'unscheduled' ? 'bg-slate-400' :
                        id === 'scheduled' ? 'bg-amber-400' :
                            id === 'shot' ? 'bg-emerald-400' : 'bg-violet-400'
                        } `} />
                    <h3 className="font-bold text-sm tracking-wide text-white capitalize">{title}</h3>
                    <span className="bg-white/10 text-white/80 text-xs font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-inner">
                        {scenes.length}
                    </span>
                </div>
                <button className="text-white/40 hover:text-white transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                        <circle cx="5" cy="12" r="1.5" />
                    </svg>
                </button>
            </div>

            <SortableContext items={scenes.map(s => s.id || s.scene_number)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-2">
                    {scenes.map((scene) => (
                        <SceneCard
                            key={scene.id || scene.scene_number}
                            id={scene.id || scene.scene_number!}
                            scene={scene}
                            projectId={projectId}
                            progress={progressValue}
                            onEdit={() => onEditScene(scene)}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

// --- Main Board ---

export default function KanbanBoard({ projectId }: { projectId: string }) {
    type SceneWithStatus = ParsedScene & { status: string; id?: string };
    const [items, setItems] = useState<SceneWithStatus[]>([]);
    const [editingScene, setEditingScene] = useState<SceneWithStatus | null>(null);
    const [sortBy, setSortBy] = useState<string>("scene_number");
    const [characterFilter, setCharacterFilter] = useState<string>("");

    // Dynamic Columns
    const [columns, setColumns] = useState<string[]>(["unscheduled", "scheduled", "shot", "edit"]);
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");

    // Modals
    const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
    const [showAddScene, setShowAddScene] = useState(false);

    // Prevent scrolling while dragging, but allow mobile scroll
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    useEffect(() => {
        if (!projectId) return;

        const q = query(
            collection(db, "projects", projectId, "scenes"),
            orderBy("scene_number")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedScenes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SceneWithStatus[];
            setItems(fetchedScenes);
        });

        return () => unsubscribe();
    }, [projectId]);
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find item by unique ID (Firestore Doc ID)
        const item = items.find(i => i.id === activeId);

        if (item && columns.includes(overId as string)) {
            if (item.id) {
                const docRef = doc(db, "projects", projectId, "scenes", item.id);
                await updateDoc(docRef, { status: overId });
            }
        }
    };

    // 1. Get all unique characters across all scenes for the filter dropdown
    const allCharacters = Array.from(new Set(items.flatMap(i => i.characters || i.analysis?.cast || []))).filter(Boolean).sort();

    const getScenesByStatus = (status: string) => {
        let cols = items.filter(i => (i.status || "unscheduled") === status);

        // Apply filters
        if (characterFilter) {
            cols = cols.filter(scene =>
                (scene.characters && scene.characters.includes(characterFilter)) ||
                (scene.analysis && scene.analysis.cast?.includes(characterFilter))
            );
        }

        // Apply sorts
        cols.sort((a, b) => {
            // ALWAYS put completed scenes at the bottom regardless of sort
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;

            if (sortBy === "scene_number") {
                return (parseInt(a.scene_number) || 0) - (parseInt(b.scene_number) || 0);
            }
            if (sortBy === "complexity") {
                const order: any = { "Low": 1, "Medium": 2, "High": 3 };
                const aVal = a.analysis?.complexity ? order[a.analysis.complexity] : 0;
                const bVal = b.analysis?.complexity ? order[b.analysis.complexity] : 0;
                return aVal - bVal;
            }
            if (sortBy === "cast_size") {
                const aSize = a.analysis?.cast?.length || a.characters?.length || 0;
                const bSize = b.analysis?.cast?.length || b.characters?.length || 0;
                return bSize - aSize; // Descending by cast size
            }
            if (sortBy === "shoot_date_asc") {
                if (!a.shoot_date) return 1;
                if (!b.shoot_date) return -1;
                return new Date(a.shoot_date).getTime() - new Date(b.shoot_date).getTime();
            }
            if (sortBy === "shoot_date_desc") {
                if (!a.shoot_date) return 1;
                if (!b.shoot_date) return -1;
                return new Date(b.shoot_date).getTime() - new Date(a.shoot_date).getTime();
            }
            return 0;
        });

        return cols;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex gap-4 mb-4 items-center bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                        Sort By:
                        <FloatingActionMenu
                            className="relative z-50 ml-1"
                            icon={
                                <div className="flex items-center justify-between gap-3 bg-black/40 hover:bg-black/60 px-4 py-2.5 rounded-xl border border-white/10 transition-colors pointer-cursor min-w-[160px]">
                                    <span className="text-xs font-bold text-white/90 truncate capitalize">{sortBy.replace(/_/g, ' ')}</span>
                                </div>
                            }
                            options={[
                                { label: "Scene Number", onClick: () => setSortBy("scene_number") },
                                { label: "Complexity", onClick: () => setSortBy("complexity") },
                                { label: "Cast Size (Desc)", onClick: () => setSortBy("cast_size") },
                                { label: "Shoot Date (Earliest)", onClick: () => setSortBy("shoot_date_asc") },
                                { label: "Shoot Date (Latest)", onClick: () => setSortBy("shoot_date_desc") }
                            ]}
                        />
                    </span>
                </div>

                <div className="flex items-center gap-4 border-l border-neutral-800 pl-4">
                    <span className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                        Filter By:
                        <FloatingActionMenu
                            className="relative z-50 ml-1"
                            icon={
                                <div className="flex items-center justify-between gap-3 bg-black/40 hover:bg-black/60 px-4 py-2.5 rounded-xl border border-white/10 transition-colors pointer-cursor min-w-[160px]">
                                    <span className="text-xs font-bold text-white/90 truncate">{characterFilter || "All Characters"}</span>
                                </div>
                            }
                            options={[
                                { label: "All Characters", onClick: () => setCharacterFilter("") },
                                ...allCharacters.map(char => ({
                                    label: char,
                                    onClick: () => setCharacterFilter(char)
                                }))
                            ]}
                        />
                    </span>
                </div>

                {/* Add Actions */}
                <div className="flex items-center gap-3 ml-auto shrink-0">
                    <GlassyButton
                        onClick={() => setShowCustomFieldModal(true)}
                        title="Add Field"
                        size="md"
                        icon={<Settings size={18} />}
                        gradientDark={{ from: "from-pink-600/40", via: "via-rose-500/20", to: "to-transparent" }}
                        gradientLight={{ from: "from-pink-500/30", via: "via-rose-400/20", to: "to-rose-600/40" }}
                        className="py-2.5 px-4 min-w-[130px] border-pink-500/20 hover:border-pink-400/50"
                    />
                    <GlassyButton
                        onClick={() => setShowAddColumn(true)}
                        title="Add Column"
                        size="md"
                        icon={<Plus size={18} />}
                        gradientDark={{ from: "from-violet-600/40", via: "via-fuchsia-500/20", to: "to-transparent" }}
                        gradientLight={{ from: "from-violet-500/30", via: "via-fuchsia-400/20", to: "to-fuchsia-600/40" }}
                        className="py-2.5 px-4 min-w-[140px] border-violet-500/20 hover:border-violet-400/50"
                    />
                    <GlassyButton
                        onClick={() => setShowAddScene(true)}
                        title="Add Scene"
                        size="md"
                        icon={<Video size={18} />}
                        gradientDark={{ from: "from-amber-600/40", via: "via-orange-500/20", to: "to-transparent" }}
                        gradientLight={{ from: "from-amber-500/40", via: "via-orange-400/30", to: "to-amber-500/50" }}
                        className="py-2.5 px-4 min-w-[130px] border-amber-500/20 hover:border-amber-400/50"
                    />
                </div>
            </div>

            {/* Add Column Input Form */}
            {showAddColumn && (
                <div className="mb-4 bg-black/20 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                    <input
                        type="text"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="Column Name (e.g. In Review)"
                        className="bg-black/30 border border-white/10 px-4 py-2 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newColumnName.trim()) {
                                setColumns([...columns, newColumnName.trim()]);
                                setNewColumnName("");
                                setShowAddColumn(false);
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            if (newColumnName.trim()) {
                                setColumns([...columns, newColumnName.trim()]);
                                setNewColumnName("");
                                setShowAddColumn(false);
                            }
                        }}
                        className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                    >
                        Save
                    </button>
                    <button onClick={() => setShowAddColumn(false)} className="text-white/50 hover:text-white px-2">Cancel</button>
                </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 flex-1 overflow-x-auto overflow-y-auto pb-8 h-full min-h-[60vh] max-h-[80vh] touch-pan-x snap-x scrollbar-hide">
                    {columns.map((col, index) => (
                        <div key={col} className="snap-center min-w-[320px] max-w-[320px]">
                            <Column
                                id={col}
                                title={col}
                                scenes={getScenesByStatus(col)}
                                projectId={projectId}
                                progressValue={((index + 1) / columns.length) * 100}
                                onEditScene={(s) => setEditingScene(s)}
                            />
                        </div>
                    ))}
                </div>
            </DndContext>

            {/* Modals */}
            {showCustomFieldModal && (
                <CustomFieldModal
                    projectId={projectId}
                    onClose={() => setShowCustomFieldModal(false)}
                />
            )}

            {showAddScene && (
                <SceneDetailModal
                    projectId={projectId}
                    scene={{
                        scene_number: (items.length + 1).toString(),
                        slugline: "",
                        body: "",
                        characters: [],
                        status: "unscheduled",
                        completed: false
                    } as SceneWithStatus}
                    onClose={() => setShowAddScene(false)}
                />
            )}

            {/* Edit Modal Rendered at Root */}
            {editingScene && typeof document !== 'undefined' && createPortal(
                <SceneDetailModal
                    projectId={projectId}
                    scene={editingScene}
                    analysis={editingScene.analysis}
                    onClose={() => setEditingScene(null)}
                />,
                document.body
            )}
        </div>
    );
}
