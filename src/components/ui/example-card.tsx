"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface ExampleCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactElement<any>;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  gradientLight?: { from: string; via: string; to: string };
  gradientDark?: { from: string; via: string; to: string };
}

// Customized for the Teal Light Theme (#4fabc4)
export const ExampleCard: React.FC<ExampleCardProps> = ({
  icon,
  title,
  subtitle,
  size = "md",
  gradientLight = { from: "from-[#4fabc4]/20", via: "via-[#4fabc4]/10", to: "to-[#4fabc4]/30" },
  gradientDark = { from: "from-[#4fabc4]/30", via: "via-black/50", to: "to-[#4fabc4]/10" },
  ...props
}) => {
  const sizes = {
    sm: "p-3 rounded-xl",
    md: "p-4 rounded-2xl",
    lg: "p-6 rounded-3xl",
  };

  return (
    <button
      {...props}
      className={`group relative overflow-hidden border-2 cursor-pointer transition-all duration-500 ease-out 
                  shadow-lg hover:shadow-[#4fabc4]/30 hover:scale-[1.02] hover:-translate-y-1 active:scale-95
                  ${sizes[size]} 
                  border-[#4fabc4]/20 bg-white
                  dark:${gradientDark.from} dark:${gradientDark.via} dark:${gradientDark.to} text-left`}
    >
      {/* Moving gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4fabc4]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out w-full"></div>

      {/* Overlay glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4fabc4]/10 via-transparent to-[#4fabc4]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Icon */}
        <div className="w-fit p-2 rounded-lg bg-gradient-to-br from-[#4fabc4]/80 to-[#4fabc4]/50 backdrop-blur-sm group-hover:from-[#4fabc4] group-hover:to-[#4fabc4]/80 transition-all duration-300 shadow-sm">
          {React.cloneElement(icon, {
            className:
              "w-5 h-5 text-white transition-all duration-300 group-hover:scale-110",
          })}
        </div>

        {/* Texts */}
        <div className="flex-1 mt-1">
          <p className="text-neutral-700 font-bold text-sm transition-colors duration-300 drop-shadow-sm leading-tight">
            {title}
          </p>
          {subtitle && (
            <p className="text-neutral-500 mt-1 text-xs transition-colors duration-300">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
