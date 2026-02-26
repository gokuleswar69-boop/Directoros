"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
    Share,
    Download,
    Mail,
    FileText,
    FileDown,
    ChevronLeft
} from "lucide-react";

interface ShareDropdownProps {
    onExportDocx: () => void;
    onExportPdf: () => void;
    projectName: string;
}

export const AnimatedShareDropdown = ({ onExportDocx, onExportPdf, projectName }: ShareDropdownProps) => {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<"main" | "download" | "gmail">("main");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
                setTimeout(() => setView("main"), 300); // Reset view after animation
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleGmailShare = (format: "docx" | "pdf") => {
        // Trigger the download first natively
        if (format === "docx") onExportDocx();
        else onExportPdf();

        // Redirect to Gmail compose window
        const subject = encodeURIComponent(`Script: ${projectName || 'Untitled'}`);
        const body = encodeURIComponent(`Hi there,\n\nPlease find the attached script "${projectName || 'Untitled'}" that I downloaded as a ${format.toUpperCase()}.\n\nBest,`);
        const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
        window.open(url, '_blank');
        setOpen(false);
        setTimeout(() => setView("main"), 300);
    };

    return (
        <div className="relative flex items-center justify-center z-50 mr-2" ref={dropdownRef}>
            <motion.div animate={open ? "open" : "closed"} className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (open) {
                            setOpen(false);
                            setTimeout(() => setView("main"), 300);
                        } else {
                            setOpen(true);
                        }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors border ${open ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5 border-transparent'}`}
                    title="Share & Export"
                >
                    <Share size={16} />
                    <span className="font-bold text-sm hidden sm:inline">Share</span>
                </button>

                <motion.div
                    initial={wrapperVariants.closed}
                    variants={wrapperVariants}
                    style={{ originY: "top", translateX: "-10%" }}
                    className="flex flex-col gap-1 p-2 rounded-xl bg-[#111] border border-white/10 shadow-2xl absolute top-full right-0 w-64 overflow-hidden z-[100] mt-2"
                >
                    {view === "main" && (
                        <motion.ul
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={listVariants}
                            className="flex flex-col gap-1 w-full"
                        >
                            <Option
                                setOpen={setOpen}
                                action={() => setView("download")}
                                Icon={Download}
                                text="Download"
                                preventClose
                            />
                            <Option
                                setOpen={setOpen}
                                action={() => setView("gmail")}
                                Icon={Mail}
                                text="Email via Gmail"
                                preventClose
                            />
                        </motion.ul>
                    )}

                    {view === "download" && (
                        <motion.ul
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={listVariants}
                            className="flex flex-col gap-1 w-full"
                        >
                            <li
                                onClick={(e) => { e.stopPropagation(); setView("main"); }}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/5 mb-1"
                            >
                                <ChevronLeft size={14} /> Back
                            </li>
                            <Option
                                setOpen={setOpen}
                                action={() => { onExportDocx(); setTimeout(() => setView("main"), 300); }}
                                Icon={FileText}
                                text="Download DOCX"
                                color="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            />
                            <Option
                                setOpen={setOpen}
                                action={() => { onExportPdf(); setTimeout(() => setView("main"), 300); }}
                                Icon={FileDown}
                                text="Download PDF"
                                color="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            />
                        </motion.ul>
                    )}

                    {view === "gmail" && (
                        <motion.ul
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={listVariants}
                            className="flex flex-col gap-1 w-full"
                        >
                            <li
                                onClick={(e) => { e.stopPropagation(); setView("main"); }}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/5 mb-1"
                            >
                                <ChevronLeft size={14} /> Back
                            </li>
                            <Option
                                setOpen={setOpen}
                                action={() => handleGmailShare("docx")}
                                Icon={FileText}
                                text="Send as DOCX"
                                color="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            />
                            <Option
                                setOpen={setOpen}
                                action={() => handleGmailShare("pdf")}
                                Icon={FileDown}
                                text="Send as PDF"
                                color="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            />
                            <p className="text-[10px] text-neutral-500 px-2 pt-2 leading-tight">
                                Note: This will download the file and open Gmail. You will need to manually drag-and-drop the downloaded file as an attachment.
                            </p>
                        </motion.ul>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

const Option = ({ text, Icon, setOpen, action, color, preventClose }: any) => {
    return (
        <motion.li
            variants={itemVariants}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                if (!preventClose) setOpen(false);
                if (action) action();
            }}
            className={`flex items-center gap-3 w-full p-2.5 text-sm font-semibold whitespace-nowrap rounded-lg transition-colors cursor-pointer ${color || 'hover:bg-white/10 text-neutral-200 hover:text-white'}`}
        >
            <motion.span variants={actionIconVariants}>
                <Icon size={16} />
            </motion.span>
            <span>{text}</span>
        </motion.li>
    );
};

const wrapperVariants: any = {
    open: {
        scaleY: 1,
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.05,
            duration: 0.2,
            ease: "easeInOut"
        },
    },
    closed: {
        scaleY: 0.8,
        opacity: 0,
        transition: {
            when: "afterChildren",
            staggerChildren: 0.05,
            duration: 0.15,
            ease: "easeInOut"
        },
    },
};

const listVariants: any = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants: any = {
    open: {
        opacity: 1,
        y: 0,
        transition: {
            when: "beforeChildren",
        },
    },
    closed: {
        opacity: 0,
        y: -10,
        transition: {
            when: "afterChildren",
        },
    },
};

const actionIconVariants: any = {
    open: { scale: 1, y: 0 },
    closed: { scale: 0.8, y: -2 },
};
