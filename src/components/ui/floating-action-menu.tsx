"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FloatingActionMenuProps = {
    options: {
        label: string;
        onClick: () => void;
        Icon?: React.ReactNode;
    }[];
    className?: string;
    icon?: React.ReactNode;
};

const FloatingActionMenu = ({
    options,
    className,
    icon,
}: FloatingActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={cn("relative z-50 flex items-center justify-center", className)}>
            <div
                onClick={toggleMenu}
                className="cursor-pointer bg-[#11111190] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)] flex items-center justify-center rounded-xl"
            >
                <div>
                    {icon || <Plus className="w-6 h-6 p-2" />}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                        transition={{
                            duration: 0.4,
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                        className="absolute top-full right-0 mt-3 whitespace-nowrap min-w-[200px]"
                    >
                        <div className="flex flex-col gap-1 bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
                            {options.map((option, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{
                                        duration: 0.2,
                                        delay: index * 0.03,
                                    }}
                                >
                                    <button
                                        onClick={() => { option.onClick(); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors rounded-xl text-left"
                                    >
                                        {option.Icon && <span className="text-white/70">{option.Icon}</span>}
                                        <span>{option.label}</span>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FloatingActionMenu;
