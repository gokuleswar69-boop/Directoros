"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, doc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FileText, LayoutPanelLeft, ArrowRight, Sparkles, Clock, FileType2 } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { useAuth } from "@/context/AuthContext";

export default function GlobalHomeHubPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "projects"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by createdAt descending locally to avoid Firebase Composite Index requirement
      fetched.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setProjects(fetched);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateProject = async (method: "ai" | "manual" | "production", initialTitle: string = "Unnamed") => {
    if (!user) return alert("You must be logged in.");
    setIsCreating(true);
    try {

      let finalTitle = initialTitle;
      if (initialTitle === "Unnamed") {
        // Find how many "Unnamed" projects already exist
        const unnamedProjects = projects.filter(p => p.title && p.title.startsWith("Unnamed"));
        if (unnamedProjects.length > 0) {
          finalTitle = `Unnamed ${unnamedProjects.length + 1}`;
        }
      }

      // 1. Create the project
      const newDoc = await addDoc(collection(db, "projects"), {
        title: finalTitle,
        content: "",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        progress: method === "production" ? "production" : "writing",
        creationMethod: method
      });

      // If production, go straight to production board
      if (method === "production") {
        router.push(`/project/${newDoc.id}/production`);
        return;
      }

      // 2. Navigate
      let url = `/project/${newDoc.id}/editor`;
      if (method === "ai" && aiPrompt) {
        sessionStorage.setItem(`ai_prompt_${newDoc.id}`, aiPrompt);
        url += `?mode=ai`;
      } else if (method === "manual") {
        url += `?mode=manual`;
      }

      router.push(url);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project.");
      setIsCreating(false);
    }
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    handleCreateProject("ai", "Unnamed");
  };

  return (
    <div className="relative flex w-full min-h-0 flex-col items-center overflow-x-hidden bg-black font-sans">
      <WebGLShader />
      <div className="relative border border-[#27272a] p-4 sm:p-6 md:p-10 w-full mx-auto max-w-[1400px] rounded-2xl md:rounded-[2rem] bg-black/40 backdrop-blur-2xl shadow-2xl my-4 md:my-8">

        <header className="mb-6 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-1">
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">Hello, Director.</span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base md:text-xl">What are you creating today?</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">

          {/* Left Column: Actions */}
          <div className="flex-1 space-y-6 md:space-y-12 max-w-3xl">

            {/* AI Prompt Box */}
            <section>
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Draft a script with AI</h2>
              <form onSubmit={handleAiSubmit} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl transition-all focus-within:border-white/20">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="A thriller scene where two spies meet at a coffee shop..."
                    className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none resize-none min-h-[70px] md:min-h-[100px] text-sm sm:text-base md:text-lg leading-relaxed"
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
                        Generate Project
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Or start from scratch</h2>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                <GradientButton onClick={() => handleCreateProject("manual")} disabled={isCreating} className="flex-1 justify-center whitespace-nowrap">
                  <FileText size={18} className="mr-2 opacity-70" />
                  Blank Script
                </GradientButton>

                <button
                  onClick={() => handleCreateProject("production")}
                  disabled={isCreating}
                  className="flex-1 flex justify-center items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-white/10 text-white rounded-[11px] px-4 sm:px-9 py-3 sm:py-4 font-bold text-sm sm:text-base transition-colors whitespace-nowrap group"
                >
                  <LayoutPanelLeft size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  Start Production
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Projects List */}
          <div className="w-full lg:w-[400px] xl:w-[450px]">
            <div className="flex items-center gap-8 border-b border-white/10 pb-4 mb-6">
              <button className="text-sm font-bold text-white border-b-2 border-white pb-4 -mb-[18px]">Recent Projects</button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                  <FileType2 size={32} className="mx-auto mb-3 opacity-20" />
                  <p>No projects yet.</p>
                  <p className="text-sm mt-1">Create one to get started.</p>
                </div>
              ) : (
                projects.slice(0, 10).map(project => (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (project.progress === "production") {
                        router.push(`/project/${project.id}/production`);
                      } else {
                        router.push(`/project/${project.id}`);
                      }
                    }}
                    className="group bg-[#1A1A1A] hover:bg-[#222222] border border-white/5 hover:border-white/10 p-3 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all flex items-start gap-3 sm:gap-4"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/50 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                      <FileText size={16} className="sm:hidden" />
                      <FileText size={20} className="hidden sm:block" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-200 truncate group-hover:text-amber-400 transition-colors">{project.title || project.name || "Untitled Project"}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${project.progress === 'production' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                          }`}>
                          {project.progress === 'production' ? 'Production Phase' : 'Writing Phase'}
                        </span>

                        <span className="text-[10px] text-neutral-500 flex items-center gap-1 w-full mt-1">
                          <Clock size={10} />
                          {project.createdAt?.toDate ? new Date(project.createdAt.toDate()).toLocaleDateString() : 'Just now'}
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
