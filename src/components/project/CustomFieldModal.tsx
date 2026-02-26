"use client";

import { useState } from "react";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FieldType = "short_text" | "long_text" | "single_select" | "multi_select";

export interface CustomFieldOption {
    label: string;
    color: string;
}

export interface CustomFieldDef {
    id?: string;
    name: string;
    type: FieldType;
    options: CustomFieldOption[]; // Used only for select types
}

interface CustomFieldModalProps {
    projectId: string;
    existingField?: CustomFieldDef;
    onClose: () => void;
}

const COLOR_OPTIONS = [
    { name: "Gray", value: "bg-neutral-500/20 text-neutral-300" },
    { name: "Red", value: "bg-red-500/20 text-red-500" },
    { name: "Green", value: "bg-green-500/20 text-green-500" },
    { name: "Blue", value: "bg-blue-500/20 text-blue-500" },
    { name: "Yellow", value: "bg-yellow-500/20 text-yellow-500" },
    { name: "Purple", value: "bg-purple-500/20 text-purple-500" },
];

export default function CustomFieldModal({ projectId, existingField, onClose }: CustomFieldModalProps) {
    const [name, setName] = useState(existingField?.name || "");
    const [type, setType] = useState<FieldType>(existingField?.type || "short_text");
    const [options, setOptions] = useState<CustomFieldOption[]>(existingField?.options || []);

    // For adding a new option
    const [newOptionLabel, setNewOptionLabel] = useState("");
    const [newOptionColor, setNewOptionColor] = useState(COLOR_OPTIONS[0].value);

    const [saving, setSaving] = useState(false);

    const handleAddOption = () => {
        if (!newOptionLabel.trim()) return;
        setOptions([...options, { label: newOptionLabel.trim(), color: newOptionColor }]);
        setNewOptionLabel("");
    };

    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const fieldData = {
                name: name.trim(),
                type,
                options: (type === "single_select" || type === "multi_select") ? options : [],
            };

            if (existingField?.id) {
                // Update
                const docRef = doc(db, "projects", projectId, "custom_fields", existingField.id);
                await updateDoc(docRef, fieldData);
            } else {
                // Create
                const collRef = collection(db, "projects", projectId, "custom_fields");
                await addDoc(collRef, fieldData);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save field:", error);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!existingField?.id || !confirm("Delete this field? (This will not remove the data from existing scenes immediately, but will stop showing the field).")) return;
        try {
            await deleteDoc(doc(db, "projects", projectId, "custom_fields", existingField.id));
            onClose();
        } catch (error) {
            console.error("Failed to delete field:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-neutral-800">
                    <h3 className="font-bold text-white uppercase tracking-widest">{existingField ? "Edit Field" : "Create Custom Field"}</h3>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
                    {/* Field Name */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Field Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 font-bold text-neutral-200 focus:border-amber-500 focus:outline-none placeholder-neutral-700"
                            placeholder="e.g. Camera Gear, VFX Requirement..."
                        />
                    </div>

                    {/* Field Type */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Field Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as FieldType)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 font-bold text-neutral-200 focus:border-amber-500 focus:outline-none"
                        >
                            <option value="short_text">Short Text (Single Line)</option>
                            <option value="long_text">Long Text (Paragraph)</option>
                            <option value="single_select">Dropdown (Single Select)</option>
                            <option value="multi_select">Dropdown (Multi Select)</option>
                        </select>
                    </div>

                    {/* Options (for Select types only) */}
                    {(type === "single_select" || type === "multi_select") && (
                        <div className="border-t border-neutral-800 pt-4">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Dropdown Options</label>

                            <div className="space-y-2 mb-4">
                                {options.map((opt, i) => (
                                    <div key={i} className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${opt.color}`}>
                                            {opt.label}
                                        </span>
                                        <button onClick={() => handleRemoveOption(i)} className="text-red-500 hover:text-red-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {options.length === 0 && <p className="text-xs text-neutral-600 italic">No options added yet.</p>}
                            </div>

                            {/* Add Option Form */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newOptionLabel}
                                    onChange={(e) => setNewOptionLabel(e.target.value)}
                                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                                    placeholder="Option name..."
                                />
                                <select
                                    value={newOptionColor}
                                    onChange={(e) => setNewOptionColor(e.target.value)}
                                    className="w-24 bg-neutral-950 border border-neutral-800 rounded px-2 py-2 text-sm text-neutral-300 focus:outline-none"
                                >
                                    {COLOR_OPTIONS.map((c) => (
                                        <option key={c.value} value={c.value}>{c.name}</option>
                                    ))}
                                </select>
                                <button onClick={handleAddOption} className="bg-neutral-800 text-white px-3 py-2 rounded hover:bg-neutral-700">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-neutral-800 flex justify-between bg-neutral-900/50">
                    {existingField ? (
                        <button onClick={handleDelete} className="text-red-500 hover:text-red-400 text-sm font-medium px-3 py-2 rounded-md hover:bg-red-500/10 transition-colors">
                            Delete
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="bg-amber-500 text-black px-6 py-2 rounded-md font-bold hover:bg-amber-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : <><Save size={16} /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
