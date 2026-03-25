'use client';

import { useEffect, useRef, useState } from 'react';
import { ConfigurationPanel } from './config';
import { ResultsPanel } from './results';
import { ScraperHeader } from './ScraperHeader';
import { WorkbenchLayout } from '../shared';
import { useWebsiteStorage } from './hooks/useWebsiteStorage';
import { mapPayloadToResult, normalizeTargetUrl, parseSseEvent, type ParsedStreamEvent } from './shared/stream';
import type { OutputType, ProgressStep, ScrapeResult, WebsiteTool } from './types';

interface WebsiteWorkbenchProps {
    tool: WebsiteTool;
}

export function WebsiteWorkbench({ tool }: WebsiteWorkbenchProps) {
    const [url, setUrl] = useState('https://example.com');
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
    const [crawlEntireDomain, setCrawlEntireDomain] = useState(true);
    const [ignoreQueryParameters, setIgnoreQueryParameters] = useState(tool === 'map');
    const [includePaths, setIncludePaths] = useState('');
    const [excludePaths, setExcludePaths] = useState('');
    const [result, setResult] = useState<ScrapeResult | null>(null);
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const streamSettledRef = useRef(false);
    const { lastUsedUrl } = useWebsiteStorage({
        tool,
        url,
        setUrl,
        outputType,
        setOutputType,
        showAdvanced,
        setShowAdvanced,
        selector,
        setSelector,
        timeout,
        setTimeoutValue,
        stealth,
        setStealth,
        crawlLimit,
        setCrawlLimit,
        crawlDepth,
        setCrawlDepth,
        includeSubdomains,
        setIncludeSubdomains,
        includeExternal,
        setIncludeExternal,
        useSitemap,
        setUseSitemap,
        crawlEntireDomain,
        setCrawlEntireDomain,
        ignoreQueryParameters,
        setIgnoreQueryParameters,
        includePaths,
        setIncludePaths,
        excludePaths,
        setExcludePaths,
    });

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
        streamSettledRef.current = false;
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
        streamSettledRef.current = true;
        setResult({
            type: 'error',
            data: message,
        });
    };

    const applyResultPayload = (payload: unknown) => {
        const nextResult = mapPayloadToResult(payload);
        streamSettledRef.current = true;
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
                if (data?.cancelled && !streamSettledRef.current) {
                    setErrorResult('Job cancelled');
                }
                streamSettledRef.current = true;
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

        if (!abortControllerRef.current?.signal.aborted && !streamSettledRef.current) {
            throw new Error('Streaming connection closed before the request finished');
        }
    };

    const streamQueuedJob = async (jobId: string) => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
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
                finishRun();
                return;
            } catch (error) {
                if ((error as Error).name === 'AbortError' || abortControllerRef.current.signal.aborted) {
                    throw error;
                }

                if (streamSettledRef.current) {
                    finishRun();
                    return;
                }

                if (attempt === 2) {
                    throw error;
                }

                pushProgress({
                    step: 2,
                    total: Math.max(crawlLimit, 2),
                    message: `Connection dropped, reconnecting to crawl updates (${attempt + 1}/2)`,
                    status: 'active',
                });
            }
        }
    };

    const runScrapeWithUrl = async (targetUrl: string) => {
        beginRun();

        const response = await fetch('/api/operators/website/scrape/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
            },
            body: JSON.stringify({
                url: targetUrl,
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
        finishRun();
    };

    const parsePatternInput = (value: string) => value
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean);

    const runCrawlWithUrl = async (targetUrl: string) => {
        beginRun();
        const clientJobId = crypto.randomUUID();
        setActiveJobId(clientJobId);
        pushProgress({
            step: 1,
            total: Math.max(crawlLimit, 2),
            message: 'Queueing crawl job',
            status: 'active',
        });

        const response = await fetch('/api/operators/website/crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: targetUrl,
                jobId: clientJobId,
                limit: crawlLimit,
                maxDepth: crawlDepth,
                includeSubdomains,
                includeExternal,
                includePaths: parsePatternInput(includePaths),
                excludePaths: parsePatternInput(excludePaths),
                crawlEntireDomain,
                ignoreQueryParameters,
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
            total: Math.max(crawlLimit, 2),
            message: 'Crawl job queued, waiting for worker',
            status: 'completed',
        });

        await streamQueuedJob(payload.job.id);
    };

    const runMapWithUrl = async (targetUrl: string) => {
        beginRun();
        const response = await fetch('/api/operators/website/map/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
            },
            body: JSON.stringify({
                url: targetUrl,
                limit: crawlLimit,
                maxDiscoveryDepth: crawlDepth,
                includeSubdomains,
                includeExternal,
                useSitemap,
                includePaths: parsePatternInput(includePaths),
                excludePaths: parsePatternInput(excludePaths),
                crawlEntireDomain,
                ignoreQueryParameters,
                waitForSelector: selector || undefined,
                stealth,
            }),
            signal: abortControllerRef.current?.signal,
        });
        await consumeSseResponse(response);
        finishRun();
    };

    const handleRun = async () => {
        const normalizedUrl = normalizeTargetUrl(url);
        if (normalizedUrl !== url) {
            setUrl(normalizedUrl);
        }

        try {
            if (tool === 'scrape') {
                await runScrapeWithUrl(normalizedUrl);
                return;
            }

            if (tool === 'crawl') {
                await runCrawlWithUrl(normalizedUrl);
                return;
            }

            await runMapWithUrl(normalizedUrl);
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
        <WorkbenchLayout
            header={
                <ScraperHeader
                tool={tool}
                currentUrl={url}
                elapsedTime={elapsedTime}
                isPending={isRunning}
                result={result}
                />
            }
            config={
                <ConfigurationPanel
                    url={url}
                    setUrl={setUrl}
                    lastUsedUrl={lastUsedUrl}
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
                    crawlEntireDomain={crawlEntireDomain}
                    setCrawlEntireDomain={setCrawlEntireDomain}
                    ignoreQueryParameters={ignoreQueryParameters}
                    setIgnoreQueryParameters={setIgnoreQueryParameters}
                    includePaths={includePaths}
                    setIncludePaths={setIncludePaths}
                    excludePaths={excludePaths}
                    setExcludePaths={setExcludePaths}
                    isPending={isRunning}
                    onRun={handleRun}
                    onStop={handleStop}
                />
            }
            results={
                <ResultsPanel
                    tool={tool}
                    result={result}
                    isStreaming={isRunning}
                    isPending={isRunning}
                    steps={steps}
                    elapsedTime={elapsedTime}
                    onRetry={handleRun}
                />
            }
        />
    );
}
