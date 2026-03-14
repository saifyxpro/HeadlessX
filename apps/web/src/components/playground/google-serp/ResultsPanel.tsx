import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Cancel01Icon,
    CheckmarkCircle02Icon,
    CodeSquareIcon,
    Copy01Icon,
    DocumentCodeIcon,
    Download01Icon,
    File01Icon,
    LinkSquare01Icon,
    Loading03Icon,
    Search01Icon,
    SourceCodeSquareIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SearchResponse, ProgressStep } from './types';

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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-50">
                <HugeiconsIcon icon={Search01Icon} className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">Ready to search</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Run a Google query and the results summary, markdown report, and raw data will appear here.
            </p>
        </div>
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

export function ResultsPanel({
    data,
    isStreaming,
    isPending,
    error,
    steps,
    elapsedTime,
    onRetry,
}: ResultsPanelProps) {
    const [viewMode, setViewMode] = useState<'visual' | 'raw' | 'json'>('visual');
    const [copied, setCopied] = useState(false);

    const sites = data?.results.sites ?? [];

    const handleCopy = async () => {
        if (!data) return;

        const text = viewMode === 'json'
            ? JSON.stringify(data.results, null, 2)
            : data.markdown;

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

        const isJson = viewMode === 'json';
        const content = isJson ? JSON.stringify(data.results, null, 2) : data.markdown;
        const mimeType = isJson ? 'application/json' : 'text/markdown';
        const extension = isJson ? 'json' : 'md';
        const filename = `google-serp-${new Date().toISOString().slice(0, 10)}.${extension}`;

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="relative min-h-[700px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <HugeiconsIcon icon={SourceCodeSquareIcon} className="h-3.5 w-3.5 text-slate-400" />
                        Search Results
                    </div>
                    {elapsedTime !== null && (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                            {(elapsedTime / 1000).toFixed(1)}s
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {data && (
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('visual')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    viewMode === 'visual'
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <HugeiconsIcon icon={File01Icon} className="h-3.5 w-3.5" />
                                    Visual
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('raw')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    viewMode === 'raw'
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <HugeiconsIcon icon={CodeSquareIcon} className="h-3.5 w-3.5" />
                                    Raw
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('json')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    viewMode === 'json'
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <HugeiconsIcon icon={DocumentCodeIcon} className="h-3.5 w-3.5" />
                                    JSON
                                </span>
                            </button>
                        </div>
                    )}

                    {data && (
                        <>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300"
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

            <div className="relative min-h-[640px] bg-white">
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
                    <div className="overflow-auto p-6">
                        {viewMode === 'visual' ? (
                            <div className="space-y-6">
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <ResultStat label="Query" value={data.query} />
                                    <ResultStat label="Sites" value={sites.length} />
                                    <ResultStat label="AI Overview" value={data.results.ai_overview ? 'Yes' : 'No'} />
                                    <ResultStat label="Timestamp" value={new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                                </div>

                                {data.results.ai_overview && (
                                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">AI Overview</div>
                                        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                            {data.results.ai_overview}
                                        </div>
                                    </section>
                                )}

                                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Organic Results</div>
                                            <div className="mt-1 text-sm text-slate-500">Top sources captured from the SERP.</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {sites.length > 0 ? (
                                            sites.map((site) => (
                                                <div key={site.url} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
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
                                                        <span className="truncate rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
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

                                <section className="rounded-3xl border border-slate-200 bg-white p-6">
                                    <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Markdown Report</div>
                                    <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-950 prose-pre:text-slate-100">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.markdown}</ReactMarkdown>
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <pre className="overflow-auto rounded-3xl border border-slate-200 bg-slate-950 p-5 text-xs leading-6 text-slate-100">
                                {viewMode === 'json' ? JSON.stringify(data.results, null, 2) : data.markdown}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
