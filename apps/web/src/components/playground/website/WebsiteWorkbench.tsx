'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfigurationPanel } from './ConfigurationPanel';
import { ResultsPanel } from './ResultsPanel';
import { ScraperHeader } from './ScraperHeader';
import type {
    CrawlResultData,
    MapResultData,
    OutputType,
    ProgressStep,
    ScrapeHtmlData,
    ScrapeMarkdownData,
    ScrapeResult,
    WebsiteTool,
} from './types';

type StreamEventName = 'start' | 'progress' | 'result' | 'error' | 'cancelled' | 'done' | 'reconnect';

type ParsedStreamEvent = {
    event: StreamEventName | 'message';
    data: any;
};

function mapPayloadToResult(payload: any): ScrapeResult {
    if (!payload?.success) {
        return {
            type: 'error',
            data: payload?.error || 'Request failed',
        };
    }

    if (payload.type === 'screenshot') {
        return {
            type: 'image',
            data: typeof payload.data === 'string' ? payload.data : payload.data?.image || '',
        };
    }

    if (payload.type === 'content' || payload.type === 'markdown' || payload.type === 'extract') {
        return {
            type: 'markdown',
            data: payload.data as ScrapeMarkdownData,
        };
    }

    if (payload.type === 'crawl') {
        return {
            type: 'crawl',
            data: payload.data as CrawlResultData,
        };
    }

    if (payload.type === 'map') {
        return {
            type: 'map',
            data: payload.data as MapResultData,
        };
    }

    return {
        type: payload.type === 'html-js' ? 'html-js' : 'html',
        data: payload.data as ScrapeHtmlData,
    };
}

function parseSseEvent(rawEvent: string): ParsedStreamEvent | null {
    let event: ParsedStreamEvent['event'] = 'message';
    const dataLines: string[] = [];

    for (const line of rawEvent.split('\n')) {
        if (!line) {
            continue;
        }

        if (line.startsWith('event:')) {
            event = line.slice(6).trim() as ParsedStreamEvent['event'];
            continue;
        }

        if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
        }
    }

    if (dataLines.length === 0) {
        return null;
    }

    try {
        return {
            event,
            data: JSON.parse(dataLines.join('\n')),
        };
    } catch {
        return null;
    }
}

interface WebsiteWorkbenchProps {
    tool: WebsiteTool;
}

