"use client";

import { useState, use, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Bot, Save, FileText, CheckCircle2, Wand2, LayoutPanelLeft, Sparkles, ArrowRight, Paperclip, Edit3, FileDown, Check, X, Lightbulb, PenTool, User } from "lucide-react";
import { chatWithDirectorAgent, editScriptWithAgent } from "@/app/actions";
import { GradientButton } from "@/components/ui/gradient-button";
import RichTextEditor, { RichTextEditorRef } from "@/components/editor/RichTextEditor";
import { AnimatedShareDropdown } from "@/components/ui/animated-share-dropdown";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { ExampleCard } from "@/components/ui/example-card";
import { AnimatedSwitch } from "@/components/ui/animated-switch";

export default function UnifiedEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [project, setProject] = useState<any>(null);
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");

    const editorRef = useRef<RichTextEditorRef>(null);

    // AI Chat State
    const [isAiMode, setIsAiMode] = useState(searchParams.get('mode') === 'ai');
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isDirectEditMode, setIsDirectEditMode] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const docRef = doc(db, "projects", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProject({ id: docSnap.id, ...docSnap.data() });
                    setContent(docSnap.data().content || "");
                    setEditNameValue(docSnap.data().title || docSnap.data().name || "Untitled");
                }
            } catch (e) {
                console.error("Failed to fetch project", e);
            }
        };
        fetchProject();

        // Check if there's an initial AI prompt we need to trigger
        const initialPrompt = sessionStorage.getItem(`ai_prompt_${id}`);
        if (initialPrompt && isAiMode) {
            handleSendMessage(initialPrompt);
            sessionStorage.removeItem(`ai_prompt_${id}`);
        }
    }, [id]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    // Handle Unsaved Changes Browser Exit
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleNavigationAttempt = (action: () => void) => {
        if (hasUnsavedChanges) {
            setPendingNavigation(() => action);
            setShowUnsavedModal(true);
        } else {
            action();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const docRef = doc(db, "projects", id);
            await updateDoc(docRef, {
                content: content,
                updatedAt: new Date()
            });
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error("Error saving content:", error);
            alert("Failed to save changes.");
        }
        setIsSaving(false);
    };

    const handleNameSave = async (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!editNameValue.trim() || editNameValue === project.title) {
            setIsEditingName(false);
            return;
        }
        try {
            await updateDoc(doc(db, "projects", id), {
                name: editNameValue.trim(),
                title: editNameValue.trim()
            });
            setProject((prev: any) => ({ ...prev, title: editNameValue.trim() }));
            setIsEditingName(false);
        } catch (err) {
            console.error("Failed to rename project", err);
            alert("Failed to save project name.");
        }
    };

    const handleAdvanceToProduction = async () => {
        try {
            await handleSave();
            const docRef = doc(db, "projects", id);
            await updateDoc(docRef, {
                progress: "production"
            });
            router.push(`/project/${id}/production`); // Production Board
        } catch (error) {
            console.error("Error advancing to production:", error);
            alert("Failed to advance project.");
        }
    };

    const handleSendMessage = async (msgOverride?: string) => {
        const textToSend = msgOverride || currentMessage;
        if (!textToSend.trim()) return;

        setCurrentMessage("");
        setIsThinking(true);

        if (isDirectEditMode) {
            // Direct Edit Flow
            setChatHistory(prev => [...prev, { role: "user", parts: [{ text: `[DIRECT EDIT COMMAND]: ${textToSend}` }] }]);
            try {
                const newHtml = await editScriptWithAgent(content, textToSend);
                if (newHtml && newHtml !== "I'm sorry, I couldn't process that. Please try again.") {
                    setContent(newHtml);
                    setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "✨ I have edited the document according to your instructions." }] }]);
                    // Manually trigger save to sync with Firestore
                    try {
                        await updateDoc(doc(db, "projects", id), { content: newHtml });
                    } catch (e) { }
                } else {
                    setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "❌ Sorry, I failed to process that edit. Please try rephrasing." }] }]);
                }
            } catch (error) {
                console.error("AI Edit Error:", error);
                setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "⚠️ An error occurred while trying to edit the document." }] }]);
            }
        } else {
            // Standard Chat Flow
            setChatHistory(prev => [...prev, { role: "user", parts: [{ text: textToSend }] }]);
            try {
                const botResponseText = await chatWithDirectorAgent(textToSend, chatHistory);
                setChatHistory(prev => [...prev, { role: "model", parts: [{ text: botResponseText }] }]);
            } catch (error) {
                console.error("AI Error:", error);
                setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "❌ Error connecting to Director AI. Please try again." }] }]);
            }
        }
        setIsThinking(false);
    };

    const appendToEditor = (text: string) => {
        // Find the strictly formatted script blocks if they exist, or append all
        // Rough heuristic: if it looks like a scene, just append the whole message.
        setContent(prev => prev + (prev ? "\n\n" : "") + text);
        handleSave();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const fileMsg = `[Attached File: ${file.name}]\n\n${text}`;
            setChatHistory(prev => [...prev, { role: "user", parts: [{ text: fileMsg }] }]);

            // Optionally have AI acknowledge it immediately
            setIsThinking(true);
            try {
                const botResponseText = await chatWithDirectorAgent(`I have attached the file: ${file.name}. Please read it and summarize or await my instructions.`, [...chatHistory, { role: "user", parts: [{ text: fileMsg }] }]);
                setChatHistory(prev => [...prev, { role: "model", parts: [{ text: botResponseText }] }]);
            } catch (error) {
                console.error("AI Error:", error);
            }
            setIsThinking(false);
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = '';
    };

    if (!project) {
        return <div className="min-h-screen bg-[#111] flex items-center justify-center text-white">Loading Editor...</div>;
    }

    return (
        <div className="h-screen flex flex-col bg-[#0F0F0F] text-neutral-200 overflow-hidden font-sans">

            {/* Top Navigation Strip */}
            <header className="flex items-center justify-between px-2 sm:px-6 py-2 sm:py-3 bg-[#161616] border-b border-white/5 shrink-0 z-10">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <button
                        onClick={() => handleNavigationAttempt(() => router.push(`/projects`))}
                        className="text-neutral-500 hover:text-white transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-white/5 shrink-0"
                        title="Back to Projects Repository"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <div className="hidden sm:flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                                Writing Phase
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-neutral-400">
                                {isSaving ? "Saving..." : hasUnsavedChanges ? (
                                    <span className="text-amber-500 font-bold">Unsaved changes</span>
                                ) : "Saved"}
                            </span>
                        </div>
                        {isEditingName ? (
                            <div className="flex items-center gap-2 mt-0.5">
                                <input
                                    type="text"
                                    value={editNameValue}
                                    onChange={(e) => setEditNameValue(e.target.value)}
                                    className="bg-black/50 border border-indigo-500/50 rounded flex-1 px-1.5 py-0.5 text-base sm:text-xl font-bold text-white focus:outline-none focus:border-indigo-400"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(e); }}
                                    onBlur={() => handleNameSave()}
                                />
                                <button onClick={handleNameSave} className="p-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/40">
                                    <Check size={14} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); setIsEditingName(false); setEditNameValue(project.title); }} className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <h1 onClick={() => setIsEditingName(true)} className="text-sm sm:text-xl font-bold text-white tracking-tight cursor-pointer hover:text-indigo-300 transition-colors truncate max-w-[120px] sm:max-w-none">
                                {project.title}
                            </h1>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                    {/* Mobile Mode Toggle — compact icon buttons */}
                    <div className="flex sm:hidden bg-[#0A0A0A] rounded-lg border border-white/10 p-0.5">
                        <button
                            onClick={() => setIsAiMode(false)}
                            className={`p-1.5 rounded-md transition-all ${!isAiMode ? 'bg-white/10 text-white' : 'text-neutral-500'}`}
                            title="Manual Script"
                        >
                            <FileText size={14} />
                        </button>
                        <button
                            onClick={() => setIsAiMode(true)}
                            className={`p-1.5 rounded-md transition-all ${isAiMode ? 'bg-white/10 text-white' : 'text-neutral-500'}`}
                            title="AI Writer"
                        >
                            <Wand2 size={14} />
                        </button>
                    </div>

                    {/* Desktop Mode Toggle */}
                    <div className="mr-2 sm:mr-4 hidden sm:block">
                        <AnimatedSwitch
                            options={[
                                { value: false, label: "Manual Script", icon: <FileText size={16} /> },
                                { value: true, label: "AI Writer", icon: <Wand2 size={16} /> }
                            ]}
                            activeValue={isAiMode}
                            onChange={(val) => setIsAiMode(val)}
                            className="bg-[#0A0A0A] border border-white/10 shadow-sm"
                            activeColorClass="text-white"
                            inactiveColorClass="text-neutral-500 hover:text-neutral-300"
                            indicatorClassName="bg-white/10"
                            layoutId="mainModeIndicator"
                        />
                    </div>

                    <AnimatedShareDropdown
                        onExportDocx={() => editorRef.current?.exportToWord()}
                        onExportPdf={() => editorRef.current?.exportToPdf()}
                        projectName={project.title}
                    />

                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors border ${hasUnsavedChanges ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent' : 'text-neutral-400 hover:text-white hover:bg-white/5 border-white/5'}`}
                    >
                        {isSaving ? <CheckCircle2 size={16} /> : <Save size={16} />}
                        <span className="font-bold text-xs sm:text-sm hidden sm:inline">Save</span>
                    </button>

                    <GradientButton onClick={handleAdvanceToProduction} className="hidden sm:flex">
                        <LayoutPanelLeft size={16} className="mr-2" />
                        Send to Production
                    </GradientButton>
                    <button onClick={handleAdvanceToProduction} className="sm:hidden p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white">
                        <LayoutPanelLeft size={16} />
                    </button>
                </div>
            </header>

            {/* Main Workspace Workspace */}
            <div className="flex flex-1 overflow-hidden relative w-full">

                {/* Left/Center Editor Area */}
                <div 
                    className={`flex-1 h-full transition-all duration-300 ease-in-out bg-[#0F0F0F] flex flex-col items-center py-6 sm:py-12 overflow-y-auto w-full origin-center`}
                    style={{ paddingRight: isAiMode ? (typeof window !== 'undefined' && window.innerWidth >= 640 ? '420px' : '0') : '0' }}
                >

                    {/* The Google Docs style paper */}
                    <div className="w-full max-w-[850px] bg-white text-black min-h-[600px] sm:min-h-[1056px] h-fit shrink-0 shadow-2xl p-6 sm:p-12 md:p-20 pb-40 outline-none rounded-sm mb-24 transition-all duration-300">

                        {/* Rich Text Editor */}
                        <RichTextEditor
                            ref={editorRef}
                            content={content}
                            onChange={(newContent) => {
                                setContent(newContent);
                                setHasUnsavedChanges(true); // Flag unsaved changes without auto-saving
                            }}
                            titleElement={
                                <input
                                    type="text"
                                    value={project.title}
                                    onChange={(e) => {
                                        setProject({ ...project, title: e.target.value });
                                        updateDoc(doc(db, "projects", id), { title: e.target.value });
                                    }}
                                    className="w-full text-4xl font-bold border-none outline-none bg-transparent mb-8 pb-4 border-b border-neutral-200 placeholder-neutral-300 font-serif focus:border-indigo-500 transition-colors"
                                    placeholder="Project Title"
                                />
                            }
                        />
                    </div>
                </div>

                {/* Right Sidebar: AI Director Chat */}
                <div
                    className={`absolute top-4 right-4 bottom-4 w-[400px] bg-gradient-to-b from-[#e8f6f8]/95 to-[#d6f0f5]/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ease-in-out flex flex-col z-30 border border-white/60 rounded-3xl overflow-hidden ${!isAiMode ? 'pointer-events-none opacity-0 translate-x-8' : 'pointer-events-auto opacity-100 translate-x-0'}`}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 shrink-0">
                        <button 
                            onClick={() => setIsAiMode(false)}
                            className="text-neutral-500 hover:text-neutral-800 transition-colors p-1 rounded-full hover:bg-black/5 mr-1"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-[#4fabc4] flex items-center justify-center shadow-md shadow-[#4fabc4]/20 border-2 border-white">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest leading-none mb-1">AI Co-Writer</p>
                            <h3 className="font-black text-neutral-800 text-base leading-none tracking-tight">Nolan Director</h3>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-hide">
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                {/* Centered Logo */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <h2 className="text-neutral-800 font-black text-2xl tracking-tight mb-2">I'm Nolan.</h2>
                                    <p className="text-sm font-medium text-neutral-500 max-w-[200px] leading-relaxed">Your AI Director. Tell me your idea, and I'll adapt to your genre.</p>
                                </div>

                                {/* Examples */}
                                <div className="w-full shrink-0 pt-8 pb-4">
                                    <p className="text-left text-sm font-bold text-neutral-800 mb-3">Examples</p>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                        <div className="snap-start min-w-[200px] flex-1">
                                            <ExampleCard
                                                onClick={() => handleSendMessage("Give me an idea for a thrilling opening scene in a sci-fi movie.")}
                                                icon={<Lightbulb />}
                                                title="Give me an idea"
                                                subtitle="for a thrilling opening scene"
                                                size="sm"
                                            />
                                        </div>
                                        <div className="snap-start min-w-[200px] flex-1">
                                            <ExampleCard
                                                onClick={() => { setIsDirectEditMode(true); handleSendMessage("Make the dialogue punchier and shorter in this scene."); }}
                                                icon={<PenTool />}
                                                title="Edit the Script"
                                                subtitle="Make dialogue punchier"
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex flex-col gap-1 w-full max-w-[90%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                                {/* Avatar/Label */}
                                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role !== 'user' && (
                                        <div className="w-5 h-5 rounded-full bg-[#4fabc4] flex items-center justify-center shadow-sm">
                                            <Bot size={10} className="text-white" />
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-neutral-500 tracking-wide">
                                        {msg.role === 'user' ? 'You' : 'Nolan'}
                                    </span>
                                    {msg.role === 'user' && (
                                        <div className="w-5 h-5 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center">
                                            <User size={10} className="text-neutral-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Bubble */}
                                <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm 
                                    ${msg.role === 'user' 
                                        ? 'bg-white text-neutral-800 rounded-tr-sm border border-neutral-100' 
                                        : 'bg-white text-neutral-800 border-[1.5px] border-[#4fabc4]/30 rounded-tl-sm'
                                    }`}
                                >
                                    {msg.parts[0].text}
                                </div>

                                {/* Action Button */}
                                {msg.role === 'model' && (
                                    <button
                                        onClick={() => appendToEditor(msg.parts[0].text)}
                                        className="text-[10px] font-bold uppercase tracking-wider text-[#4fabc4] hover:text-[#3b8a9e] flex items-center gap-1 mt-1 ml-1 transition-colors bg-[#4fabc4]/10 w-fit px-2 py-1 rounded-md"
                                    >
                                        <ArrowLeft size={12} /> Insert into Editor
                                    </button>
                                )}
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex flex-col gap-1 w-full max-w-[90%] mr-auto">
                                <div className="flex items-center gap-2 mb-1 justify-start">
                                    <div className="w-5 h-5 rounded-full bg-[#4fabc4] flex items-center justify-center shadow-sm">
                                        <Bot size={10} className="text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-neutral-500 tracking-wide">Nolan</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-white border-[1.5px] border-[#4fabc4]/30 rounded-tl-sm shadow-sm flex items-center">
                                    <TextShimmerWave className='font-sans text-[13px] font-bold tracking-tight text-[#4fabc4]' duration={1.5} spread={1.5}>
                                        {isDirectEditMode ? "Editing the script..." : "Analysing scene..."}
                                    </TextShimmerWave>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Floating Pill */}
                    <div className="p-4 shrink-0 bg-gradient-to-t from-[#d6f0f5] to-transparent pt-6">
                        {/* Mode Toggle (Floating above input) */}
                        <AnimatedSwitch
                            options={[
                                { value: false, label: "Chat", icon: <MessageSquare size={14} /> },
                                { value: true, label: "Edit Doc", icon: <Edit3 size={14} /> }
                            ]}
                            activeValue={isDirectEditMode}
                            onChange={(val) => setIsDirectEditMode(val)}
                            className="bg-white/50 backdrop-blur-md shadow-sm border border-white/50 mx-auto mb-3"
                            activeColorClass="text-[#4fabc4]"
                        />

                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="relative flex items-center gap-2 bg-white rounded-full p-1.5 shadow-lg border border-neutral-100 focus-within:ring-2 ring-[#4fabc4]/30 transition-all w-full"
                        >
                            <label className="shrink-0 w-10 h-10 rounded-full text-neutral-400 hover:text-[#4fabc4] hover:bg-black/5 flex items-center justify-center cursor-pointer transition-colors" title="Attach .txt script">
                                <Paperclip size={18} />
                                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                            </label>

                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                placeholder="help me narrate the ...."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-neutral-800 placeholder-neutral-400 px-2 h-10"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!currentMessage.trim() || isThinking}
                                className="shrink-0 w-10 h-10 rounded-full bg-[#4fabc4] hover:bg-[#4396ab] text-white flex items-center justify-center shadow-md disabled:opacity-50 transition-colors"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>

                </div>

            </div>

            {/* Custom Unsaved Changes Confirmation Modal */}
            {showUnsavedModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold text-amber-500 mb-2">Unsaved Changes</h3>
                        <p className="text-neutral-400 mb-6 leading-relaxed">
                            You have unsaved changes in your script. Are you sure you want to leave without saving? Your recent edits will be lost.
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={async () => {
                                    await handleSave();
                                    setShowUnsavedModal(false);
                                    if (pendingNavigation) pendingNavigation();
                                }}
                                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                            >
                                Save & Continue
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUnsavedModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowUnsavedModal(false);
                                        if (pendingNavigation) pendingNavigation();
                                    }}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    Leave anyway
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
