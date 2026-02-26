"use client";

import {
    FiEdit,
    FiActivity,
    FiTrash,
    FiShare,
    FiPlusSquare,
    FiMoreHorizontal,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export const SceneDropdown = ({ onEdit, onAnalyze, onDuplicate, onDelete }: any) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative flex items-center justify-center z-50" ref={dropdownRef}>
            <motion.div animate={open ? "open" : "closed"} className="relative">
                <button
                    onClick={(e) => { e.stopPropagation(); setOpen((pv) => !pv); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                    <FiMoreHorizontal size={16} />
                </button>

                <motion.ul
                    initial={wrapperVariants.closed}
                    variants={wrapperVariants}
                    style={{ originY: "top", translateX: "-100%" }}
                    className="flex flex-col gap-1 p-2 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl absolute top-full right-0 w-44 overflow-hidden z-[100] mt-1"
                >
                    <Option setOpen={setOpen} action={onEdit} Icon={FiEdit} text="Edit Scene" />
                    <Option setOpen={setOpen} action={onAnalyze} Icon={FiActivity} text="Analyze" />
                    <Option setOpen={setOpen} action={onDuplicate} Icon={FiPlusSquare} text="Duplicate" />
                    <div className="h-px bg-white/10 my-1 mx-2" />
                    <Option setOpen={setOpen} action={onDelete} Icon={FiTrash} text="Delete" color="text-red-400 hover:text-red-300 hover:bg-red-500/20" />
                </motion.ul>
            </motion.div>
        </div>
    );
};

const Option = ({ text, Icon, setOpen, action, color }: any) => {
    return (
        <motion.li
            variants={itemVariants}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setOpen(false); if (action) action(); }}
            className={`flex items-center gap-3 w-full p-2 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors cursor-pointer ${color || 'hover:bg-indigo-500/20 text-neutral-300 hover:text-indigo-400'}`}
        >
            <motion.span variants={actionIconVariants}>
                <Icon size={14} />
            </motion.span>
            <span>{text}</span>
        </motion.li>
    );
};

export default SceneDropdown;

const wrapperVariants = {
    open: {
        scaleY: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.1,
        },
    },
    closed: {
        scaleY: 0,
        transition: {
            when: "afterChildren",
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    open: {
        opacity: 1,
        y: 0,
        transition: {
            when: "beforeChildren",
        },
    },
    closed: {
        opacity: 0,
        y: -15,
        transition: {
            when: "afterChildren",
        },
    },
};

const actionIconVariants = {
    open: { scale: 1, y: 0 },
    closed: { scale: 0, y: -7 },
};
