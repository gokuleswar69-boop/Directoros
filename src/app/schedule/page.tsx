"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Calendar as CalendarIcon, Clock, MapPin, Search, ChevronLeft, ChevronRight, X, ArrowRight, User, Film } from "lucide-react";
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import Image from "next/image";

interface ScheduledScene {
    id: string;
    projectId: string;
    projectTitle: string;
    sceneNumber: string;
    slugline: string;
    shootDate: Date;
    estimatedDuration?: number;
    colorHex?: string; // We will randomly assign one of the pastel colors
    characters?: string[];
    status?: string;
    completed?: boolean;
    projectProgress?: string;
}
const PASTEL_COLORS = [
    "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-rose-500", "bg-orange-500", "bg-yellow-500", "bg-teal-500", "bg-cyan-500"
];

export default function GlobalSchedulePage() {
    const { user } = useAuth();
    const [scheduledScenes, setScheduledScenes] = useState<ScheduledScene[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedScene, setSelectedScene] = useState<ScheduledScene | null>(null);
    const [showMobileCalendar, setShowMobileCalendar] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchAllSchedules = async () => {
            setIsLoading(true);
            try {
                const projectsQuery = query(collection(db, "projects"), where("ownerId", "==", user.uid));
                const projectSnapshots = await getDocs(projectsQuery);

                const projectsMap = new Map<string, { title: string, progress: string }>();
                projectSnapshots.forEach(doc => {
                    const data = doc.data();
                    projectsMap.set(doc.id, {
                        title: data.title || "Untitled Project",
                        progress: data.progress || "writing"
                    });
                });

                const allScenes: ScheduledScene[] = [];
                let colorIndex = 0;

                for (const projectId of projectsMap.keys()) {
                    const scenesQuery = query(collection(db, "projects", projectId, "scenes"), where("status", "==", "scheduled"));
                    const sceneSnapshots = await getDocs(scenesQuery);

                    sceneSnapshots.forEach(sceneDoc => {
                        const data = sceneDoc.data();
                        // In KanbanBoard, dates are saved as 'YYYY-MM-DD' strings in `shoot_date`
                        if (data.shoot_date || data.shootDate) {
                            const rawDate = data.shoot_date || data.shootDate;
                            // Parse the string properly; if it's already a timestamp logic is preserved
                            let shootDateObj = new Date();
                            if (rawDate instanceof Timestamp) {
                                shootDateObj = rawDate.toDate();
                            } else if (typeof rawDate === "string") {
                                // Add time if string to prevent UTC layout shifts
                                shootDateObj = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T08:00:00`);
                            } else {
                                shootDateObj = new Date(rawDate);
                            }

                            const pInfo = projectsMap.get(projectId)!;

                            allScenes.push({
                                id: sceneDoc.id,
                                projectId: projectId,
                                projectTitle: pInfo.title,
                                projectProgress: pInfo.progress,
                                sceneNumber: data.sceneNumber || data.scene_number || "?",
                                slugline: data.slugline || "Untitled Scene",
                                shootDate: shootDateObj,
                                estimatedDuration: data.estimatedDuration || 60, // Default to 60mins for visual layout
                                colorHex: PASTEL_COLORS[colorIndex % PASTEL_COLORS.length],
                                characters: data.characters || data.analysis?.cast || [],
                                status: data.status || "unscheduled",
                                completed: data.completed || false
                            });
                            colorIndex++;
                        }
                    });
                }

                allScenes.sort((a, b) => a.shootDate.getTime() - b.shootDate.getTime());
                setScheduledScenes(allScenes);

                // Auto-select first scene if available
                if (allScenes.length > 0) {
                    setSelectedScene(allScenes[0]);
                }

            } catch (error) {
                console.error("Error fetching schedule data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllSchedules();
    }, [user]);

    // Full Monthly Calendar Logic
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Determine Timeline elements for the center view
    // Full 24-hour cycle: 0 (12 AM) to 23 (11 PM)
    const timelineHours = Array.from({ length: 24 }).map((_, i) => i);

    const getPositionStylesForScene = (scene: ScheduledScene) => {
        // Layout math mapping 24 hours to pixel heights
        const startHour = scene.shootDate.getHours();
        const startMin = scene.shootDate.getMinutes();

        // Timeline starts at midnight (top = 0)
        // Each hour is 80px high
        const topOffset = (startHour * 80) + ((startMin / 60) * 80);
        const height = ((scene.estimatedDuration || 60) / 60) * 80;

        return { top: `${topOffset}px`, height: `${height}px` };
    };

    const filteredScenes = scheduledScenes.filter(scene =>
        (scene.slugline.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scene.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())) &&
        isSameDay(scene.shootDate, selectedDate)
    );

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[#0F0F0F] text-white font-sans overflow-hidden">

            {/* Mobile Top Bar — visible only on small screens */}
            <div className="lg:hidden shrink-0 z-30">
                <div className="flex items-center justify-between px-4 py-3 bg-[#161616] border-b border-white/5">
                    <button
                        onClick={() => setSelectedDate(addMonths(selectedDate, -1))}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <h2 className="text-base font-bold tracking-tight">{format(selectedDate, "MMMM yyyy")}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMobileCalendar(!showMobileCalendar)}
                            className={`p-2 rounded-xl transition-colors ${showMobileCalendar ? 'bg-indigo-600 text-white' : 'bg-white/10 text-neutral-400 hover:text-white'}`}
                            title="Month View"
                        >
                            <CalendarIcon size={16} />
                        </button>
                        <button
                            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Mobile Calendar Dropdown */}
                {showMobileCalendar && (
                    <div className="bg-[#161616] border-b border-white/5 px-4 py-4 animate-in slide-in-from-top">
                        <div className="bg-[#1C1C1C] rounded-2xl p-4 text-sm border border-white/5">
                            <div className="grid grid-cols-7 gap-y-3 text-center text-neutral-400 font-bold mb-3 text-xs">
                                {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
                                    <div key={day}>{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-y-2 text-center font-bold text-white text-xs">
                                {calendarDays.map((day, i) => {
                                    const isSelected = isSameDay(day, selectedDate);
                                    const hasEvent = scheduledScenes.some(s => isSameDay(s.shootDate, day));
                                    const isCurrentMonth = isSameMonth(day, selectedDate);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { setSelectedDate(day); setShowMobileCalendar(false); }}
                                            className={`relative flex items-center justify-center w-7 h-7 rounded-full mx-auto transition-all ${!isCurrentMonth ? 'text-neutral-600' : ''} ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' :
                                                hasEvent ? 'bg-white/10 border border-white/10' : 'hover:bg-white/10'
                                                }`}
                                        >
                                            {format(day, "d")}
                                            {hasEvent && !isSelected && (
                                                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#FFCE20] rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 1. Left Sidebar: Calendar & Filters */}
            <div className="hidden lg:flex flex-col w-[350px] bg-[#161616] border-r border-white/5 h-full overflow-y-auto p-6 shrink-0 custom-scrollbar z-10">

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">{format(selectedDate, "MMMM, yyyy")}</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedDate(addMonths(selectedDate, -1))}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-[#1C1C1C] rounded-3xl p-6 mb-8 text-sm border border-white/5">
                    <div className="grid grid-cols-7 gap-y-6 text-center text-neutral-400 font-bold mb-4">
                        {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
                            <div key={day}>{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-4 text-center font-bold text-white">
                        {calendarDays.map((day, i) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const hasEvent = scheduledScenes.some(s => isSameDay(s.shootDate, day));
                            const isCurrentMonth = isSameMonth(day, selectedDate);

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(day)}
                                    className={`relative flex items-center justify-center w-8 h-8 rounded-full mx-auto transition-all ${!isCurrentMonth ? 'text-neutral-600' : ''} ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' :
                                        hasEvent ? 'bg-white/10 shadow border border-white/10' : 'hover:bg-white/10'
                                        }`}
                                >
                                    {format(day, "d")}
                                    {hasEvent && !isSelected && (
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-[#FFCE20] rounded-full border-2 border-[#161616]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <h3 className="text-xl font-bold mb-4">Projects</h3>
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1C1C1C] border-2 border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white font-medium outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-500"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md border border-white/10 shrink-0">
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                            <span className="font-bold text-neutral-300 group-hover:text-indigo-400 transition-colors">All Projects</span>
                        </label>

                        {/* Dynamically generated projects view based on fetched scenes mapping */}
                        {Array.from(new Set(scheduledScenes.map(s => s.projectId))).map((pid, idx) => {
                            const sceneForProject = scheduledScenes.find(s => s.projectId === pid);
                            const bgColorClass = sceneForProject?.colorHex || PASTEL_COLORS[0];

                            // Convert tailwind bg color to a more specific marker
                            return (
                                <label key={pid} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full ${bgColorClass} flex items-center justify-center shadow-md border border-white/10 shrink-0`}>
                                        <div className="w-2 h-2 bg-[#161616] rounded-full" />
                                    </div>
                                    <span className="font-bold text-sm text-neutral-300 group-hover:text-white transition-colors truncate">
                                        {sceneForProject?.projectTitle}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. Center View: Hourly Timeline Array */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A] relative border-r border-white/5">

                {/* Top Date Header */}
                <div className="h-14 lg:h-20 bg-[#161616] border-b border-white/5 flex items-center justify-center px-4 lg:px-8 shrink-0 z-20 shadow-sm relative">
                    <div className="flex items-center gap-3 bg-indigo-600 text-white py-1.5 lg:py-2 px-4 lg:px-6 rounded-xl lg:rounded-2xl shadow-lg shadow-indigo-600/20 border border-indigo-500/50">
                        <CalendarIcon size={16} />
                        <span className="font-bold text-sm lg:text-base">{format(selectedDate, "MMM dd, yyyy")}</span>
                    </div>
                </div>

                {/* Timeline Scroll Area */}
                <div className="flex-1 overflow-y-auto px-6 py-8 relative custom-scrollbar">
                    <div className="relative h-[1920px] max-w-3xl mx-auto w-full">

                        {/* Hourly Lines */}
                        <div className="absolute inset-0 z-0">
                            {timelineHours.map((hour, i) => (
                                <div key={i} className="flex h-[80px] w-full border-b border-white/5">
                                    <div className="w-20 text-sm font-bold text-neutral-500 -mt-2">
                                        {hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'pm' : 'am'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Event Blocks Overlay */}
                        <div className="absolute inset-0 ml-20 z-10 w-[calc(100%-5rem)]">
                            {filteredScenes.map(scene => {
                                const style = getPositionStylesForScene(scene);
                                const isSelected = selectedScene?.id === scene.id;

                                return (
                                    <div
                                        key={scene.id}
                                        onClick={() => setSelectedScene(scene)}
                                        className={`absolute left-0 right-4 rounded-xl p-3 sm:p-4 text-white cursor-pointer transition-all ${scene.colorHex} hover:ring-2 hover:ring-white hover:shadow-xl hover:-translate-y-0.5
                                 ${isSelected ? 'ring-2 ring-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-[1.02] z-30' : 'shadow-md z-20 opacity-90'}
                               `}
                                        style={style}
                                    >
                                        <div className="flex flex-col h-full justify-between">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-sm sm:text-base leading-tight drop-shadow-sm line-clamp-2">
                                                    {scene.slugline}
                                                </h3>
                                                <span className="text-xs font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap hidden sm:block">
                                                    {format(scene.shootDate, "h:mm a")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-90 mt-2">
                                                <Film size={12} />
                                                <span className="text-xs font-bold truncate">{scene.projectTitle}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredScenes.length === 0 && (
                                <div className="flex flex-col items-center justify-center pt-40">
                                    <div className="w-24 h-24 bg-[#1C1C1C] border border-white/5 rounded-full flex items-center justify-center shadow-lg mb-6 text-neutral-500">
                                        <CalendarIcon size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-neutral-300 mb-2">No Shoots Today</h3>
                                    <p className="text-neutral-500 font-medium text-center max-w-sm">Enjoy your day off! Select another date on the calendar to see upcoming commitments.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* 3. Right Sidebar: Details Panel */}
            <div className="hidden xl:flex flex-col w-[380px] bg-[#161616] border-l border-white/5 h-full overflow-y-auto shrink-0 custom-scrollbar z-20">
                {selectedScene ? (
                    <div className="p-8 pb-20">
                        <div className="flex justify-between items-center mb-6">
                            <button className={`font-bold text-sm px-4 py-1.5 rounded-full flex items-center gap-2 border ${selectedScene.completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                selectedScene.status === 'shot' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${selectedScene.completed ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                    selectedScene.status === 'shot' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' :
                                        'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                    }`} />
                                <span className="capitalize">{selectedScene.completed ? 'Completed' : selectedScene.status || 'Scheduled'}</span>
                            </button>
                            <button onClick={() => setSelectedScene(null)} className="text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10 p-2">
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className="text-2xl font-black text-white leading-tight mb-2">
                            {selectedScene.slugline}
                        </h2>
                        <div className="flex items-center gap-2 text-indigo-400 font-bold mb-8">
                            <Film size={16} />
                            {selectedScene.projectTitle}
                            <span className="ml-2 text-[10px] tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                                {selectedScene.projectProgress || 'Writing'} Phase
                            </span>
                        </div>

                        {/* Timing Blocks */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center border-b border-white/5 py-4">
                                <Clock className="text-neutral-400 mr-4 shrink-0" size={24} />
                                <div className="flex-1 font-bold text-neutral-200">
                                    {format(selectedScene.shootDate, "h:mm a")} - {format(addDays(selectedScene.shootDate, Math.ceil((selectedScene.estimatedDuration || 60) / 60 / 24)), "h:mm a")}
                                </div>
                                <div className="text-neutral-500 font-medium text-sm">
                                    {selectedScene.estimatedDuration}m
                                </div>
                            </div>
                            <div className="flex items-center border-b border-white/5 py-4">
                                <CalendarIcon className="text-neutral-400 mr-4 shrink-0" size={24} />
                                <div className="font-bold text-neutral-200">
                                    {format(selectedScene.shootDate, "EEE, MMM dd, yyyy")}
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-white/5 border border-white/10 text-indigo-400 font-black py-4 rounded-2xl hover:bg-white/10 transition-colors mb-8 flex items-center justify-center gap-2 hover:text-indigo-300">
                            Reschedule Scene
                            <ArrowRight size={18} />
                        </button>

                        {/* Scene Progress */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-neutral-300 text-sm">Scene Check-off</h4>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                    {selectedScene.completed ? "100%" : selectedScene.status === "shot" ? "75%" : "25%"}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: selectedScene.completed ? "100%" : selectedScene.status === "shot" ? "75%" : "25%" }}
                                />
                            </div>
                        </div>

                        {/* Cast / Crew */}
                        <div className="mb-10">
                            <h3 className="text-lg font-bold text-neutral-400 mb-4">Characters</h3>
                            <div className="flex flex-col gap-3">
                                {selectedScene.characters && selectedScene.characters.length > 0 ? (
                                    selectedScene.characters.map((char: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-[#1C1C1C] border border-white/5 rounded-2xl shadow-sm hover:border-white/20 transition-colors cursor-pointer group">
                                            <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-[#161616] group-hover:border-indigo-500 transition-colors shrink-0">
                                                <User className="text-neutral-500 group-hover:text-indigo-400 transition-colors" size={18} />
                                            </div>
                                            <h4 className="font-bold text-neutral-200 capitalize truncate">{char}</h4>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-neutral-500 italic p-4 bg-black/20 rounded-xl border border-white/5 text-center">No characters detected for this scene.</p>
                                )}
                            </div>
                        </div>

                        {/* Participate List */}
                        <div className="mb-10">
                            <h3 className="text-lg font-bold text-neutral-400 mb-4">Participate</h3>
                            <div className="flex items-center justify-between bg-[#1C1C1C] border border-white/5 rounded-full p-2 pl-4 pr-6">
                                <div className="flex -space-x-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full border-2 border-[#1C1C1C] flex items-center justify-center text-white text-xs font-bold">M</div>
                                    <div className="w-10 h-10 bg-rose-600 rounded-full border-2 border-[#1C1C1C] flex items-center justify-center text-white text-xs font-bold">S</div>
                                    <div className="w-10 h-10 bg-emerald-600 rounded-full border-2 border-[#1C1C1C] flex items-center justify-center text-white text-xs font-bold">L</div>
                                </div>
                                <button className="text-indigo-400 font-bold text-sm flex items-center gap-1 hover:text-indigo-300 hover:underline">
                                    See All <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Extra Metadata */}
                        <div className="space-y-6 flex flex-col pt-6 border-t border-white/5">
                            <div>
                                <h5 className="text-sm font-bold text-neutral-400 mb-1">Scene Number</h5>
                                <p className="font-black text-neutral-200 text-lg">{selectedScene.sceneNumber}</p>
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-neutral-400 mb-1">Assigned Studio</h5>
                                <p className="font-black text-neutral-200 flex items-center justify-between">
                                    Director's Cut Studios
                                    <MapPin size={16} className="text-neutral-500" />
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-10">
                        <div className="w-24 h-24 bg-[#1C1C1C] border border-white/5 rounded-full flex items-center justify-center mb-6">
                            <MousePointerClick className="text-neutral-600 opacity-50 absolute -rotate-12" size={40} />
                            <CalendarIcon className="text-indigo-500" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-300 mb-3">Scene Details</h2>
                        <p className="text-neutral-500 font-medium leading-relaxed">Select any colorful scene card on the timeline to instantly view shoot specifics, cast calls, and locations here.</p>
                    </div>
                )}
            </div>

            {/* Mobile Scene Details Overlay - visible on screens < xl when a scene is selected */}
            {selectedScene && (
                <div className="xl:hidden fixed inset-0 z-50 flex items-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedScene(null)} />
                    {/* Sheet */}
                    <div className="relative w-full max-h-[80vh] bg-[#161616] border-t border-white/10 rounded-t-3xl overflow-y-auto p-6 pb-10">
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                        <div className="flex justify-between items-center mb-4">
                            <button className={`font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border ${selectedScene.completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                selectedScene.status === 'shot' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedScene.completed ? 'bg-emerald-500' : selectedScene.status === 'shot' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                                <span className="capitalize">{selectedScene.completed ? 'Completed' : selectedScene.status || 'Scheduled'}</span>
                            </button>
                            <button onClick={() => setSelectedScene(null)} className="text-neutral-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight mb-2">{selectedScene.slugline}</h2>
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-6">
                            <Film size={14} />
                            {selectedScene.projectTitle}
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 py-3 border-b border-white/5">
                                <Clock className="text-neutral-400 shrink-0" size={18} />
                                <span className="font-bold text-neutral-200 text-sm">{format(selectedScene.shootDate, "h:mm a")}</span>
                                <span className="text-neutral-500 text-xs ml-auto">{selectedScene.estimatedDuration}m</span>
                            </div>
                            <div className="flex items-center gap-3 py-3 border-b border-white/5">
                                <CalendarIcon className="text-neutral-400 shrink-0" size={18} />
                                <span className="font-bold text-neutral-200 text-sm">{format(selectedScene.shootDate, "EEE, MMM dd, yyyy")}</span>
                            </div>
                        </div>
                        {selectedScene.characters && selectedScene.characters.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-neutral-400 mb-3">Characters</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedScene.characters.map((char: string, idx: number) => (
                                        <span key={idx} className="text-xs font-bold bg-[#1C1C1C] border border-white/5 text-neutral-300 px-3 py-1.5 rounded-lg capitalize">{char}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

// Quick placeholder icon for empty states
import { MousePointerClick } from "lucide-react";
