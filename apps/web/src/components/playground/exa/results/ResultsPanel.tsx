'use client';

import { useMemo, useState } from 'react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ExaProgressStep, ExaSearchResponse } from '../types';
import { buildSearchMarkdown, downloadMarkdownFile } from '../utils';
import { ResultsPanelShell } from '../../shared';
import { EmptyState } from './EmptyState';
import { ProgressState } from './ProgressState';
import { ResultsHeader } from './ResultsHeader';

interface ResultsPanelProps {
    available: boolean;
    query: string;
    searchType: string;
    steps: ExaProgressStep[];
    searchResult: ExaSearchResponse | null;
    error: string | null;
    isPending: boolean;
    elapsedTime: number | null;
}

export function ResultsPanel({
    available,
    query,
    searchType,
    steps,
    searchResult,
    error,
    isPending,
    elapsedTime,
}: ResultsPanelProps) {
    const [viewRaw, setViewRaw] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const activeMarkdown = useMemo(() => buildSearchMarkdown(searchResult, query), [query, searchResult]);
    const rawPayload = useMemo(() => activeMarkdown || JSON.stringify(searchResult, null, 2), [activeMarkdown, searchResult]);
    const hasResult = Boolean(searchResult);
    const collapsedBodyClass = 'custom-scrollbar h-[42rem] min-h-0 overflow-y-auto pr-2';

    const handleCopy = async () => {
        if (!rawPayload) {
            return;
        }

        await navigator.clipboard.writeText(rawPayload);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
    };

    const handleSave = () => {
        if (!activeMarkdown) {
            return;
        }

        downloadMarkdownFile(activeMarkdown, `exa-search-${Date.now()}.md`);
    };

    return (
        <ResultsPanelShell
            header={
                <ResultsHeader
                    hasResult={hasResult}
                    hasError={Boolean(error)}
                    isPending={isPending}
                    elapsedTime={elapsedTime}
                    requestId={searchResult?.requestId}
                    expanded={expanded}
                    viewRaw={viewRaw}
                    copied={copied}
                    canCopy={hasResult && !error}
                    canSave={hasResult && !error}
                    onToggleExpanded={() => setExpanded((current) => !current)}
                    onToggleRaw={() => setViewRaw((current) => !current)}
                    onCopy={handleCopy}
                    onSave={handleSave}
                />
            }
            bodyClassName="min-h-[640px]"
        >
            {!hasResult && !isPending && !error && <EmptyState available={available} />}
            {isPending && !hasResult && <ProgressState searchType={searchType} steps={steps} />}

            {error && !isPending && (
                <div className="flex h-full min-h-[640px] flex-col items-center justify-center px-8 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
                        <HugeiconsIcon icon={Cancel01Icon} className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Request Failed</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p>
                </div>
            )}

            {hasResult && !isPending && !error && (
                viewRaw ? (
                    <div className="p-8">
                        <div data-native-scroll="true" className={expanded ? '' : collapsedBodyClass}>
                            <pre className={`rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 ${expanded ? 'custom-scrollbar overflow-auto' : 'overflow-x-auto overflow-y-visible'}`}>
                                <code>{rawPayload}</code>
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div className="p-8">
                        <div data-native-scroll="true" className={expanded ? '' : collapsedBodyClass}>
                            <div className="space-y-5">
                                {searchResult?.output?.content && (
                                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Synthesis
                                        </div>
                                        {typeof searchResult.output.content === 'string' ? (
                                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                                {searchResult.output.content}
                                            </p>
                                        ) : (
                                            <pre className="custom-scrollbar overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                                                <code>{JSON.stringify(searchResult.output.content, null, 2)}</code>
                                            </pre>
                                        )}
                                    </div>
                                )}

                                {!!searchResult?.results?.length && (
                                    <div className="space-y-4">
                                        {searchResult.results.map((result, index) => (
                                            <div key={`${result.id}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <a
                                                            href={result.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="break-words text-base font-semibold text-slate-900 hover:text-blue-600"
                                                        >
                                                            {result.title || result.url}
                                                        </a>
                                                        <div className="mt-1 break-all text-xs font-medium text-slate-500">
                                                            {result.url}
                                                        </div>
                                                        {(result.publishedDate || result.author) && (
                                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                                {result.publishedDate ? <span>{result.publishedDate}</span> : null}
                                                                {result.author ? <span>{result.author}</span> : null}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {typeof result.score === 'number' && (
                                                        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                                                            {result.score.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>

                                                {!!result.highlights?.length && (
                                                    <div className="mt-4 space-y-3">
                                                        {result.highlights.map((highlight, highlightIndex) => (
                                                            <div key={`${result.id}-highlight-${highlightIndex}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                                                                {highlight}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {!result.highlights?.length && result.text && (
                                                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                                        {result.text}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            )}
        </ResultsPanelShell>
    );
}
