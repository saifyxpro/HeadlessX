import { LinkSquare01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { MapLinkData, MapResultData } from '../types';
import { ResultStat } from './ResultStat';

interface MapResultsProps {
    data: MapResultData;
    query: string;
    setQuery: (value: string) => void;
    filteredLinks: MapLinkData[];
    expanded: boolean;
}

export function MapResults({
    data,
    query,
    setQuery,
    filteredLinks,
    expanded,
}: MapResultsProps) {
    return (
        <div className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultStat label="Total" value={data.summary.total} />
                <ResultStat label="Internal" value={data.summary.internal} />
                <ResultStat label="External" value={data.summary.external} />
                <ResultStat label="Sitemap" value={data.summary.sitemap} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="relative">
                    <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Filter discovered links"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                    />
                </div>

                <div className={`mt-4 grid gap-3 lg:grid-cols-2 ${expanded ? '' : 'max-h-[42rem] overflow-auto pr-1'}`}>
                    {filteredLinks.map((link) => (
                        <div key={link.url} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-slate-900">
                                        {link.label || link.pathname || link.url}
                                    </div>
                                    <div className="mt-1 break-all text-xs leading-5 text-slate-500">{link.url}</div>
                                </div>

                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-800"
                                >
                                    <HugeiconsIcon icon={LinkSquare01Icon} className="h-4 w-4" />
                                </a>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                                    link.internal ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {link.internal ? 'Internal' : 'External'}
                                </span>
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                                    {link.source}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                    {link.hostname}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredLinks.length === 0 && (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                        No links matched the current filter.
                    </div>
                )}
            </div>
        </div>
    );
}
