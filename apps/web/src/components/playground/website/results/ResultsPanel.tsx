import { useEffect, useState } from 'react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ProgressStep, ScrapeResult, WebsiteTool } from '../types';
import { useWebsiteResultState } from '../hooks/useWebsiteResultState';
import { CrawlResults } from './CrawlResults';
import { EmptyState } from './EmptyState';
import { MapResults } from './MapResults';
import { ProgressState } from './ProgressState';
import { ResultsHeader } from './ResultsHeader';
import { ScrapePreview } from './ScrapePreview';

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

export function ResultsPanel({
    tool,
    result,
    isStreaming,
    isPending,
    steps,
    elapsedTime,
    onRetry,
}: ResultsPanelProps) {
    const [copyTimer, setCopyTimer] = useState<number | null>(null);
    const latestStep = steps.length > 0 ? steps[steps.length - 1] : null;
    const {
        expanded,
        setExpanded,
        viewRaw,
        setViewRaw,
        copied,
        setCopied,
        selectedCrawlPage,
        setSelectedCrawlPageUrl,
        mapQuery,
        setMapQuery,
        filteredMapLinks,
    } = useWebsiteResultState(result);

    useEffect(() => () => {
        if (copyTimer) {
            window.clearTimeout(copyTimer);
        }
    }, [copyTimer]);

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

    const canExpand = Boolean(result && result.type !== 'error');
    const canToggleRaw = result?.type === 'html' || result?.type === 'html-js' || result?.type === 'markdown' || result?.type === 'crawl';
    const canCopy = Boolean(result && result.type !== 'error' && result.type !== 'image' && copyText);
    const canSave = Boolean(result && result.type !== 'error');

    const handleCopy = async () => {
        if (!copyText) {
            return;
        }

        await navigator.clipboard.writeText(copyText);
        setCopied(true);
        if (copyTimer) {
            window.clearTimeout(copyTimer);
        }
        const timerId = window.setTimeout(() => setCopied(false), 2000);
        setCopyTimer(timerId);
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

    return (
        <div className="relative min-h-[700px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white xl:col-span-8">
            <ResultsHeader
                tool={tool}
                result={result}
                isStreaming={isStreaming}
                isPending={isPending}
                elapsedTime={elapsedTime}
                latestStepMessage={latestStep?.message || null}
                expanded={expanded}
                canExpand={canExpand}
                onToggleExpanded={() => setExpanded((current) => !current)}
                viewRaw={viewRaw}
                canToggleRaw={canToggleRaw}
                onToggleRaw={() => setViewRaw((current) => !current)}
                canCopy={canCopy}
                copied={copied}
                onCopy={handleCopy}
                canSave={canSave}
                onSave={handleDownload}
            />

            <div className="relative min-h-[640px] bg-white">
                {!result && !isStreaming && !isPending && <EmptyState tool={tool} />}
                {(isStreaming || isPending) && <ProgressState steps={steps} />}

                {result && !isStreaming && !isPending && result.type === 'error' && (
                    <div className="flex h-full min-h-[640px] flex-col items-center justify-center px-8 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
                            <HugeiconsIcon icon={Cancel01Icon} className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Request Failed</h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{result.data}</p>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-8 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {result && !isStreaming && !isPending && result.type === 'image' && (
                    <div className="flex min-h-[640px] items-center justify-center p-8">
                        <div className={`overflow-hidden rounded-[2rem] border-[6px] border-white ${expanded ? 'max-h-none' : 'max-h-[80vh]'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={result.data} alt="Screenshot result" className={`${expanded ? 'max-h-none' : 'max-h-[80vh]'} max-w-full object-contain`} />
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
                        onSelectPage={(page) => setSelectedCrawlPageUrl(page.url)}
                        viewRaw={viewRaw}
                        expanded={expanded}
                    />
                )}

                {result && !isStreaming && !isPending && result.type === 'map' && (
                    <MapResults
                        data={result.data}
                        query={mapQuery}
                        setQuery={setMapQuery}
                        filteredLinks={filteredMapLinks}
                        expanded={expanded}
                    />
                )}
            </div>
        </div>
    );
}
