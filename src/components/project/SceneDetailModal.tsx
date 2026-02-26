"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { doc, updateDoc, deleteDoc, collection, addDoc, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ParsedScene } from "@/lib/script-parser";
import { analyzeScene } from "@/app/actions";
import { CustomFieldDef } from "./CustomFieldModal";

interface SceneDetailModalProps {
    projectId: string;
    scene: ParsedScene & { id?: string; status?: string }; // Firestore data includes ID
    analysis?: any;
    onClose: () => void;
}

export default function SceneDetailModal({ projectId, scene, analysis, onClose }: SceneDetailModalProps) {
    const [slugline, setSlugline] = useState(scene.slugline);
    const [body, setBody] = useState(scene.body);
    const [timeOfDay, setTimeOfDay] = useState(scene.time_of_day || analysis?.time_of_day || "");
    const [shootDate, setShootDate] = useState(scene.shoot_date || "");
    const [completed, setCompleted] = useState(scene.completed || false);
    const [manualComplexity, setManualComplexity] = useState(analysis?.complexity || "Medium");
    const [saving, setSaving] = useState(false);

    // Custom Fields State
    const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, any>>((scene as any).custom_fields || {});

    // For new scenes, we optionally want to edit the scene number manually
    const [sceneNumber, setSceneNumber] = useState(scene.scene_number || "");

    useEffect(() => {
        const q = query(collection(db, "projects", projectId, "custom_fields"));
        const unsub = onSnapshot(q, (snap) => {
            setCustomFields(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomFieldDef)));
        });
        return () => unsub();
    }, [projectId]);

    const handleCustomChange = (fieldId: string, value: any) => {
        setCustomValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Re-analyze scene body to get fresh AI data
            const newAnalysis = await analyzeScene(body);

            // Allow manual override of complexity
            if (newAnalysis) {
                newAnalysis.complexity = manualComplexity;
            }

            const sceneData: any = {
                scene_number: sceneNumber,
                slugline,
                body,
                time_of_day: timeOfDay,
                shoot_date: shootDate,
                completed,
                status: scene.status || "unscheduled",
                analysis: newAnalysis || analysis,
                custom_fields: customValues,
                updatedAt: new Date()
            };

            if (scene.id) {
                // Update existing
                const docRef = doc(db, "projects", projectId, "scenes", scene.id);
                await updateDoc(docRef, sceneData);
            } else {
                // Create brand new scene manually
                sceneData.createdAt = new Date() as any;
                const collRef = collection(db, "projects", projectId, "scenes");
                await addDoc(collRef, sceneData);
            }

            onClose();
        } catch (error) {
            console.error("Failed to update scene", error);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!scene.id || !confirm("Are you sure you want to delete this scene?")) return;
        try {
            await deleteDoc(doc(db, "projects", projectId, "scenes", scene.id));
            onClose();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-2">
                            Scene
                            <input
                                value={sceneNumber}
                                onChange={e => setSceneNumber(e.target.value)}
                                className="bg-transparent border-b border-amber-500/30 w-12 focus:outline-none text-center"
                            />
                        </span>
                        <span className="ml-3 text-neutral-500 text-xs uppercase tracking-widest">{scene.status}</span>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {/* New Metadata Row */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Time of Day</label>
                                <select
                                    value={timeOfDay}
                                    onChange={(e) => setTimeOfDay(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 font-bold text-neutral-200 focus:border-amber-500 focus:outline-none placeholder-neutral-700"
                                >
                                    <option value="">Select Time...</option>
                                    <option value="☁️">☁️ Morning/Day</option>
                                    <option value="☀️">☀️ Afternoon</option>
                                    <option value="🌤️">🌤️ Evening</option>
                                    <option value="🌙">🌙 Night</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Shoot Date</label>
                                <input
                                    type="date"
                                    value={shootDate}
                                    onChange={(e) => setShootDate(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 font-bold text-neutral-200 focus:border-amber-500 focus:outline-none placeholder-neutral-700 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCompleted(!completed)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completed ? 'bg-green-500 border-green-500' : 'border-neutral-600 hover:border-amber-500'}`}
                            >
                                {completed && <span className="text-black text-xs font-bold text-center">&#10003;</span>}
                            </button>
                            <span className="text-sm font-bold text-neutral-300">Mark as Completed</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Scene Heading</label>
                            <input
                                value={slugline}
                                onChange={(e) => setSlugline(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-lg font-bold text-white focus:border-amber-500 focus:outline-none placeholder-neutral-700"
                                placeholder="INT. LOCATION - TIME"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Action & Dialogue</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full h-[300px] bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-neutral-300 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                            />
                        </div>

                        {/* Custom Fields Section */}
                        {customFields.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-800 pt-6 mt-6">
                                <h4 className="col-span-full text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    Custom Fields
                                </h4>
                                {customFields.map(field => {
                                    const value = customValues[field.id!] || "";
                                    const selectedColorClass = field.type === "single_select" ?
                                        field.options?.find(o => o.label === value)?.color || "bg-neutral-900 text-neutral-300" : "";

                                    return (
                                        <div key={field.id} className="space-y-2">
                                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">{field.name}</label>

                                            {field.type === "short_text" && (
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => handleCustomChange(field.id!, e.target.value)}
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder-neutral-700"
                                                />
                                            )}

                                            {field.type === "long_text" && (
                                                <textarea
                                                    value={value}
                                                    onChange={(e) => handleCustomChange(field.id!, e.target.value)}
                                                    className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:border-amber-500 focus:outline-none resize-none"
                                                />
                                            )}

                                            {field.type === "single_select" && (
                                                <select
                                                    value={value}
                                                    onChange={(e) => handleCustomChange(field.id!, e.target.value)}
                                                    className={`w-full border-none rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 ${selectedColorClass}`}
                                                >
                                                    <option value="" className="bg-neutral-900 text-neutral-500">Select...</option>
                                                    {field.options?.map(opt => (
                                                        <option key={opt.label} value={opt.label} className="bg-neutral-900 text-white">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {field.type === "multi_select" && (
                                                <select
                                                    multiple
                                                    value={customValues[field.id!] || []}
                                                    onChange={(e) => {
                                                        const selected = Array.from(e.target.selectedOptions, o => o.value);
                                                        handleCustomChange(field.id!, selected);
                                                    }}
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                                                >
                                                    {field.options?.map(opt => (
                                                        <option key={opt.label} value={opt.label} className="bg-neutral-900 text-white">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Analysis Column */}
                    <div className="bg-neutral-950 rounded-xl p-6 border border-neutral-800 overflow-y-auto">
                        <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4">Scene Analysis</h3>

                        {!analysis ? (
                            <div className="text-neutral-500 text-sm italic py-8 text-center border-2 border-dashed border-neutral-800 rounded-lg">
                                Run analysis from the board view.
                            </div>
                        ) : (
                            <div className="space-y-6 text-sm">
                                {/* Summary */}
                                {analysis.summary && (
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-white border-b border-neutral-800 pb-1">🎬 Summary</h4>
                                        <p className="text-neutral-300 italic">"{analysis.summary}"</p>
                                    </div>
                                )}

                                {/* Cast */}
                                {analysis.cast && (
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-white border-b border-neutral-800 pb-1">👥 Cast</h4>
                                        <ul className="list-disc list-inside text-neutral-300">
                                            {analysis.cast.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {/* Complexity (Editable) */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-white border-b border-neutral-800 pb-1">📊 Complexity</h4>
                                    <select
                                        value={manualComplexity}
                                        onChange={(e) => setManualComplexity(e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-bold border-none focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer ${manualComplexity === "High" ? "bg-red-500/20 text-red-500" :
                                            manualComplexity === "Medium" ? "bg-yellow-500/20 text-yellow-500" :
                                                "bg-green-500/20 text-green-500"
                                            }`}
                                    >
                                        <option value="Low" className="bg-neutral-900 text-green-500">Low</option>
                                        <option value="Medium" className="bg-neutral-900 text-yellow-500">Medium</option>
                                        <option value="High" className="bg-neutral-900 text-red-500">High</option>
                                    </select>
                                    <p className="text-[10px] text-neutral-600 italic mt-1">Change applies on save</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-800 flex justify-between items-center bg-neutral-900/50 rounded-b-xl">
                    <button
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={16} /> Delete Scene
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-amber-500 text-black px-6 py-2 rounded-md font-bold hover:bg-amber-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
