'use client';

import { useMemo, useState } from 'react';
import {
    Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { TavilyResearchResponse, TavilySearchResponse, TavilyTool } from '../types';
import {
    buildResearchMarkdown,
    buildSearchMarkdown,
    downloadMarkdownFile,
    normalizeResearchRequestId,
    normalizeResearchStatus,
} from '../utils';
import { EmptyState } from './EmptyState';
import { ProgressState } from './ProgressState';
import { ResultsHeader } from './ResultsHeader';

interface ResultsPanelProps {
    tool: TavilyTool;
    available: boolean;
    query: string;
    searchResult: TavilySearchResponse | null;
    researchResult: TavilyResearchResponse | null;
    researchRequestId: string | null;
    researchStatus: string | null;
    error: string | null;
    isPending: boolean;
    elapsedTime: number | null;
}

export function ResultsPanel(props: ResultsPanelProps) {
    const {
        tool,
        available,
        query,
        searchResult,
        researchResult,
        researchRequestId,
        researchStatus,
        error,
        isPending,
        elapsedTime,
    } = props;

    const [viewRaw, setViewRaw] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const activeMarkdown = useMemo(
        () => tool === 'search' ? buildSearchMarkdown(searchResult, query) : buildResearchMarkdown(researchResult, query),
        [query, researchResult, searchResult, tool]
    );

    const rawPayload = useMemo(() => {
        if (activeMarkdown) {
            return activeMarkdown;
        }

        return JSON.stringify(tool === 'search' ? searchResult : researchResult, null, 2);
    }, [activeMarkdown, researchResult, searchResult, tool]);

    const hasResult = tool === 'search' ? Boolean(searchResult) : Boolean(researchResult);
    const showCopySave = hasResult && !error;
    const resolvedResearchStatus = normalizeResearchStatus(researchStatus || researchResult?.status);
    const collapsedBodyClass = 'custom-scrollbar h-[42rem] min-h-0 overflow-y-auto pr-2';

    const handleCopy = async () => {
        const content = activeMarkdown || rawPayload;
        if (!content) {
            return;
        }

        await navigator.clipboard.writeText(content);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
    };

    const handleSave = () => {
        if (!activeMarkdown) {
            return;
        }

        downloadMarkdownFile(activeMarkdown, `tavily-${tool}-${Date.now()}.md`);
    };

    return (
        <div className="relative flex min-h-[700px] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white xl:col-span-8">
            <ResultsHeader
                tool={tool}
                hasResult={hasResult}
                hasError={Boolean(error)}
                isPending={isPending}
                elapsedTime={elapsedTime}
                requestId={researchRequestId}
                expanded={expanded}
                viewRaw={viewRaw}
                copied={copied}
                canCopy={showCopySave}
                canSave={showCopySave}
                onToggleExpanded={() => setExpanded((current) => !current)}
                onToggleRaw={() => setViewRaw((current) => !current)}
                onCopy={handleCopy}
                onSave={handleSave}
            />

            <div className="relative flex min-h-[640px] flex-1 flex-col bg-white">
                {!hasResult && !isPending && !error && <EmptyState tool={tool} available={available} />}
                {isPending && !hasResult && (
                    <ProgressState
                        tool={tool}
                        hasRequestId={Boolean(researchRequestId)}
                        researchStatus={resolvedResearchStatus}
                    />
                )}

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
                            <div
                                data-native-scroll="true"
                                className={expanded ? '' : collapsedBodyClass}
                            >
                                <pre className={`rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 ${expanded ? 'custom-scrollbar overflow-auto' : 'overflow-x-auto overflow-y-visible'}`}>
                                    <code>{rawPayload}</code>
                                </pre>
                            </div>
                        </div>
                    ) : tool === 'search' ? (
                        <div className="p-8">
                            <div
                                data-native-scroll="true"
                                className={expanded ? '' : collapsedBodyClass}
                            >
                                <div className="space-y-5">
                                    {searchResult?.answer && (
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Answer</div>
                                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{searchResult.answer}</p>
                                        </div>
                                    )}

                                    {!!searchResult?.results?.length && (
                                        <div className="space-y-4">
                                            {searchResult.results.map((result, index) => (
                                                <div key={`${result.url}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <a href={result.url} target="_blank" rel="noreferrer" className="break-words text-base font-semibold text-slate-900 hover:text-blue-600">
                                                                {result.title || result.url}
                                                            </a>
                                                            <div className="mt-1 break-all text-xs font-medium text-slate-500">{result.url}</div>
                                                        </div>
                                                        {typeof result.score === 'number' && (
                                                            <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                                                                {result.score.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {result.content && (
                                                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                                            {result.content}
                                                        </p>
                                                    )}

                                                    {result.rawContent && (
                                                        <pre
                                                            data-native-scroll="true"
                                                            className="custom-scrollbar mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700"
                                                        >
                                                            <code>{result.rawContent}</code>
                                                        </pre>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!!searchResult?.images?.length && (
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Images</div>
                                            <div className="space-y-3">
                                                {searchResult.images.map((image, index) => (
                                                    <div key={`${image.url}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                                        <div className="font-medium text-slate-700">{image.description || 'Image result'}</div>
                                                        <div className="mt-1 break-all text-xs text-slate-500">{image.url}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8">
                            <div
                                data-native-scroll="true"
                                className={expanded ? '' : collapsedBodyClass}
                            >
                                <div className="space-y-5">
                                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</div>
                                        <div className="text-sm text-slate-700">
                                            {normalizeResearchStatus(researchResult?.status)}
                                        </div>
                                        {normalizeResearchRequestId(researchResult || {}) && (
                                            <div className="mt-2 break-all text-xs text-slate-500">
                                                {normalizeResearchRequestId(researchResult || {})}
                                            </div>
                                        )}
                                    </div>

                                    {researchResult?.content && (
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Report</div>
                                            {typeof researchResult.content === 'string' ? (
                                                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                                    {researchResult.content}
                                                </div>
                                            ) : (
                                                <pre
                                                    data-native-scroll="true"
                                                    className="custom-scrollbar overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700"
                                                >
                                                    <code>{JSON.stringify(researchResult.content, null, 2)}</code>
                                                </pre>
                                            )}
                                        </div>
                                    )}

                                    {!!researchResult?.sources?.length && (
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sources</div>
                                            <div className="space-y-3">
                                                {researchResult.sources.map((source, index) => (
                                                    <a
                                                        key={`${source.url || source.title}-${index}`}
                                                        href={source.url || '#'}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-slate-300 hover:bg-white"
                                                    >
                                                        <div className="text-sm font-semibold text-slate-900">{source.title || source.url || `Source ${index + 1}`}</div>
                                                        {source.url && <div className="mt-1 break-all text-xs text-slate-500">{source.url}</div>}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
