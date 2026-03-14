'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import {
    DashboardSquare01Icon,
    SparklesIcon,
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
    { href: '/ai-agent', label: 'AI Agent', icon: SparklesIcon },
    { href: '/playground', label: 'Playground', icon: PlayCircleIcon },
    { href: '/api-keys', label: 'API Keys', icon: Key01Icon },
    { href: '/logs', label: 'Request Logs', icon: File01Icon },
    { label: 'Settings', href: '/settings', icon: Settings01Icon },
    { label: 'Docs', href: 'https://headlessx.saify.me/docs/introduction', icon: BookOpen01Icon, external: true },
];

export function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle } = useSidebar();

    const { data: systemStats, isLoading: statsLoading } = useQuery({
        queryKey: ['sidebar-dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) {
                return { runningBrowsers: 0, maxConcurrency: 0 };
            }
            return res.json().catch(() => ({ runningBrowsers: 0, maxConcurrency: 0 }));
        },
        refetchInterval: 5000,
        refetchOnWindowFocus: false,
    });

    const systemLoad = systemStats?.maxConcurrency
        ? Math.min(100, Math.round(((systemStats.runningBrowsers || 0) / systemStats.maxConcurrency) * 100))
        : 0;

    return (
        <aside
            className={cn(
                "group border-r border-slate-200 bg-white flex flex-col h-full z-20 relative",
                collapsed ? "w-[80px]" : "w-[280px]"
            )}
        >
            {/* Header */}
            <div className={cn("border-b border-slate-200 bg-slate-50/80", collapsed ? "px-3 py-4" : "px-4 py-4")}>
                <div className={cn("flex gap-3", collapsed ? "flex-col items-center" : "items-center justify-between")}>
                    <div className={cn("flex items-center gap-3 min-w-0", collapsed && "flex-col")}>
                        <div className="relative shrink-0 w-10 h-10">
                            <Image
                                src="/logo.svg"
                                alt="HeadlessX"
                                width={40}
                                height={40}
                                className={cn(
                                    "rounded-xl relative z-10 transition-opacity duration-200",
                                    collapsed && "group-hover:opacity-0"
                                )}
                            />
                            {collapsed && (
                                <button
                                    onClick={toggle}
                                    aria-label="Expand sidebar"
                                    className="pointer-events-none absolute inset-0 z-20 rounded-xl border border-slate-200 bg-white/95 text-slate-500 opacity-0 transition-all duration-200 hover:text-slate-900 hover:border-slate-300 group-hover:pointer-events-auto group-hover:opacity-100"
                                >
                                    <span className="flex h-full w-full items-center justify-center">
                                        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                                    </span>
                                </button>
                            )}
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden whitespace-nowrap min-w-0">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                                    Headless<span className="text-blue-600">X</span>
                                </h1>
                                <span className="text-[11px] font-semibold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-full mt-1 inline-block">v2.0.4</span>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <button
                            onClick={toggle}
                            aria-label="Collapse sidebar"
                            className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:text-slate-900 hover:border-slate-300"
                        >
                            <span className="flex h-full w-full items-center justify-center">
                                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                            </span>
                        </button>
                    )}

                </div>
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
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent relative overflow-hidden",
                                isActive
                                    ? "bg-primary/8 text-primary border-primary/15"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                                collapsed && "justify-center px-0 w-12 h-12 mx-auto mb-2"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <HugeiconsIcon icon={item.icon} className={cn(
                                "w-5 h-5 shrink-0",
                                isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-700"
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

            </nav>

            {/* Footer */}
            <div className={cn("border-t border-slate-200 bg-slate-50", collapsed ? "p-3" : "p-4")}>
                <div className={cn(
                    "rounded-2xl border border-slate-200 bg-white overflow-hidden",
                    collapsed ? "p-2 aspect-square flex items-center justify-center bg-transparent border-0" : "p-4"
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
                                        className="h-full bg-emerald-500"
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
