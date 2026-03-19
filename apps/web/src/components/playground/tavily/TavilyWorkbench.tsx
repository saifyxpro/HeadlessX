'use client';

import { useEffect, useRef, useState } from 'react';
import { TavilyHeader } from './TavilyHeader';
import { ConfigurationPanel } from './config/ConfigurationPanel';
import { ResultsPanel } from './results/ResultsPanel';
import { WorkbenchLayout } from '../shared';
import type {
    TavilyCitationFormat,
    TavilyRawContentMode,
    TavilyResearchModel,
    TavilyResearchResponse,
    TavilySearchDepth,
    TavilySearchResponse,
    TavilyTool,
    TavilyTopic,
} from './types';
import { getTavilyErrorMessage, normalizeResearchRequestId, normalizeResearchStatus, parseDomainList } from './utils';

interface TavilyWorkbenchProps {
    available: boolean;
}

type TavilyStorageState = {
    tool?: TavilyTool;
    searchQuery?: string;
    researchQuery?: string;
    searchDepth?: TavilySearchDepth;
    topic?: TavilyTopic;
    maxResults?: number;
    includeAnswer?: boolean;
    includeImages?: boolean;
    includeRawContent?: TavilyRawContentMode;
    includeDomains?: string;
    excludeDomains?: string;
    model?: TavilyResearchModel;
    citationFormat?: TavilyCitationFormat;
    researchTimeout?: number;
    showAdvanced?: boolean;
};

const STORAGE_KEY = 'headlessx.playground.tavily';

