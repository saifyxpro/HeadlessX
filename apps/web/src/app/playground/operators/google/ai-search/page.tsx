'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkbenchLayout } from '@/components/playground/shared';
import { ConfigurationPanel } from '@/components/playground/google/ConfigurationPanel';
import { GoogleSerpHeader } from '@/components/playground/google/GoogleSerpHeader';
import { ResultsPanel } from '@/components/playground/google/ResultsPanel';
import type {
    GoogleCookieStatus,
    ProgressStep,
    SearchResponse,
} from '@/components/playground/google/types';

type ParsedGoogleEvent = {
    event: 'start' | 'progress' | 'result' | 'error' | 'end' | 'message';
    data: unknown;
};

type GoogleApiPayload<T> = {
    success?: boolean;
    data?: T;
    error?: string;
    code?: string;
    details?: GoogleCookieStatus;
};

class GoogleOperatorRequestError extends Error {
    public readonly code?: string;
    public readonly details?: GoogleCookieStatus;

    constructor(message: string, code?: string, details?: GoogleCookieStatus) {
        super(message);
        this.name = 'GoogleOperatorRequestError';
        this.code = code;
        this.details = details;
    }
}

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

async function readGoogleApiPayload<T>(response: Response): Promise<GoogleApiPayload<T>> {
    try {
        return (await response.json()) as GoogleApiPayload<T>;
    } catch {
        return {
            success: false,
            error: `HTTP ${response.status}`,
        };
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
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [cookieStatus, setCookieStatus] = useState<GoogleCookieStatus | null>(null);
    const [isCookieStatusPending, setIsCookieStatusPending] = useState(true);
    const [isCookieActionPending, setIsCookieActionPending] = useState(false);
    const [cookieError, setCookieError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const terminalEventReceivedRef = useRef(false);

    const searchEnabled = Boolean(cookieStatus?.ready && !cookieStatus?.running);

    useEffect(() => {
        if (!isLoading) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (startTimeRef.current !== null) {
                setElapsedTime(Date.now() - startTimeRef.current);
            }
            return;
        }

        const currentStartTime = Date.now();
        startTimeRef.current = currentStartTime;
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
    }, [isLoading]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            startTimeRef.current = null;
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
        };
    }, []);

    const refreshCookieStatus = useCallback(async (silent = false) => {
        if (!silent) {
            setIsCookieStatusPending(true);
        }

        try {
            const response = await fetch('/api/operators/google/ai-search/cookies/status', {
                method: 'GET',
                cache: 'no-store',
            });
            const payload = await readGoogleApiPayload<GoogleCookieStatus>(response);

            if (!response.ok || !payload.success || !payload.data) {
                throw new GoogleOperatorRequestError(
                    payload.error || `HTTP ${response.status}`,
                    payload.code,
                    payload.details
                );
            }

            setCookieStatus(payload.data);
            setCookieError(null);
        } catch (statusError) {
            const message = statusError instanceof Error ? statusError.message : 'Failed to check Google cookie status';
            setCookieError(message);
            if (statusError instanceof GoogleOperatorRequestError && statusError.details) {
                setCookieStatus(statusError.details);
            }
        } finally {
            setIsCookieStatusPending(false);
        }
    }, []);

    useEffect(() => {
        void refreshCookieStatus();
    }, [refreshCookieStatus]);

    useEffect(() => {
        if (!cookieStatus?.running) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void refreshCookieStatus(true);
        }, 2500);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [cookieStatus?.running, refreshCookieStatus]);

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

    const handleCookieAction = useCallback(async (action: 'build' | 'stop') => {
        setIsCookieActionPending(true);
        setCookieError(null);
        setError(null);
        setData(null);
        setSteps([]);

        try {
            const response = await fetch(`/api/operators/google/ai-search/cookies/${action}`, {
                method: 'POST',
                cache: 'no-store',
            });
            const payload = await readGoogleApiPayload<GoogleCookieStatus>(response);

            if (!response.ok || !payload.success || !payload.data) {
                throw new GoogleOperatorRequestError(
                    payload.error || `HTTP ${response.status}`,
                    payload.code,
                    payload.details
                );
            }

            setCookieStatus(payload.data);
        } catch (actionError) {
            const message = actionError instanceof Error ? actionError.message : 'Cookie action failed';
            setCookieError(message);
            if (actionError instanceof GoogleOperatorRequestError && actionError.details) {
                setCookieStatus(actionError.details);
            }
        } finally {
            setIsCookieActionPending(false);
            await refreshCookieStatus(true);
        }
    }, [refreshCookieStatus]);

    const handleStreamEvent = (parsedEvent: ParsedGoogleEvent) => {
        const payload = (parsedEvent.data ?? null) as Record<string, unknown> | null;

        if (
            parsedEvent.event === 'progress' ||
            (parsedEvent.event === 'message' && payload?.status)
        ) {
            const progress = payload;
            if (progress?.step !== undefined) {
                applyProgress({
                    step: Number(progress.step),
                    total: Number(progress.total),
                    message: String(progress.message ?? ''),
                    status: progress.status as ProgressStep['status'],
                });
            }
            return;
        }

        if (
            parsedEvent.event === 'result' ||
            (parsedEvent.event === 'message' && payload?.success && payload?.data)
        ) {
            const result = payload as { data?: SearchResponse } | null;
            if (result?.data) {
                setData(result.data);
            }
            terminalEventReceivedRef.current = true;
            finishRun();
            return;
        }

        if (parsedEvent.event === 'error' || (parsedEvent.event === 'message' && payload?.error)) {
            const details = payload?.details as GoogleCookieStatus | undefined;
            if (details) {
                setCookieStatus(details);
            }

            setError(typeof payload?.error === 'string' ? payload.error : 'Connection failed');
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
        if (!query.trim() || !searchEnabled) {
            return;
        }

        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        terminalEventReceivedRef.current = false;
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);
        setCookieError(null);
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
                const payload = await readGoogleApiPayload<never>(response);
                throw new GoogleOperatorRequestError(
                    payload.error || `HTTP ${response.status}`,
                    payload.code,
                    payload.details
                );
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
                if (streamError instanceof GoogleOperatorRequestError && streamError.details) {
                    setCookieStatus(streamError.details);
                }

                if (
                    streamError instanceof GoogleOperatorRequestError &&
                    (streamError.code === 'GOOGLE_COOKIE_BOOTSTRAP_REQUIRED' ||
                        streamError.code === 'GOOGLE_COOKIE_BOOTSTRAP_ACTIVE')
                ) {
                    await refreshCookieStatus(true);
                }

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
                    cookieStatus={cookieStatus}
                    isCookieStatusPending={isCookieStatusPending}
                    isCookieActionPending={isCookieActionPending}
                    onBuildCookies={() => {
                        void handleCookieAction('build');
                    }}
                    onStopCookies={() => {
                        void handleCookieAction('stop');
                    }}
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
                    searchEnabled={searchEnabled}
                    cookieStatus={cookieStatus}
                    isCookieStatusPending={isCookieStatusPending}
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
                    cookieStatus={cookieStatus}
                    isCookieStatusPending={isCookieStatusPending}
                    isCookieActionPending={isCookieActionPending}
                    cookieError={cookieError}
                    onBuildCookies={() => {
                        void handleCookieAction('build');
                    }}
                    onStopCookies={() => {
                        void handleCookieAction('stop');
                    }}
                />
            }
        />
    );
}
