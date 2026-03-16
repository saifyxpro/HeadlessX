
'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleSerpHeader } from '@/components/playground/google-serp/GoogleSerpHeader';
import { ConfigurationPanel } from '@/components/playground/google-serp/ConfigurationPanel';
import { ResultsPanel } from '@/components/playground/google-serp/ResultsPanel';
import { WorkbenchLayout } from '@/components/playground/shared';
import { SearchResponse, ProgressStep } from '@/components/playground/google-serp/types';

type ParsedSerpStreamEvent = {
    event: 'start' | 'progress' | 'result' | 'error' | 'end' | 'message';
    data: any;
};

const INITIAL_STEPS: ProgressStep[] = [];

const parseSseEvent = (rawEvent: string): ParsedSerpStreamEvent | null => {
    let event: ParsedSerpStreamEvent['event'] = 'message';
    const dataLines: string[] = [];

    for (const line of rawEvent.split('\n')) {
        if (!line) {
            continue;
        }

        if (line.startsWith('event:')) {
            event = line.slice(6).trim() as ParsedSerpStreamEvent['event'];
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
            data: JSON.parse(dataLines.join('\n'))
        };
    } catch {
        return null;
    }
};

export default function GoogleSerpPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [data, setData] = useState<SearchResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeout, setTimeout] = useState<number>(60);
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Timer Ref
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Timer Logic
    useEffect(() => {
        if (isLoading) {
            const currentStartTime = Date.now();
            setStartTime(currentStartTime);
            setElapsedTime(0);
            timerRef.current = setInterval(() => {
                setElapsedTime(Date.now() - currentStartTime);
            }, 100);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (data && startTime) {
                setElapsedTime(Date.now() - startTime);
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            abortControllerRef.current?.abort();
        };
    }, [isLoading, data]);

    const stopSearch = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsLoading(false);
        setIsStreaming(false);
        setError('Search cancelled');
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);
        setData(null);
        setSteps([]);

        try {
            const encodedQuery = encodeURIComponent(query);
            const streamUrl = `/api/google-serp/stream?query=${encodedQuery}&timeout=${timeout}`;

            // Use fetch + ReadableStream instead of EventSource for better SSE handling
            const response = await fetch(streamUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                },
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            let buffer = '';
            let receivedTerminalEvent = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');

                let separatorIndex = buffer.indexOf('\n\n');
                while (separatorIndex !== -1) {
                    const rawEvent = buffer.slice(0, separatorIndex);
                    buffer = buffer.slice(separatorIndex + 2);

                    const parsedEvent = parseSseEvent(rawEvent);
                    if (!parsedEvent) {
                        separatorIndex = buffer.indexOf('\n\n');
                        continue;
                    }

                    console.log('📊 SSE Data:', parsedEvent.event, parsedEvent.data);

                    if (parsedEvent.event === 'progress' || (parsedEvent.event === 'message' && parsedEvent.data?.status)) {
                        const progress = parsedEvent.data;
                        if (progress.step !== undefined) {
                            setSteps(prev => {
                                const newSteps = [...prev];
                                const idx = progress.step - 1;
                                newSteps[idx] = {
                                    step: progress.step,
                                    total: progress.total,
                                    message: progress.message,
                                    status: progress.status as 'active' | 'completed' | 'pending' | 'error'
                                };
                                return newSteps.sort((a, b) => a.step - b.step);
                            });
                        }
                    }

                    if (parsedEvent.event === 'result' || (parsedEvent.event === 'message' && parsedEvent.data?.success && parsedEvent.data?.data)) {
                        const result = parsedEvent.data;
                        setData(result.data);
                        setIsLoading(false);
                        setIsStreaming(false);
                        receivedTerminalEvent = true;
                    }

                    if (parsedEvent.event === 'error' || (parsedEvent.event === 'message' && parsedEvent.data?.error)) {
                        const message = parsedEvent.data?.error || 'Connection failed';
                        setError(message);
                        setIsLoading(false);
                        setIsStreaming(false);
                        receivedTerminalEvent = true;
                    }

                    if (parsedEvent.event === 'end' && !receivedTerminalEvent) {
                        setError('Stream finished without a result');
                        setIsLoading(false);
                        setIsStreaming(false);
                        receivedTerminalEvent = true;
                    }

                    separatorIndex = buffer.indexOf('\n\n');
                }
            }

            if (!receivedTerminalEvent) {
                setError('Connection closed before a result was returned');
            }
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        } catch (err: any) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            console.error('Stream error:', err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Connection failed');
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <WorkbenchLayout
            header={
                <GoogleSerpHeader
                    elapsedTime={elapsedTime}
                    isLoading={isLoading}
                    hasResult={!!data}
                    error={error}
                />
            }
            config={
                <ConfigurationPanel
                        query={query}
                        setQuery={setQuery}
                        timeout={timeout}
                        setTimeout={setTimeout}
                        onSearch={handleSearch}
                        onStop={stopSearch}
                        isLoading={isLoading}
                />
            }
            results={
                <ResultsPanel
                        data={data}
                        isStreaming={isStreaming}
                        isPending={isLoading && !isStreaming}
                        error={error}
                        steps={steps}
                        elapsedTime={elapsedTime}
                        onRetry={handleSearch}
                />
            }
            gridClassName="grid-cols-1 lg:grid-cols-12 gap-8"
        />
    );
}