export function TavilyWorkbench({ available }: TavilyWorkbenchProps) {
    const [tool, setTool] = useState<TavilyTool>('search');
    const [searchQuery, setSearchQuery] = useState('What changed in Next.js this month?');
    const [researchQuery, setResearchQuery] = useState('Research the latest browser automation trends and summarize the most important changes.');
    const [searchDepth, setSearchDepth] = useState<TavilySearchDepth>('basic');
    const [topic, setTopic] = useState<TavilyTopic>('general');
    const [maxResults, setMaxResults] = useState(5);
    const [includeAnswer, setIncludeAnswer] = useState(true);
    const [includeImages, setIncludeImages] = useState(false);
    const [includeRawContent, setIncludeRawContent] = useState<TavilyRawContentMode>('markdown');
    const [includeDomains, setIncludeDomains] = useState('');
    const [excludeDomains, setExcludeDomains] = useState('');
    const [model, setModel] = useState<TavilyResearchModel>('auto');
    const [citationFormat, setCitationFormat] = useState<TavilyCitationFormat>('numbered');
    const [researchTimeout, setResearchTimeout] = useState(90);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [searchResult, setSearchResult] = useState<TavilySearchResponse | null>(null);
    const [researchResult, setResearchResult] = useState<TavilyResearchResponse | null>(null);
    const [researchRequestId, setResearchRequestId] = useState<string | null>(null);
    const [researchStatus, setResearchStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const storageHydratedRef = useRef(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                storageHydratedRef.current = true;
                return;
            }

            const parsed = JSON.parse(raw) as TavilyStorageState;
            if (parsed.tool) setTool(parsed.tool);
            if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
            if (parsed.researchQuery) setResearchQuery(parsed.researchQuery);
            if (parsed.searchDepth) setSearchDepth(parsed.searchDepth);
            if (parsed.topic) setTopic(parsed.topic);
            if (typeof parsed.maxResults === 'number') setMaxResults(parsed.maxResults);
            if (typeof parsed.includeAnswer === 'boolean') setIncludeAnswer(parsed.includeAnswer);
            if (typeof parsed.includeImages === 'boolean') setIncludeImages(parsed.includeImages);
            if (parsed.includeRawContent !== undefined) setIncludeRawContent(parsed.includeRawContent);
            if (parsed.includeDomains !== undefined) setIncludeDomains(parsed.includeDomains);
            if (parsed.excludeDomains !== undefined) setExcludeDomains(parsed.excludeDomains);
            if (parsed.model) setModel(parsed.model);
            if (parsed.citationFormat) setCitationFormat(parsed.citationFormat);
            if (typeof parsed.researchTimeout === 'number') setResearchTimeout(parsed.researchTimeout);
            if (typeof parsed.showAdvanced === 'boolean') setShowAdvanced(parsed.showAdvanced);
        } catch {
            // Ignore invalid persisted state.
        } finally {
            storageHydratedRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (!storageHydratedRef.current) {
            return;
        }

        const nextState: TavilyStorageState = {
            tool,
            searchQuery,
            researchQuery,
            searchDepth,
            topic,
            maxResults,
            includeAnswer,
            includeImages,
            includeRawContent,
            includeDomains,
            excludeDomains,
            model,
            citationFormat,
            researchTimeout,
            showAdvanced,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }, [
        citationFormat,
        excludeDomains,
        includeAnswer,
        includeDomains,
        includeImages,
        includeRawContent,
        maxResults,
        model,
        researchQuery,
        researchTimeout,
        searchDepth,
        searchQuery,
        showAdvanced,
        tool,
        topic,
    ]);

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

    const resetRunState = () => {
        setIsPending(false);
        setStartTime(null);
        abortControllerRef.current = null;
    };

    const stopCurrentRun = () => {
        abortControllerRef.current?.abort();
        setError(tool === 'search' ? 'Search cancelled' : 'Research cancelled');
        resetRunState();
    };

    const beginRun = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        setIsPending(true);
        setError(null);
        setElapsedTime(0);
        setStartTime(Date.now());
    };

    const postJson = async (path: string, body: unknown, signal: AbortSignal) => {
        const response = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
            throw new Error(getTavilyErrorMessage(payload));
        }

        return payload.data;
    };

    const getJson = async (path: string, signal: AbortSignal) => {
        const response = await fetch(path, { method: 'GET', signal });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
            throw new Error(getTavilyErrorMessage(payload));
        }

        return payload.data;
    };

    const runSearch = async () => {
        beginRun();
        setSearchResult(null);
        setResearchResult(null);
        setResearchRequestId(null);
        setResearchStatus(null);

        try {
            const data = await postJson('/api/operators/tavily/search', {
                query: searchQuery,
                searchDepth,
                topic,
                maxResults,
                includeAnswer,
                includeImages,
                includeRawContent,
                includeDomains: parseDomainList(includeDomains),
                excludeDomains: parseDomainList(excludeDomains),
            }, abortControllerRef.current!.signal);

            setSearchResult(data);
            resetRunState();
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return;
            }

            setError(error instanceof Error ? error.message : 'Search failed');
            resetRunState();
        }
    };

    const pollResearch = async (requestId: string, signal: AbortSignal) => {
        while (!signal.aborted) {
            const data = await getJson(`/api/operators/tavily/research/${encodeURIComponent(requestId)}`, signal);
            const status = normalizeResearchStatus(data.status);
            setResearchResult(data);
            setResearchStatus(status);

            if (status === 'completed' || status === 'failed') {
                return;
            }

            await new Promise((resolve, reject) => {
                const timer = window.setTimeout(resolve, 1500);
                signal.addEventListener('abort', () => {
                    window.clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                }, { once: true });
            });
        }
    };

    const runResearch = async () => {
        beginRun();
        setSearchResult(null);
        setResearchResult(null);
        setResearchRequestId(null);
        setResearchStatus('pending');

        try {
            const start = await postJson('/api/operators/tavily/research', {
                query: researchQuery,
                model,
                citationFormat,
                timeout: researchTimeout,
            }, abortControllerRef.current!.signal);

            const nextRequestId = normalizeResearchRequestId(start);
            if (!nextRequestId) {
                throw new Error('Tavily research request did not return a request ID');
            }

            setResearchRequestId(nextRequestId);
            setResearchStatus(normalizeResearchStatus(start.status));
            await pollResearch(nextRequestId, abortControllerRef.current!.signal);
            resetRunState();
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return;
            }

            setError(error instanceof Error ? error.message : 'Research failed');
            resetRunState();
        }
    };

    return (
        <WorkbenchLayout
            header={
                <TavilyHeader
                available={available}
                tool={tool}
                onToolChange={setTool}
                elapsedTime={elapsedTime}
                isPending={isPending}
                hasResult={tool === 'search' ? Boolean(searchResult) : Boolean(researchResult)}
                hasError={Boolean(error)}
                />
            }
            config={
                <ConfigurationPanel
                    available={available}
                    tool={tool}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    researchQuery={researchQuery}
                    onResearchQueryChange={setResearchQuery}
                    searchDepth={searchDepth}
                    onSearchDepthChange={setSearchDepth}
                    topic={topic}
                    onTopicChange={setTopic}
                    maxResults={maxResults}
                    onMaxResultsChange={setMaxResults}
                    includeAnswer={includeAnswer}
                    onIncludeAnswerChange={setIncludeAnswer}
                    includeImages={includeImages}
                    onIncludeImagesChange={setIncludeImages}
                    includeRawContent={includeRawContent}
                    onIncludeRawContentChange={setIncludeRawContent}
                    includeDomains={includeDomains}
                    onIncludeDomainsChange={setIncludeDomains}
                    excludeDomains={excludeDomains}
                    onExcludeDomainsChange={setExcludeDomains}
                    model={model}
                    onModelChange={setModel}
                    citationFormat={citationFormat}
                    onCitationFormatChange={setCitationFormat}
                    researchTimeout={researchTimeout}
                    onResearchTimeoutChange={setResearchTimeout}
                    showAdvanced={showAdvanced}
                    onShowAdvancedChange={setShowAdvanced}
                    isPending={isPending}
                    onRun={tool === 'search' ? runSearch : runResearch}
                    onStop={stopCurrentRun}
                />
            }
            results={
                <ResultsPanel
                    tool={tool}
                    available={available}
                    query={tool === 'search' ? searchQuery : researchQuery}
                    searchResult={searchResult}
                    researchResult={researchResult}
                    researchRequestId={researchRequestId}
                    researchStatus={researchStatus}
                    error={error}
                    isPending={isPending}
                    elapsedTime={elapsedTime}
                />
            }
        />
    );
}
