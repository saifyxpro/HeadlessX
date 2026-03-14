import Link from 'next/link';
import {
    ArrowLeft01Icon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Clock03Icon,
    CodeSquareIcon,
    GlobeIcon,
    LinkSquare01Icon,
    Loading03Icon,
    SourceCodeSquareIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ScrapeResult, WebsiteTool } from './types';

const TOOL_META: Record<WebsiteTool, {
    href: string;
    label: string;
    title: string;
    description: string;
    icon: typeof GlobeIcon;
}> = {
    scrape: {
        href: '/playground/website',
        label: 'Scrape',
        title: 'Website Scraper',
        description: 'Single-page extraction with HTML, rendered DOM, markdown, or screenshot output.',
        icon: CodeSquareIcon,
    },
    crawl: {
        href: '/playground/website/crawl',
        label: 'Crawl',
        title: 'Website Crawl',
        description: 'Queued multi-page markdown crawling for site sections, docs, and content hubs.',
        icon: SourceCodeSquareIcon,
    },
    map: {
        href: '/playground/website/map',
        label: 'Map',
        title: 'Website Map',
        description: 'Fast link discovery with page and sitemap signals merged into one clean view.',
        icon: LinkSquare01Icon,
    },
};

interface ScraperHeaderProps {
    tool: WebsiteTool;
    currentUrl: string;
    elapsedTime: number | null;
    isPending: boolean;
    result: ScrapeResult | null;
}

function buildToolHref(tool: WebsiteTool, currentUrl: string) {
    const href = TOOL_META[tool].href;
    if (!currentUrl) {
        return href;
    }

    return `${href}?url=${encodeURIComponent(currentUrl)}`;
}

export function ScraperHeader({ tool, currentUrl, elapsedTime, isPending, result }: ScraperHeaderProps) {
    const currentMeta = TOOL_META[tool];
    const CurrentIcon = currentMeta.icon;
    const hasSucceeded = Boolean(result && result.type !== 'error' && !isPending);

    return (
        <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="flex items-start gap-4">
                        <Link
                            href="/playground"
                            className="group rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white"
                        >
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </Link>

                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] text-blue-600 shadow-sm ring-1 ring-slate-200">
                                    <HugeiconsIcon icon={CurrentIcon} className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        {currentMeta.title}
                                    </h1>
                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                                        {currentMeta.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {Object.entries(TOOL_META).map(([key, meta]) => {
                                    const isActive = key === tool;

                                    return (
                                        <Link
                                            key={key}
                                            href={buildToolHref(key as WebsiteTool, currentUrl)}
                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
                                                isActive
                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'
                                            }`}
                                        >
                                            <HugeiconsIcon icon={meta.icon} className="h-3.5 w-3.5" />
                                            {meta.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    <div
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium font-mono transition-all ${
                            elapsedTime !== null
                                ? 'border-slate-200 bg-slate-50 text-slate-700'
                                : 'pointer-events-none opacity-0'
                        }`}
                    >
                        <HugeiconsIcon icon={Clock03Icon} className="h-4 w-4 text-slate-400" />
                        {elapsedTime !== null ? (elapsedTime / 1000).toFixed(1) : '0.0'}s
                    </div>

                    {isPending && (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                            <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin text-blue-400" />
                            Processing
                        </div>
                    )}

                    {result?.type === 'error' && !isPending && (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                            Failed
                        </div>
                    )}

                    {hasSucceeded && (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4" />
                            Ready
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
