import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { CrawlPageData, CrawlResultData } from '../types';
import { ResultStat } from './ResultStat';

interface CrawlResultsProps {
    data: CrawlResultData;
    selectedPage: CrawlPageData | null;
    onOpenPage: (page: CrawlPageData) => void;
    expanded: boolean;
}

export function CrawlResults({
    data,
    selectedPage,
    onOpenPage,
    expanded,
}: CrawlResultsProps) {
    return (
        <div className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultStat label="Pages" value={data.summary.pagesCrawled} />
                <ResultStat label="Depth" value={data.summary.maxDepthReached} />
                <ResultStat label="Failures" value={data.summary.failureCount} />
                <ResultStat label="Discovered" value={data.summary.discoveredCount} />
            </div>

            <div className={`rounded-3xl border border-slate-200 bg-slate-50 ${expanded ? '' : 'max-h-[56rem] overflow-auto'}`}>
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-5 py-4 backdrop-blur">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Pages</div>
                            <div className="mt-1 text-sm text-slate-500">
                                Click any crawled page to inspect it in a focused overlay.
                            </div>
                        </div>
                        <div className="flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            <span className="shrink-0 text-slate-400">Seed</span>
                            <span className="max-w-[18rem] truncate normal-case tracking-normal text-slate-600">
                                {data.summary.seedUrl}
                            </span>
                        </div>
                    </div>
                </div>

                {data.pages.length > 0 ? (
                    <div className="grid gap-3 p-4 lg:grid-cols-2">
                        {data.pages.map((page) => {
                            const isActive = selectedPage?.url === page.url;

                            return (
                                <button
                                    key={page.url}
                                    type="button"
                                    onClick={() => onOpenPage(page)}
                                    className={`group flex h-full flex-col rounded-[1.5rem] border px-4 py-4 text-left transition-colors ${
                                        isActive
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-base font-semibold leading-7">
                                                {page.title || 'Untitled page'}
                                            </div>
                                            <div className={`mt-1 break-all text-xs leading-5 ${isActive ? 'text-white/75' : 'text-slate-500'}`}>
                                                {page.url}
                                            </div>
                                        </div>
                                        <div className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                            isActive ? 'border-white/15 bg-white/10 text-white' : 'border-slate-200 bg-slate-50 text-slate-500'
                                        }`}>
                                            Depth {page.depth}
                                        </div>
                                    </div>

                                    <div className={`mt-3 line-clamp-3 text-sm leading-6 ${isActive ? 'text-white/85' : 'text-slate-600'}`}>
                                        {page.excerpt?.trim() || 'No excerpt available for this page.'}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <div className={`flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                            isActive ? 'text-white/70' : 'text-slate-400'
                                        }`}>
                                            <span>{page.linkCount} links</span>
                                            <span>Status {page.statusCode ?? 'n/a'}</span>
                                        </div>
                                        <div className={`inline-flex items-center text-xs font-semibold ${
                                            isActive ? 'text-white' : 'text-slate-700'
                                        }`}>
                                            Open page
                                            <HugeiconsIcon icon={ArrowRight01Icon} className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center text-sm text-slate-500">
                        No crawl pages were captured.
                    </div>
                )}
            </div>

            {data.failures.length > 0 && (
                <div className={`rounded-3xl border border-red-200 bg-red-50 p-5 ${expanded ? '' : 'max-h-[22rem] overflow-auto'}`}>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Failures</div>
                    <div className="mt-3 space-y-2">
                        {data.failures.map((failure) => (
                            <div key={`${failure.url}-${failure.depth}`} className="rounded-2xl border border-red-200 bg-white px-4 py-3">
                                <div className="text-sm font-semibold text-slate-900">{failure.url}</div>
                                <div className="mt-1 text-xs text-red-600">{failure.error}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
