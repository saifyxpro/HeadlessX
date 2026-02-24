'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Github, ExternalLink } from 'lucide-react';
import {
    DashboardSquare01Icon,
    UserGroupIcon,
    PlayCircleIcon,
    Key01Icon,
    File01Icon,
    Settings01Icon,
    BookOpen01Icon,
    ArrowLeft01Icon,
    ArrowRight01Icon,
    Activity01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/Skeleton";

const NAV_ITEMS = [
    { href: '/', label: 'Overview', icon: DashboardSquare01Icon },
    { href: '/profiles', label: 'Profiles', icon: UserGroupIcon },
    { href: '/playground', label: 'Playground', icon: PlayCircleIcon },
    { href: '/api-keys', label: 'API Keys', icon: Key01Icon },
    { href: '/logs', label: 'Request Logs', icon: File01Icon },
    { label: 'Settings', href: '/settings', icon: Settings01Icon },
    { label: 'Docs', href: 'https://headlessx.saify.me/docs', icon: BookOpen01Icon, external: true },
];

const DASHBOARD_API_KEY = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || 'dashboard-internal';

export function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle } = useSidebar();

    // Real system load from API
    const { data: systemStats, isLoading: statsLoading } = useQuery({
        queryKey: ['system-recommendations'],
        queryFn: async () => {
            const res = await fetch('/api/profiles/recommendations', {
                headers: { 'x-api-key': DASHBOARD_API_KEY }
            });
            if (!res.ok) return { usagePercent: 0 };
            return res.json().catch(() => ({ usagePercent: 0 }));
        },
        refetchInterval: 5000,
        refetchOnWindowFocus: false,
    });

    const systemLoad = systemStats?.usagePercent || 0;

    return (
        <aside
            className={cn(
                "border-r border-border/60 bg-card/95 backdrop-blur-md flex flex-col h-full z-20 transition-all duration-300 relative shadow-premium",
                collapsed ? "w-[80px]" : "w-[280px]"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={toggle}
                className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-white border border-border/80 shadow-md flex items-center justify-center text-muted-foreground hover:text-primary transition-all z-30 hover:scale-105"
            >
                {collapsed ? (
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                ) : (
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                )}
            </button>

            {/* Header */}
            <div className={cn("flex items-center gap-3 transition-all duration-300", collapsed ? "p-4 justify-center" : "p-6 pb-2")}>
                <div className="relative shrink-0 w-10 h-10 group cursor-pointer">
                    <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image
                        src="/logo.svg"
                        alt="HeadlessX"
                        width={40}
                        height={40}
                        className="rounded-xl shadow-sm relative z-10"
                    />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden whitespace-nowrap">
                        <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">
                            HeadlessX
                        </h1>
                        <span className="text-[11px] font-semibold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-full mt-1 inline-block">v2.0 Beta</span>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-1 py-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {!collapsed && <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-3 opacity-80">Platform</div>}
                {NAV_ITEMS.map((item: any) => {
                    const isActive = pathname === item.href;
                    const isExternal = item.external || item.href.startsWith('http');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            target={isExternal ? "_blank" : undefined}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                                collapsed && "justify-center px-0 w-12 h-12 mx-auto mb-2"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <HugeiconsIcon icon={item.icon} className={cn(
                                "w-5 h-5 transition-colors shrink-0",
                                isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                            )} size={20} />
                            {!collapsed && (
                                <div className="flex-1 flex items-center justify-between overflow-hidden">
                                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                                    {isExternal && <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />}
                                </div>
                            )}
                        </Link>
                    );
                })}

                {/* Visual Separator - Distinct from tabs */}
                <div className="my-2 px-3">
                    <div className="h-px bg-slate-200/60" />
                </div>

                {/* GitHub Link */}
                <Link
                    href="https://github.com/saifyxpro/headlessx"
                    target="_blank"
                    className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                        collapsed && "justify-center px-0 w-12 h-12 mx-auto"
                    )}
                    title={collapsed ? "Open Source" : undefined}
                >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <Github className="w-5 h-5 text-black/80 group-hover:text-black transition-colors" />
                    </div>
                    {!collapsed && (
                        <div className="flex items-center justify-between flex-1 overflow-hidden">
                            <span className="whitespace-nowrap overflow-hidden font-semibold text-slate-700 group-hover:text-slate-900">Open Source</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    )}
                </Link>
            </nav>

            {/* Footer */}
            <div className={cn("border-t border-border/50 bg-slate-50/50 backdrop-blur-sm transition-all duration-300", collapsed ? "p-3" : "p-4")}>
                <div className={cn(
                    "rounded-2xl border border-border/50 bg-white shadow-sm transition-all duration-300 overflow-hidden",
                    collapsed ? "p-2 aspect-square flex items-center justify-center bg-transparent border-0 shadow-none" : "p-4"
                )}>
                    {collapsed ? (
                        <div title={`System Load: ${systemLoad}%`} className="relative">
                            <svg className="w-8 h-8 transform -rotate-90">
                                <circle
                                    className="text-slate-100"
                                    strokeWidth="3"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="14"
                                    cx="16"
                                    cy="16"
                                />
                                <circle
                                    className="text-emerald-500"
                                    strokeWidth="3"
                                    strokeDasharray={88}
                                    strokeDashoffset={88 - (88 * systemLoad) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="14"
                                    cx="16"
                                    cy="16"
                                />
                            </svg>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                                        <HugeiconsIcon icon={Activity01Icon} size={14} className="text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">System Load</span>
                                </div>
                                {statsLoading ? (
                                    <Skeleton className="h-4 w-8" />
                                ) : (
                                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{systemLoad}%</span>
                                )}
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                {statsLoading ? (
                                    <Skeleton className="h-full w-full bg-slate-200" />
                                ) : (
                                    <div
                                        className="h-full transition-all bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                        style={{ width: `${systemLoad}%` }}
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                All systems operational
                            </div>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
