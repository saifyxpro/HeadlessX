import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ArrowDown01Icon,
    ArrowUp01Icon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    CodeSquareIcon,
    Copy01Icon,
    Download01Icon,
    LinkSquare01Icon,
    Loading03Icon,
    Search01Icon,
    SourceCodeSquareIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { CrawlPageData, MapLinkData, ScrapeResult, ProgressStep, WebsiteTool } from './types';

interface ResultsPanelProps {
    tool: WebsiteTool;
    result: ScrapeResult | null;
    isStreaming: boolean;
    isPending: boolean;
    steps: ProgressStep[];
    elapsedTime: number | null;
    onRetry: () => void;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
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

function EmptyState({ tool }: { tool: WebsiteTool }) {
    const copy = tool === 'scrape'
        ? {
            title: 'Ready to scrape',
            body: 'Run a one-page extraction and the result preview will appear here.',
        }
        : tool === 'crawl'
            ? {
                title: 'Ready to crawl',
                body: 'Queue a crawl job and this panel will turn into a page list with markdown previews.',
            }
            : {
                title: 'Ready to map',
                body: 'Run discovery and the link inventory will render here without horizontal overflow.',
            };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,1),rgba(241,245,249,1))] shadow-xl ring-1 ring-slate-200">
                <HugeiconsIcon icon={Search01Icon} className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">{copy.title}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{copy.body}</p>
        </div>
    );
}

function ProgressState({
    steps,
}: {
    steps: ProgressStep[];
}) {
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
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                            step.status === 'completed'
                                ? 'border-emerald-300 bg-white text-emerald-600'
                                : step.status === 'error'
                                    ? 'border-red-300 bg-white text-red-600'
                                    : 'border-slate-200 bg-white text-slate-600'
                        }`}>
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

function ScrapePreview({
    result,
    viewRaw,
    expanded,
}: {
    result: Extract<ScrapeResult, { type: 'html' | 'html-js' | 'markdown' }>;
    viewRaw: boolean;
    expanded: boolean;
}) {
    const isMarkdown = result.type === 'markdown';
    const content = isMarkdown ? result.data.markdown : result.data.html;

    return (
        <div className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ResultStat label="Mode" value={isMarkdown ? 'Markdown' : result.type === 'html-js' ? 'Rendered HTML' : 'HTML'} />
                <ResultStat label="Title" value={result.data.title || 'Untitled'} />
                <ResultStat label="Chars" value={content.length.toLocaleString()} />
            </div>

            {viewRaw ? (
                <pre className={`overflow-auto rounded-3xl border border-slate-200 bg-slate-950 p-5 text-xs leading-6 text-slate-100 ${expanded ? 'max-h-none' : 'max-h-[36rem]'}`}>
                    {content}
                </pre>
            ) : isMarkdown ? (
                <div className={`rounded-3xl border border-slate-200 bg-white p-6 ${expanded ? 'max-h-none' : 'max-h-[36rem] overflow-auto'}`}>
                    <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-img:rounded-2xl">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.data.markdown}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${expanded ? 'h-[52rem]' : 'h-[36rem]'}`}>
                    <iframe
                        srcDoc={result.data.html}
                        title="Scrape preview"
                        className="h-full w-full"
                        sandbox="allow-same-origin"
                    />
                </div>
            )}
        </div>
    );
}

