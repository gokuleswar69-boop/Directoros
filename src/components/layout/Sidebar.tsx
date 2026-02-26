"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LogOut, Home, Layout, Settings, Calendar, Plus } from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { motion } from "framer-motion";

export function GlobalSidebar() {
  const [open, setOpen] = useState(false);

  const links = [
    {
      label: "Projects",
      href: "/projects",
      icon: <Home className="text-neutral-400 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-indigo-400 transition-colors duration-200" />,
    },
    {
      label: "New Project",
      href: "/dashboard",
      icon: <Plus className="text-neutral-400 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-emerald-400 transition-colors duration-200" />,
    },
    {
      label: "Schedule",
      href: "/schedule",
      icon: <Calendar className="text-neutral-400 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-indigo-400 transition-colors duration-200" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="text-neutral-400 dark:text-neutral-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-indigo-400 transition-colors duration-200" />,
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}

          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => auth.signOut()}
            className="flex items-center justify-start gap-4 group/sidebar py-2.5 px-3 rounded-xl transition-all border border-transparent hover:border-red-500/30 hover:bg-gradient-to-br hover:from-red-500/20 hover:to-red-500/5 hover:shadow-[0_8px_32px_rgba(239,68,68,0.1)] hover:backdrop-blur-md w-full"
          >
            <div className="flex items-center justify-center min-w-[24px]">
              <LogOut className="text-neutral-700 dark:text-red-400 h-5 w-5 flex-shrink-0 group-hover/sidebar:text-red-500" />
            </div>
            <motion.span
              animate={{ display: open ? "inline-block" : "none", opacity: open ? 1 : 0 }}
              className="text-neutral-600 dark:text-red-400 font-medium text-[15px] group-hover/sidebar:translate-x-1 group-hover/sidebar:text-red-500 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
            >
              Sign Out
            </motion.span>
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <Link href="/projects" className="font-normal flex space-x-3 items-center text-sm py-1 relative z-20">
      <Image src="/logo.png" alt="Director's Cut Logo" width={32} height={32} className="rounded-lg object-contain w-8 h-8 shrink-0 bg-white shadow-sm" />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-lg text-black dark:text-white tracking-tight whitespace-pre font-mono">
        DIRECTOR'S CUT
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link href="/projects" className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20 mx-auto">
      <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-lg object-contain w-8 h-8 shrink-0 bg-white shadow-sm hover:scale-110 transition-transform" />
    </Link>
  );
};
