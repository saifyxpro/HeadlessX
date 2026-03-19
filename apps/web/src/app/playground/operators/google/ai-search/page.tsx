'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkbenchLayout } from '@/components/playground/shared';
import { ConfigurationPanel } from '@/components/playground/google/ConfigurationPanel';
import { GoogleSerpHeader } from '@/components/playground/google/GoogleSerpHeader';
import { ResultsPanel } from '@/components/playground/google/ResultsPanel';
import type { ProgressStep, SearchResponse } from '@/components/playground/google/types';

type ParsedGoogleEvent = {
    event: 'start' | 'progress' | 'result' | 'error' | 'end' | 'message';
    data: any;
};

function parseSseEvent(rawEvent: string): ParsedGoogleEvent | null {
    let event: ParsedGoogleEvent['event'] = 'message';
    const dataLines: string[] = [];

    for (const line of rawEvent.split('\n')) {
        if (!line) {
            continue;
        }

        if (line.startsWith('event:')) {
            event = line.slice(6).trim() as ParsedGoogleEvent['event'];
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

export default function GoogleAiSearchPage() {
    const [query, setQuery] = useState('');
    const [region, setRegion] = useState('');
    const [language, setLanguage] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    const [timeout, setTimeoutValue] = useState(60);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [data, setData] = useState<SearchResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const terminalEventReceivedRef = useRef(false);

    useEffect(() => {
        if (!isLoading) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (startTime) {
                setElapsedTime(Date.now() - startTime);
            }
            return;
        }

        const currentStartTime = Date.now();
        setStartTime(currentStartTime);
        setElapsedTime(0);
        timerRef.current = setInterval(() => {
            setElapsedTime(Date.now() - currentStartTime);
        }, 100);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isLoading, startTime]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
        };
    }, []);

    const finishRun = () => {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
    };

    const stopSearch = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsLoading(false);
        setIsStreaming(false);
        setError('Search cancelled');
    };

    const applyProgress = (step: ProgressStep) => {
        setSteps((current) => {
            const next = [...current];
            const index = next.findIndex((entry) => entry.step === step.step);

            if (index >= 0) {
                next[index] = step;
            } else {
                next.push(step);
            }

            return next.sort((left, right) => left.step - right.step);
        });
    };

    const handleStreamEvent = (parsedEvent: ParsedGoogleEvent) => {
        if (
            parsedEvent.event === 'progress' ||
            (parsedEvent.event === 'message' && parsedEvent.data?.status)
        ) {
            const progress = parsedEvent.data;
            if (progress?.step !== undefined) {
                applyProgress({
                    step: progress.step,
                    total: progress.total,
                    message: progress.message,
                    status: progress.status as ProgressStep['status'],
                });
            }
            return;
        }

        if (
            parsedEvent.event === 'result' ||
            (parsedEvent.event === 'message' && parsedEvent.data?.success && parsedEvent.data?.data)
        ) {
            const result = parsedEvent.data;
            setData(result.data);
            terminalEventReceivedRef.current = true;
            finishRun();
            return;
        }

        if (parsedEvent.event === 'error' || (parsedEvent.event === 'message' && parsedEvent.data?.error)) {
            setError(parsedEvent.data?.error || 'Connection failed');
            terminalEventReceivedRef.current = true;
            finishRun();
            return;
        }

        if (parsedEvent.event === 'end' && !terminalEventReceivedRef.current) {
            setError('Stream finished without a result');
            terminalEventReceivedRef.current = true;
            finishRun();
        }
    };

    const handleSearch = async (event?: React.FormEvent) => {
        event?.preventDefault();
        if (!query.trim()) {
            return;
        }

        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        terminalEventReceivedRef.current = false;
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);
        setData(null);
        setSteps([]);

        try {
            const params = new URLSearchParams({
                query,
                timeout: String(timeout),
            });

            if (region) {
                params.set('gl', region);
            }

            if (language) {
                params.set('hl', language);
            }

            if (timeFilter) {
                params.set('tbs', timeFilter);
            }

            const response = await fetch(`/api/operators/google/ai-search/stream?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream',
                },
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    const trailingEvent = parseSseEvent(buffer.trim());
                    if (trailingEvent) {
                        handleStreamEvent(trailingEvent);
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');

                let separatorIndex = buffer.indexOf('\n\n');
                while (separatorIndex !== -1) {
                    const rawEvent = buffer.slice(0, separatorIndex).trim();
                    buffer = buffer.slice(separatorIndex + 2);

                    if (rawEvent) {
                        const parsedEvent = parseSseEvent(rawEvent);
                        if (parsedEvent) {
                            handleStreamEvent(parsedEvent);
                        }
                    }

                    separatorIndex = buffer.indexOf('\n\n');
                }
            }

            if (!terminalEventReceivedRef.current) {
                setError('Search finished without a final result');
                finishRun();
            }
        } catch (streamError) {
            if ((streamError as Error).name === 'AbortError') {
                setError('Search cancelled');
            } else {
                setError(streamError instanceof Error ? streamError.message : 'Request failed');
            }

            finishRun();
        }
    };

    return (
        <WorkbenchLayout
            header={
                <GoogleSerpHeader
                    elapsedTime={elapsedTime}
                    isLoading={isLoading}
                    hasResult={Boolean(data)}
                    error={error}
                />
            }
            config={
                <ConfigurationPanel
                    query={query}
                    setQuery={setQuery}
                    region={region}
                    setRegion={setRegion}
                    language={language}
                    setLanguage={setLanguage}
                    timeFilter={timeFilter}
                    setTimeFilter={setTimeFilter}
                    timeout={timeout}
                    setTimeout={setTimeoutValue}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    onSearch={handleSearch}
                    onStop={stopSearch}
                    isLoading={isLoading}
                />
            }
            results={
                <ResultsPanel
                    data={data}
                    isStreaming={isStreaming}
                    isPending={isLoading}
                    error={error}
                    steps={steps}
                    elapsedTime={elapsedTime}
                    onRetry={handleSearch}
                />
            }
        />
    );
}