export function WebsiteWorkbench({ tool }: WebsiteWorkbenchProps) {
    const searchParams = useSearchParams();
    const [url, setUrl] = useState(searchParams.get('url') || 'https://example.com');
    const [outputType, setOutputType] = useState<OutputType>('html');
    const [selector, setSelector] = useState('');
    const [timeout, setTimeoutValue] = useState(30000);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [stealth, setStealth] = useState(true);
    const [crawlLimit, setCrawlLimit] = useState(tool === 'map' ? 75 : 10);
    const [crawlDepth, setCrawlDepth] = useState(1);
    const [includeSubdomains, setIncludeSubdomains] = useState(false);
    const [includeExternal, setIncludeExternal] = useState(false);
    const [useSitemap, setUseSitemap] = useState(true);
    const [result, setResult] = useState<ScrapeResult | null>(null);
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const streamCompletedRef = useRef(false);

    useEffect(() => {
        const nextUrl = searchParams.get('url');
        if (nextUrl) {
            setUrl(nextUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        if (tool === 'map') {
            setCrawlLimit((current) => (current === 10 ? 75 : current));
        }
    }, [tool]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;

        if (startTime) {
            interval = setInterval(() => {
                setElapsedTime(Date.now() - startTime);
            }, 100);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [startTime]);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const finishRun = () => {
        setIsRunning(false);
        setStartTime(null);
        abortControllerRef.current = null;
        setActiveJobId(null);
    };

    const beginRun = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        streamCompletedRef.current = false;
        setResult(null);
        setSteps([]);
        setElapsedTime(0);
        setStartTime(Date.now());
        setIsRunning(true);
        setActiveJobId(null);
    };

    const pushProgress = (payload: ProgressStep) => {
        setSteps((current) => {
            const next = [...current];
            const index = next.findIndex((step) => step.step === payload.step);

            if (index >= 0) {
                next[index] = payload;
            } else {
                next.push(payload);
            }

            return next.sort((left, right) => left.step - right.step);
        });
    };

    const setErrorResult = (message: string) => {
        streamCompletedRef.current = true;
        setResult({
            type: 'error',
            data: message,
        });
    };

    const applyResultPayload = (payload: any) => {
        const nextResult = mapPayloadToResult(payload);
        streamCompletedRef.current = true;
        setResult(nextResult);
    };

    const handleStreamEvent = (parsedEvent: ParsedStreamEvent) => {
        const { event, data } = parsedEvent;

        switch (event) {
            case 'start':
            case 'reconnect':
                if (data?.jobId) {
                    setActiveJobId(data.jobId);
                }
                break;
            case 'progress':
                if (data?.status && data?.step !== undefined) {
                    pushProgress(data as ProgressStep);
                }
                break;
            case 'result':
                applyResultPayload(data);
                break;
            case 'error':
                setErrorResult(data?.error || 'Request failed');
                break;
            case 'cancelled':
                setErrorResult('Job cancelled');
                break;
            case 'done':
                if (data?.cancelled && !streamCompletedRef.current) {
                    setErrorResult('Job cancelled');
                }
                finishRun();
                break;
            default:
                if (data?.status && data?.step !== undefined) {
                    pushProgress(data as ProgressStep);
                } else if (data?.type) {
                    applyResultPayload(data);
                } else if (data?.error) {
                    setErrorResult(data.error);
                }
                break;
        }
    };

    const consumeSseResponse = async (response: Response) => {
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Request failed with ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Streaming response is not available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';

            for (const part of parts) {
                const event = parseSseEvent(part.trim());
                if (event) {
                    handleStreamEvent(event);
                }
            }
        }

        if (buffer.trim()) {
            const event = parseSseEvent(buffer.trim());
            if (event) {
                handleStreamEvent(event);
            }
        }
    };

    const streamQueuedJob = async (jobId: string) => {
        abortControllerRef.current = new AbortController();
        const response = await fetch(`/api/jobs/${jobId}/stream`, {
            method: 'GET',
            headers: {
                Accept: 'text/event-stream',
            },
            cache: 'no-store',
            signal: abortControllerRef.current.signal,
        });

        await consumeSseResponse(response);
    };

    const runScrape = async () => {
        beginRun();

        const response = await fetch('/api/website/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
            },
            body: JSON.stringify({
                url,
                type: outputType === 'markdown' ? 'content' : outputType,
                stealth,
                fullPage: outputType === 'screenshot' ? true : undefined,
                options: {
                    waitForSelector: selector || undefined,
                    timeout,
                },
            }),
            signal: abortControllerRef.current?.signal,
        });

        await consumeSseResponse(response);
    };

    const runCrawl = async () => {
        beginRun();
        pushProgress({
            step: 1,
            total: crawlLimit,
            message: 'Queueing crawl job',
            status: 'active',
        });

        const response = await fetch('/api/website/crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                limit: crawlLimit,
                maxDepth: crawlDepth,
                includeSubdomains,
                waitForSelector: selector || undefined,
                timeout,
                stealth,
            }),
            signal: abortControllerRef.current?.signal,
        });

        const payload = await response.json();

        if (!response.ok || !payload?.success || !payload?.job?.id) {
            throw new Error(payload?.error || 'Failed to enqueue crawl job');
        }

        setActiveJobId(payload.job.id);
        pushProgress({
            step: 1,
            total: crawlLimit,
            message: 'Crawl job queued',
            status: 'completed',
        });

        await streamQueuedJob(payload.job.id);
    };

    const runMap = async () => {
        beginRun();
        pushProgress({
            step: 1,
            total: 2,
            message: 'Discovering links',
            status: 'active',
        });

        const response = await fetch('/api/website/map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                limit: crawlLimit,
                includeSubdomains,
                includeExternal,
                useSitemap,
                waitForSelector: selector || undefined,
                timeout,
                stealth,
            }),
            signal: abortControllerRef.current?.signal,
        });

        const payload = await response.json();

        if (!response.ok || !payload?.success) {
            throw new Error(payload?.error || 'Map request failed');
        }

        pushProgress({
            step: 1,
            total: 2,
            message: 'Links discovered',
            status: 'completed',
        });
        pushProgress({
            step: 2,
            total: 2,
            message: 'Map ready',
            status: 'completed',
        });
        applyResultPayload(payload);
        finishRun();
    };

    const handleRun = async () => {
        try {
            if (tool === 'scrape') {
                await runScrape();
                return;
            }

            if (tool === 'crawl') {
                await runCrawl();
                return;
            }

            await runMap();
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                setErrorResult('Request cancelled');
            } else {
                setErrorResult(error instanceof Error ? error.message : 'Request failed');
            }
            finishRun();
        }
    };

    const handleStop = async () => {
        if (activeJobId) {
            try {
                await fetch(`/api/jobs/${activeJobId}/cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch {
                // Fall back to a local abort below.
            }
        }

        abortControllerRef.current?.abort();
        setErrorResult(tool === 'map' ? 'Map request cancelled' : 'Job cancelled');
        finishRun();
    };

    return (
        <div className="space-y-6">
            <ScraperHeader
                tool={tool}
                currentUrl={url}
                elapsedTime={elapsedTime}
                isPending={isRunning}
                result={result}
            />

            <div className="grid items-start gap-6 xl:grid-cols-12">
                <ConfigurationPanel
                    url={url}
                    setUrl={setUrl}
                    tool={tool}
                    outputType={outputType}
                    setOutputType={setOutputType}
                    selector={selector}
                    setSelector={setSelector}
                    timeout={timeout}
                    setTimeoutValue={setTimeoutValue}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    stealth={stealth}
                    setStealth={setStealth}
                    crawlLimit={crawlLimit}
                    setCrawlLimit={setCrawlLimit}
                    crawlDepth={crawlDepth}
                    setCrawlDepth={setCrawlDepth}
                    includeSubdomains={includeSubdomains}
                    setIncludeSubdomains={setIncludeSubdomains}
                    includeExternal={includeExternal}
                    setIncludeExternal={setIncludeExternal}
                    useSitemap={useSitemap}
                    setUseSitemap={setUseSitemap}
                    isPending={isRunning}
                    onRun={handleRun}
                    onStop={handleStop}
                />

                <ResultsPanel
                    tool={tool}
                    result={result}
                    isStreaming={isRunning}
                    isPending={isRunning}
                    steps={steps}
                    elapsedTime={elapsedTime}
                    onRetry={handleRun}
                />
            </div>
        </div>
    );
}
