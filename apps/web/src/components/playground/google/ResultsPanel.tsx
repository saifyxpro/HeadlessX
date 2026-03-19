import { useState } from 'react';
import {
    Cancel01Icon,
    CheckmarkCircle02Icon,
    CodeSquareIcon,
    Copy01Icon,
    Download01Icon,
    File01Icon,
    LinkSquare01Icon,
    Loading03Icon,
    Search01Icon,
    SourceCodeSquareIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SearchResponse, ProgressStep } from './types';
import { PlaygroundEmptyState, ResultsPanelShell } from '../shared';

interface ResultsPanelProps {
    data: SearchResponse | null;
    isStreaming: boolean;
    isPending: boolean;
    error: string | null;
    steps: ProgressStep[];
    elapsedTime: number | null;
    onRetry: () => void;
}

function ResultStat({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
        </div>
    );
}

function EmptyState() {
    return (
        <PlaygroundEmptyState
            icon={Search01Icon}
            title="Ready to search"
            body="Run a Google query and the results summary and raw output will appear here."
        />
    );
}

function ProgressState({ steps }: { steps: ProgressStep[] }) {
    return (
        <div className="absolute inset-0 overflow-auto px-6 py-8">
            <div className="mx-auto max-w-2xl space-y-3">
                {steps.length === 0 && (
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500">
                        <HugeiconsIcon icon={Loading03Icon} className="h-5 w-5 animate-spin text-slate-400" />
                        Waiting for the worker to publish progress
                    </div>
                )}

                {steps.map((step) => (
                    <div
                        key={`${step.step}-${step.message}`}
                        className={`flex items-start gap-4 rounded-2xl border px-4 py-4 ${
                            step.status === 'completed'
                                ? 'border-emerald-200 bg-emerald-50'
                                : step.status === 'error'
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                        <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                                step.status === 'completed'
                                    ? 'border-emerald-300 bg-white text-emerald-600'
                                    : step.status === 'error'
                                        ? 'border-red-300 bg-white text-red-600'
                                        : 'border-slate-200 bg-white text-slate-600'
                            }`}
                        >
                            {step.status === 'active' ? (
                                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                            ) : step.status === 'completed' ? (
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4" />
                            ) : (
                                step.step
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Step {step.step} of {step.total}
                            </div>
                            <div className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                                {step.message}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function renderOverviewContent(content: string) {
    const normalized = content
        .replace(/\r/g, '\n')
        .replace(/(https?:\/\/[^\s]+)/g, '\n$1\n')
        .replace(/([.!?؟])\s+(?=[A-Z0-9\u0600-\u06FF])/g, '$1\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

    const blocks = normalized
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !/^\+\d+$/.test(line))
        .filter(
            (line, index, lines) =>
                !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(line) ||
                !(lines[index - 1]?.includes(line) || lines[index + 1]?.includes(line))
        );

    if (blocks.length === 0) {
        return <p>No AI overview was returned for this search.</p>;
    }

    return (
        <div className="space-y-3">
            {blocks.map((block, index) => {
                const urlOnlyMatch = block.match(/^https?:\/\/[^\s]+$/);

                if (urlOnlyMatch) {
                    let hostname = block;

                    try {
                        hostname = new URL(block).hostname.replace(/^www\./, '');
                    } catch { }

                    return (
                        <a
                            key={`${block}-${index}`}
                            href={block}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                        >
                            <HugeiconsIcon icon={LinkSquare01Icon} className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{hostname}</span>
                        </a>
                    );
                }

                const parts = block.split(/(https?:\/\/[^\s]+)/g);

                return (
                    <p key={`paragraph-${index}`} className="text-sm leading-7 text-slate-700">
                        {parts.map((part, partIndex) => {
                            if (!part) {
                                return null;
                            }

                            if (/^https?:\/\/[^\s]+$/.test(part)) {
                                return (
                                    <a
                                        key={`${part}-${partIndex}`}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="break-all font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
                                    >
                                        {part}
                                    </a>
                                );
                            }

                            return <span key={`text-${partIndex}`}>{part}</span>;
                        })}
                    </p>
                );
            })}
        </div>
    );
}

export function ResultsPanel({
    data,
    isStreaming,
    isPending,
    error,
    steps,
    elapsedTime,
    onRetry,
}: ResultsPanelProps) {
    const [viewMode, setViewMode] = useState<'visual' | 'raw'>('visual');
    const [copied, setCopied] = useState(false);

    const sites = data?.results.sites ?? [];
    const runState = (() => {
        if (isStreaming || isPending) {
            return {
                label: 'Streaming Run',
                tone: 'border-blue-100 bg-blue-50 text-blue-700',
            };
        }

        if (error) {
            return {
                label: 'Failed',
                tone: 'border-red-200 bg-red-50 text-red-600',
            };
        }

        if (data) {
            return {
                label: 'Ready',
                tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            };
        }

        return {
            label: 'Idle',
            tone: 'border-slate-200 bg-white text-slate-500',
        };
    })();

    const handleCopy = async () => {
        if (!data) return;
        const text = data.markdown;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const handleDownload = () => {
        if (!data) return;
        const content = data.markdown;
        const filename = `google-ai-search-${new Date().toISOString().slice(0, 10)}.md`;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ResultsPanelShell
            header={
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-4">
                        <div className="flex shrink-0 items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-rose-400" />
                            <div className="h-3 w-3 rounded-full bg-amber-400" />
                            <div className="h-3 w-3 rounded-full bg-emerald-400" />
                        </div>
                        <div className="hidden h-5 w-px bg-slate-200 sm:block" />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                    <HugeiconsIcon icon={SourceCodeSquareIcon} className="h-3.5 w-3.5 text-slate-400" />
                                    Search Results
                                </div>
                                <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${runState.tone}`}>
                                    {(isStreaming || isPending) && <HugeiconsIcon icon={Loading03Icon} className="h-3.5 w-3.5 animate-spin" />}
                                    {!(isStreaming || isPending) && error && <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />}
                                    {!(isStreaming || isPending) && data && !error && <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5" />}
                                    {runState.label}
                                </div>
                                {elapsedTime !== null && (
                                    <div className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                                        {(elapsedTime / 1000).toFixed(1)}s
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                    {data && (
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('visual')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'visual' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <HugeiconsIcon icon={File01Icon} className="h-3.5 w-3.5" />
                                    Visual
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('raw')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'raw' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <HugeiconsIcon icon={CodeSquareIcon} className="h-3.5 w-3.5" />
                                    Raw
                                </span>
                            </button>
                        </div>
                    )}

                    {data && (
                        <>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
                            >
                                <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} className={`h-3.5 w-3.5 ${copied ? 'text-emerald-500' : ''}`} />
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                                <HugeiconsIcon icon={Download01Icon} className="h-3.5 w-3.5" />
                                Save
                            </button>
                        </>
                    )}
                    </div>
                </div>
            }
            bodyClassName="min-h-[640px]"
        >
                {!data && !isStreaming && !isPending && !error && <EmptyState />}

                {(isStreaming || isPending) && <ProgressState steps={steps} />}

                {error && !isStreaming && !isPending && (
                    <div className="flex h-full min-h-[640px] flex-col items-center justify-center px-8 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
                            <HugeiconsIcon icon={Cancel01Icon} className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Search failed</h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-8 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {data && !isStreaming && !isPending && !error && (
                    <div className="overflow-auto bg-white p-6">
                        {viewMode === 'visual' ? (
                            <div className="space-y-6">
                                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Query Summary</div>
                                    <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{data.query}</div>
                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                        <ResultStat label="Sites" value={sites.length} />
                                        <ResultStat label="AI Overview" value={data.results.ai_overview ? 'Yes' : 'No'} />
                                        <ResultStat label="Timestamp" value={new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">AI Overview</div>
                                    <div className="mt-3">
                                        {data.results.ai_overview
                                            ? renderOverviewContent(data.results.ai_overview)
                                            : 'No AI overview was returned for this search.'}
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Organic Results</div>
                                            <div className="mt-1 text-sm text-slate-500">Top sources captured from the Google results page.</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {sites.length > 0 ? (
                                            sites.map((site, index) => (
                                                <div
                                                    key={`${site.url || site.title || 'result'}-${index}`}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-slate-900">{site.title}</div>
                                                            <div className="mt-1 text-sm leading-6 text-slate-500">{site.description}</div>
                                                        </div>
                                                        <a
                                                            href={site.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                                                        >
                                                            <HugeiconsIcon icon={LinkSquare01Icon} className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                                            {site.source}
                                                        </span>
                                                        <span className="truncate rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                                            {site.url}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                                                No site results were returned for this search.
                                            </div>
                                        )}
                                    </div>
                                </section>

                            </div>
                        ) : (
                            <pre className="overflow-auto rounded-3xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-700">
                                {data.markdown}
                            </pre>
                        )}
                    </div>
                )}
        </ResultsPanelShell>
    );
}
