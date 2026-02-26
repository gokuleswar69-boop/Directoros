"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SwitchOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedSwitchProps<T> {
  options: SwitchOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  className?: string;
  activeColorClass?: string;
  inactiveColorClass?: string;
  indicatorClassName?: string;
  layoutId?: string;
}

export function AnimatedSwitch<T extends string | number | boolean>({
  options,
  activeValue,
  onChange,
  className,
  activeColorClass = "text-[#4fabc4]",
  inactiveColorClass = "text-neutral-500",
  indicatorClassName = "bg-white",
  layoutId = "activeTabIndicator",
}: AnimatedSwitchProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center p-1 rounded-full relative",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={String(option.value)}
            onClick={(e) => {
              e.preventDefault();
              onChange(option.value);
            }}
            className={cn(
              "relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-300",
              isActive ? activeColorClass : cn("hover:opacity-80", inactiveColorClass)
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className={cn("absolute inset-0 rounded-full shadow-sm", indicatorClassName)}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                style={{ zIndex: -1 }}
              />
            )}
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
