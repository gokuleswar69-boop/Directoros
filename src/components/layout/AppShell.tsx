"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { GlobalSidebar } from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Public routes: landing page and login — no auth required
    const isPublicRoute = pathname === "/" || pathname === "/login";

    useEffect(() => {
        if (!loading && !user && !isPublicRoute) {
            router.push("/login");
        }
    }, [user, loading, router, pathname, isPublicRoute]);

    if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading Director&apos;s Cut...</div>;

    // Render public pages without sidebar shell
    if (isPublicRoute) {
        return <main className="min-h-screen bg-black">{children}</main>;
    }

    // Protect all other routes
    if (!user) return null;

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden">
            {/* Sidebar - Animated Aceternity (desktop only) */}
            <GlobalSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:rounded-tl-2xl md:border-t md:border-l border-white/5 bg-[#0A0A0A] flex flex-col w-full h-full relative overflow-x-hidden pb-20 md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation — fixed bar at bottom, hidden on md+ */}
            <MobileNav />
        </div>
    );
}
