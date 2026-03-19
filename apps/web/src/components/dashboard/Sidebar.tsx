'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    DashboardSquare01Icon,
    SparklesIcon,
    PlayCircleIcon,
    Key01Icon,
    File01Icon,
    Settings01Icon,
    BookOpen01Icon,
    LinkSquare01Icon,
    SidebarLeft01Icon,
    SidebarRight01Icon,
    Activity01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/Skeleton";

type NavItem = {
    href: string;
    label: string;
    icon: any;
    external?: boolean;
};

const NAV_SECTIONS: Array<{
    id: string;
    label: string;
    items: NavItem[];
}> = [
    {
        id: 'workspace',
        label: 'Workspace',
        items: [
            { href: '/', label: 'Overview', icon: DashboardSquare01Icon },
            { href: '/agent', label: 'Agent', icon: SparklesIcon },
            { href: '/playground', label: 'Playground', icon: PlayCircleIcon },
        ],
    },
    {
        id: 'control',
        label: 'Control',
        items: [
            { href: '/api-keys', label: 'API Keys', icon: Key01Icon },
            { href: '/logs', label: 'Request Logs', icon: File01Icon },
            { href: '/settings', label: 'Settings', icon: Settings01Icon },
        ],
    },
    {
        id: 'resources',
        label: 'Resources',
        items: [
            { href: 'https://headlessx.saify.me/docs/', label: 'Docs', icon: BookOpen01Icon, external: true },
            { href: 'https://headlessx.saify.me/docs/changelog/', label: 'Changelog', icon: File01Icon, external: true },
        ],
    },
];

