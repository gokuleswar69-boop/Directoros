"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function NewProjectModal({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !user) return;

        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, "projects"), {
                title: title,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            router.push(`/project/${docRef.id}`);
        } catch (error) {
            console.error("Error creating project:", error);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">New Project</h3>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Project Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. The Bulb"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-white text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-neutral-200 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
