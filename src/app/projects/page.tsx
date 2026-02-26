"use client";

import { useAuth } from "@/context/AuthContext";
import { Plus, Layout, Trash2, Edit2, Check, X, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function ProjectCard({ project, onDeleteRequest }: { project: any, onDeleteRequest: (id: string, title: string) => void }) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(project.title || project.name || "");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleNameSave = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editNameValue.trim() || editNameValue === (project.title || project.name)) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateDoc(doc(db, "projects", project.id), {
        name: editNameValue.trim(),
        title: editNameValue.trim()
      });
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to rename project", err);
      alert("Failed to save project name.");
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1) { // 1MB limit
      alert("Image is too large. Please select an image under 1MB.");
      return;
    }

    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        await updateDoc(doc(db, "projects", project.id), { bannerUrl: dataUrl });
      } catch (err) {
        console.error("Failed to upload banner", err);
        alert("Image too large for database limits. Try a smaller image.");
      }
      setIsUploadingBanner(false);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleCardClick = () => {
    // Navigate based on progress
    router.push(project.progress === 'production' ? `/project/${project.id}/production` : `/project/${project.id}/editor`);
  };

  const handleDeleteProjectClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteRequest(project.id, project.title || project.name || "Untitled");
  };

  return (
    <div
      onClick={handleCardClick}
      className="block overflow-hidden rounded-2xl border border-white/5 bg-[#161616] hover:bg-[#1A1A1A] hover:border-white/10 hover:-translate-y-1 transition-all cursor-pointer group shadow-xl relative"
    >
      {/* Action Buttons (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <label
          onClick={(e) => e.stopPropagation()}
          className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg border border-white/10 hover:border-white/30 cursor-pointer backdrop-blur-md shadow-lg"
          title="Upload Banner"
        >
          <ImageIcon size={16} />
          <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} disabled={isUploadingBanner} />
        </label>

        <button
          onClick={(e) => { e.stopPropagation(); setEditNameValue(project.title || project.name); setIsEditingName(true); }}
          className="p-2 bg-black/60 hover:bg-white/20 text-white rounded-lg border border-white/10 hover:border-white/30 backdrop-blur-md shadow-lg"
          title="Rename Project"
        >
          <Edit2 size={16} />
        </button>

        <button
          onClick={handleDeleteProjectClick}
          className="p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-lg border border-white/10 hover:border-red-500/50 backdrop-blur-md shadow-lg"
          title="Delete Project"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Banner / Cover */}
      <div className="h-32 sm:h-44 border-b border-white/5 relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#111] to-[#0A0A0A]">
        {project.bannerUrl ? (
          <img src={project.bannerUrl} alt="Project Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <>
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
            <Layout className="w-16 h-16 text-neutral-800 group-hover:text-indigo-500/30 transition-colors group-hover:scale-110 duration-500" />
          </>
        )}

        {isUploadingBanner && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-sm font-bold animate-pulse">Uploading...</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-6">
        {isEditingName ? (
          <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              className="bg-black/50 border border-indigo-500/50 rounded-lg px-2 py-1 text-white text-lg font-bold w-full focus:outline-none focus:border-indigo-400"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(e); }}
            />
            <button onClick={handleNameSave} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/40">
              <Check size={16} />
            </button>
            <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/40">
              <X size={16} />
            </button>
          </div>
        ) : (
          <h3 className="text-xl font-bold text-white truncate mb-2 pr-6">{project.title || project.name}</h3>
        )}

        <p className="text-sm text-neutral-500 flex items-center justify-between">
          <span>Created {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : "Recently"}</span>
          <span className={`text-[10px] font-bold uppercase py-1 px-2 rounded-lg border ${project.progress === 'production' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'}`}>
            {project.progress === 'production' ? 'Production Phase' : 'Writing Phase'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "projects"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort by createdAt descending locally to avoid Firebase Composite Index requirement
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setProjects(fetched);
    });

    return () => unsubscribe();
  }, [user]);

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await deleteDoc(doc(db, "projects", projectToDelete.id));
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] w-full">
      <div className="space-y-6 md:space-y-8 p-4 sm:p-6 md:p-12 max-w-7xl mx-auto font-sans">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">Projects</h2>
            <p className="text-neutral-400 text-sm sm:text-base md:text-lg">Manage your active films and productions.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />
            New Project
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDeleteRequest={(id, title) => setProjectToDelete({ id, title })} />
          ))}

          {projects.length === 0 && (
            <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300 hover:bg-white/5 cursor-pointer transition-all min-h-[280px] w-full group">
              <Plus size={40} className="mb-4 text-neutral-600 group-hover:text-white transition-colors group-hover:scale-110" />
              <p className="font-bold text-lg text-white mb-1">Create your first project</p>
              <p className="text-sm text-center max-w-[200px]">Head to the Director Hub to create a new script.</p>
            </button>
          )}
        </div>

        {/* Custom Delete Confirmation Modal */}
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-bold text-white mb-2">Delete Project</h3>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                Are you sure you want to delete <span className="text-white font-bold">"{projectToDelete.title}"</span>? This action cannot be undone and will permanently remove your work.
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
