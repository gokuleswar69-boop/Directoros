"use client";

import { Home, Layout, Calendar, Settings, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
    { label: "Home", href: "/projects", icon: Home },
    { label: "New", href: "/dashboard", icon: Plus },
    { label: "Schedule", href: "/schedule", icon: Calendar },
    { label: "Settings", href: "/settings", icon: Settings },
];

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A0A] border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around px-2 h-16">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all ${isActive
                                ? "text-indigo-400"
                                : "text-neutral-500 active:text-white"
                                }`}
                        >
                            <div className="relative">
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                                {isActive && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
                                )}
                            </div>
                            <span
                                className={`text-[10px] font-bold ${isActive ? "text-indigo-400" : "text-neutral-500"
                                    }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