function CrawlResults({
    data,
    selectedPage,
    onSelectPage,
    viewRaw,
}: {
    data: Extract<ScrapeResult, { type: 'crawl' }>['data'];
    selectedPage: CrawlPageData | null;
    onSelectPage: (page: CrawlPageData) => void;
    viewRaw: boolean;
}) {
    return (
        <div className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultStat label="Pages" value={data.summary.pagesCrawled} />
                <ResultStat label="Depth" value={data.summary.maxDepthReached} />
                <ResultStat label="Failures" value={data.summary.failureCount} />
                <ResultStat label="Discovered" value={data.summary.discoveredCount} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 px-2">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Pages</div>
                        <div className="mt-1 text-sm text-slate-500">Select a crawled page to inspect its markdown.</div>
                    </div>

                    <div className="space-y-2">
                        {data.pages.map((page) => {
                            const isActive = selectedPage?.url === page.url;

                            return (
                                <button
                                    key={page.url}
                                    type="button"
                                    onClick={() => onSelectPage(page)}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                                        isActive
                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="text-sm font-semibold">{page.title}</div>
                                    <div className={`mt-1 line-clamp-2 text-xs leading-5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {page.url}
                                    </div>
                                    <div className={`mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                        <span>Depth {page.depth}</span>
                                        <span>{page.linkCount} links</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    {selectedPage ? (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <ResultStat label="Title" value={selectedPage.title || 'Untitled'} />
                                <ResultStat label="Depth" value={selectedPage.depth} />
                                <ResultStat label="Links" value={selectedPage.linkCount} />
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                <div className="mb-4">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Selected Page</div>
                                    <div className="mt-1 break-all text-sm text-slate-500">{selectedPage.url}</div>
                                </div>

                                {viewRaw ? (
                                    <pre className="max-h-[42rem] overflow-auto rounded-2xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">
                                        {selectedPage.markdown}
                                    </pre>
                                ) : (
                                    <div className="max-h-[42rem] overflow-auto rounded-2xl border border-slate-200 p-5">
                                        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-950 prose-pre:text-slate-100">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPage.markdown}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                            No crawl pages were captured.
                        </div>
                    )}

                    {data.failures.length > 0 && (
                        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
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
            </div>
        </div>
    );
}

function MapResults({
    data,
    query,
    setQuery,
    filteredLinks,
}: {
    data: Extract<ScrapeResult, { type: 'map' }>['data'];
    query: string;
    setQuery: (value: string) => void;
    filteredLinks: MapLinkData[];
}) {
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

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {filteredLinks.map((link) => (
                        <div key={link.url} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
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

export function ResultsPanel({
    tool,
    result,
    isStreaming,
    isPending,
    steps,
    elapsedTime,
    onRetry,
}: ResultsPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const [viewRaw, setViewRaw] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedCrawlPageUrl, setSelectedCrawlPageUrl] = useState<string | null>(null);
    const [mapQuery, setMapQuery] = useState('');
    const deferredMapQuery = useDeferredValue(mapQuery);

    useEffect(() => {
        setExpanded(false);
        setViewRaw(false);
        setCopied(false);
        setMapQuery('');

        if (result?.type === 'crawl') {
            setSelectedCrawlPageUrl(result.data.pages[0]?.url || null);
            return;
        }

        setSelectedCrawlPageUrl(null);
    }, [result]);

    const selectedCrawlPage = result?.type === 'crawl'
        ? result.data.pages.find((page) => page.url === selectedCrawlPageUrl) || result.data.pages[0] || null
        : null;

    const filteredMapLinks = result?.type === 'map'
        ? result.data.links.filter((link) => {
            const query = deferredMapQuery.trim().toLowerCase();
            if (!query) {
                return true;
            }

            return [
                link.url,
                link.label || '',
                link.hostname,
                link.pathname,
                link.source,
            ].some((value) => value.toLowerCase().includes(query));
        })
        : [];

    const copyText = (() => {
        if (!result) {
            return '';
        }

        switch (result.type) {
            case 'html':
            case 'html-js':
                return result.data.html;
            case 'markdown':
                return result.data.markdown;
            case 'crawl':
                return selectedCrawlPage?.markdown || result.data.combinedMarkdown;
            case 'map':
                return filteredMapLinks.map((link) => link.url).join('\n');
            default:
                return '';
        }
    })();

    const canExpand = result?.type === 'html' || result?.type === 'html-js' || result?.type === 'markdown';

    const handleCopy = async () => {
        if (!copyText) {
            return;
        }

        await navigator.clipboard.writeText(copyText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!result) {
            return;
        }

        const stamp = new Date().toISOString().slice(0, 10);

        switch (result.type) {
            case 'html':
            case 'html-js':
                downloadTextFile(`website-${stamp}.html`, result.data.html, 'text/html');
                return;
            case 'markdown':
                downloadTextFile(`website-${stamp}.md`, result.data.markdown, 'text/markdown');
                return;
            case 'crawl':
                downloadTextFile(`crawl-${stamp}.md`, result.data.combinedMarkdown, 'text/markdown');
                return;
            case 'map':
                downloadTextFile(`map-${stamp}.json`, JSON.stringify(result.data, null, 2), 'application/json');
                return;
            case 'image': {
                const anchor = document.createElement('a');
                anchor.href = result.data;
                anchor.download = `screenshot-${Date.now()}.jpeg`;
                anchor.click();
                return;
            }
            default:
                return;
        }
    };

    const title = tool === 'scrape'
        ? 'Scrape Results'
        : tool === 'crawl'
            ? 'Crawl Results'
            : 'Map Results';

    return (
        <div className="relative min-h-[700px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-rose-400 shadow-sm" />
                        <div className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" />
                        <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-sm" />
                    </div>
                    <div className="hidden h-5 w-px bg-slate-200 sm:block" />
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                        <HugeiconsIcon icon={SourceCodeSquareIcon} className="h-3.5 w-3.5 text-slate-400" />
                        {title}
                    </div>
                    {elapsedTime !== null && (
                        <div className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
                            {`${(elapsedTime / 1000).toFixed(1)}s`}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canExpand && result && (
                        <button
                            type="button"
                            onClick={() => setExpanded((current) => !current)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300"
                        >
                            <HugeiconsIcon icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-3.5 w-3.5" />
                            {expanded ? 'Collapse' : 'Expand'}
                        </button>
                    )}

                    {(result?.type === 'html' || result?.type === 'html-js' || result?.type === 'markdown' || result?.type === 'crawl') && (
                        <button
                            type="button"
                            onClick={() => setViewRaw((current) => !current)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                viewRaw
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            <HugeiconsIcon icon={CodeSquareIcon} className="h-3.5 w-3.5" />
                            {viewRaw ? 'Preview' : 'Raw'}
                        </button>
                    )}

                    {result && result.type !== 'error' && result.type !== 'image' && copyText && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300"
                        >
                            <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} className={`h-3.5 w-3.5 ${copied ? 'text-emerald-500' : ''}`} />
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    )}

                    {result && result.type !== 'error' && (
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                            <HugeiconsIcon icon={Download01Icon} className="h-3.5 w-3.5" />
                            Save
                        </button>
                    )}
                </div>
            </div>

            <div className="relative min-h-[640px] bg-white">
                {!result && !isStreaming && !isPending && <EmptyState tool={tool} />}

                {(isStreaming || isPending) && <ProgressState steps={steps} />}

                {result && !isStreaming && !isPending && result.type === 'error' && (
                    <div className="flex h-full min-h-[640px] flex-col items-center justify-center px-8 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 shadow-xl shadow-red-500/10 ring-1 ring-red-100">
                            <HugeiconsIcon icon={Cancel01Icon} className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Request Failed</h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{result.data}</p>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-8 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-0.5"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {result && !isStreaming && !isPending && result.type === 'image' && (
                    <div className="flex min-h-[640px] items-center justify-center p-8">
                        <div className="overflow-hidden rounded-[2rem] border-[6px] border-white shadow-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={result.data} alt="Screenshot result" className="max-h-[80vh] max-w-full object-contain" />
                        </div>
                    </div>
                )}

                {result && !isStreaming && !isPending && (result.type === 'html' || result.type === 'html-js' || result.type === 'markdown') && (
                    <ScrapePreview result={result} viewRaw={viewRaw} expanded={expanded} />
                )}

                {result && !isStreaming && !isPending && result.type === 'crawl' && (
                    <CrawlResults
                        data={result.data}
                        selectedPage={selectedCrawlPage}
                        onSelectPage={(page) => {
                            startTransition(() => setSelectedCrawlPageUrl(page.url));
                        }}
                        viewRaw={viewRaw}
                    />
                )}

                {result && !isStreaming && !isPending && result.type === 'map' && (
                    <MapResults
                        data={result.data}
                        query={mapQuery}
                        setQuery={setMapQuery}
                        filteredLinks={filteredMapLinks}
                    />
                )}
            </div>
        </div>
    );
}