function isActivePath(pathname: string, href: string, external?: boolean) {
    if (external) {
        return false;
    }

    if (href === '/') {
        return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNavItem({
    item,
    collapsed,
    pathname,
}: {
    item: NavItem;
    collapsed: boolean;
    pathname: string;
}) {
    const active = isActivePath(pathname, item.href, item.external);
    const isExternal = item.external || item.href.startsWith('http');

    return (
        <Link
            href={item.href}
            target={isExternal ? "_blank" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
                "group/nav-item relative flex items-center gap-3 overflow-hidden transition-all duration-300 ease-out",
                collapsed
                    ? "mx-auto h-13 w-13 justify-center rounded-[1.4rem] px-0 py-0"
                    : "w-full rounded-[1.4rem] px-3 py-3",
                active
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600 hover:bg-white"
            )}
        >
            <div
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-[1rem] border transition-all duration-300 ease-out",
                    collapsed ? "h-11 w-11" : "h-10 w-10",
                    active
                        ? "border-blue-100 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-white text-slate-500 group-hover/nav-item:bg-white"
                )}
            >
                <HugeiconsIcon icon={item.icon} size={20} />
            </div>

            {!collapsed && (
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <span className={cn("truncate text-sm font-semibold", active ? "text-slate-950" : "text-slate-800")}>
                            {item.label}
                        </span>
                        {isExternal && (
                            <HugeiconsIcon
                                icon={LinkSquare01Icon}
                                className={cn("h-3.5 w-3.5 shrink-0", active ? "text-slate-500" : "text-slate-400")}
                            />
                        )}
                    </div>
                </div>
            )}
        </Link>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle } = useSidebar();
    const navRef = useRef<HTMLElement | null>(null);
    const [navScrollState, setNavScrollState] = useState({
        canScrollUp: false,
        canScrollDown: false,
    });

    useEffect(() => {
        const element = navRef.current;
        if (!element) {
            return;
        }

        const updateScrollState = () => {
            const maxScrollTop = element.scrollHeight - element.clientHeight;
            setNavScrollState({
                canScrollUp: element.scrollTop > 6,
                canScrollDown: maxScrollTop - element.scrollTop > 6,
            });
        };

        updateScrollState();

        element.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);

        return () => {
            element.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [collapsed]);

    const { data: systemStats, isLoading: statsLoading } = useQuery({
        queryKey: ['sidebar-dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) {
                return { systemLoad: 0 };
            }
            return res.json().catch(() => ({ systemLoad: 0 }));
        },
        refetchInterval: 5000,
        refetchOnWindowFocus: false,
    });

    const systemLoad = Math.max(0, Math.min(100, Number(systemStats?.systemLoad) || 0));

    return (
        <aside
            className={cn(
                "group relative z-20 flex h-full flex-col bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] rounded-r-[2rem] border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-500 ease-in-out",
                collapsed ? "w-[88px]" : "w-[304px]"
            )}
        >
            <div className={cn(collapsed ? "px-3 py-4" : "px-4 py-4")}>
                <div className={cn(
                    "rounded-[1.75rem] border border-slate-200 bg-white",
                    collapsed ? "px-2.5 py-3" : "px-4 py-4"
                )}>
                    <div className={cn("flex gap-3", collapsed ? "flex-col items-center" : "items-start justify-between")}>
                        <div className={cn("flex min-w-0 items-center gap-3", collapsed && "flex-col")}>
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-slate-200 bg-white">
                                <Image
                                    src="/logo.svg"
                                    alt="HeadlessX"
                                    width={44}
                                    height={44}
                                    className={cn(
                                        "relative z-10 rounded-[0.9rem] transition-opacity duration-500 ease-in-out",
                                        collapsed && "group-hover:opacity-0"
                                    )}
                                />
                                {collapsed && (
                                    <button
                                        onClick={toggle}
                                        aria-label="Expand sidebar"
                                        className="pointer-events-none absolute inset-0 z-20 rounded-[1rem] border border-slate-200/50 bg-white/90 text-slate-500 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out hover:border-slate-300 hover:bg-white hover:text-slate-900 group-hover:pointer-events-auto group-hover:opacity-100"
                                    >
                                        <span className="flex h-full w-full items-center justify-center">
                                            <HugeiconsIcon icon={SidebarRight01Icon} size={20} />
                                        </span>
                                    </button>
                                )}
                            </div>

                            {!collapsed && (
                                <div className="min-w-0 flex-1 pt-0.5">
                                    <h1 className="text-[1.45rem] font-bold leading-none tracking-[-0.03em] text-slate-950">
                                        Headless<span className="text-blue-600">X</span>
                                    </h1>
                                    <div className="mt-2">
                                        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                                            v2.1.1
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <button
                                onClick={toggle}
                                aria-label="Collapse sidebar"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                                <HugeiconsIcon icon={SidebarLeft01Icon} size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative flex-1 min-h-0">
                <nav
                    ref={navRef}
                    data-lenis-prevent="true"
                    className={cn("h-full min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar", collapsed ? "px-3 py-5" : "px-4 py-5")}
                >
                <div className="space-y-5">
                    {NAV_SECTIONS.map((section) => (
                        <section key={section.id}>
                            {!collapsed && (
                                <div className="mb-3 flex items-center gap-3 px-2">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                        {section.label}
                                    </div>
                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>
                            )}

                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <SidebarNavItem
                                        key={item.href}
                                        item={item}
                                        collapsed={collapsed}
                                        pathname={pathname}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
                </nav>

                {navScrollState.canScrollUp && (
                    <div className="pointer-events-none absolute left-4 right-4 top-0 h-6 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(248,250,252,0))]" />
                )}

                {navScrollState.canScrollDown && (
                    <div className="pointer-events-none absolute bottom-0 left-4 right-4 h-8 bg-[linear-gradient(0deg,rgba(248,250,252,0.98),rgba(248,250,252,0))]" />
                )}
            </div>

            <div className={cn(collapsed ? "px-3 py-4" : "px-4 py-4")}>
                <div
                    className={cn(
                        "rounded-[1.75rem] border border-slate-200 bg-white",
                        collapsed ? "p-2.5" : "p-4"
                    )}
                >
                    {collapsed ? (
                        <div title={`System Load: ${systemLoad}%`} className="flex items-center justify-center">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-emerald-600">
                                <svg className="absolute inset-0 h-10 w-10 -rotate-90">
                                    <circle
                                        className="text-slate-200"
                                        strokeWidth="3"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="15"
                                        cx="20"
                                        cy="20"
                                    />
                                    <circle
                                        className="text-emerald-500"
                                        strokeWidth="3"
                                        strokeDasharray={94}
                                        strokeDashoffset={94 - (94 * systemLoad) / 100}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="15"
                                        cx="20"
                                        cy="20"
                                    />
                                </svg>
                                {statsLoading ? (
                                    <Skeleton className="h-5 w-5 rounded-full bg-slate-200" />
                                ) : (
                                    <HugeiconsIcon icon={Activity01Icon} size={16} className="relative z-10" />
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-emerald-100 bg-emerald-50 text-emerald-600">
                                        <HugeiconsIcon icon={Activity01Icon} size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">System Load</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">Resource usage</div>
                                    </div>
                                </div>

                                {statsLoading ? (
                                    <Skeleton className="h-5 w-10 rounded-full" />
                                ) : (
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                        {systemLoad}%
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                {statsLoading ? (
                                    <Skeleton className="h-full w-full rounded-full bg-slate-200" />
                                ) : (
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${systemLoad}%` }}
                                    />
                                )}
                            </div>
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Auto refresh enabled
                            </div>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
