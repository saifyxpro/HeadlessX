'use client';

import { useEffect, useRef, useState } from 'react';
import { ExaHeader } from './ExaHeader';
import { ConfigurationPanel } from './config/ConfigurationPanel';
import { ResultsPanel } from './results/ResultsPanel';
import type { ExaCategory, ExaContentMode, ExaProgressStep, ExaSearchResponse, ExaSearchType } from './types';
import { getExaErrorMessage, mergeProgressStep, parseDomainList, parseSseEvent } from './utils';
import { WorkbenchLayout } from '../shared';

interface ExaWorkbenchProps {
    available: boolean;
}

type ExaStorageState = {
    query?: string;
    searchType?: ExaSearchType;
    category?: ExaCategory;
    maxResults?: number;
    contentMode?: ExaContentMode;
    maxCharacters?: number;
    maxAgeHours?: string;
    includeDomains?: string;
    excludeDomains?: string;
    systemPrompt?: string;
    showAdvanced?: boolean;
};

const STORAGE_KEY = 'headlessx.playground.exa';

export function ExaWorkbench({ available }: ExaWorkbenchProps) {
    const [query, setQuery] = useState('What changed in Next.js this month?');
    const [searchType, setSearchType] = useState<ExaSearchType>('auto');
    const [category, setCategory] = useState<ExaCategory>('all');
    const [maxResults, setMaxResults] = useState(5);
    const [contentMode, setContentMode] = useState<ExaContentMode>('highlights');
    const [maxCharacters, setMaxCharacters] = useState(4000);
    const [maxAgeHours, setMaxAgeHours] = useState('');
    const [includeDomains, setIncludeDomains] = useState('');
    const [excludeDomains, setExcludeDomains] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [steps, setSteps] = useState<ExaProgressStep[]>([]);
    const [searchResult, setSearchResult] = useState<ExaSearchResponse | null>(null);
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

            const parsed = JSON.parse(raw) as ExaStorageState;
            if (parsed.query) setQuery(parsed.query);
            if (parsed.searchType) setSearchType(parsed.searchType);
            if (parsed.category) setCategory(parsed.category);
            if (typeof parsed.maxResults === 'number') setMaxResults(parsed.maxResults);
            if (parsed.contentMode) setContentMode(parsed.contentMode);
            if (typeof parsed.maxCharacters === 'number') setMaxCharacters(parsed.maxCharacters);
            if (parsed.maxAgeHours !== undefined) setMaxAgeHours(parsed.maxAgeHours);
            if (parsed.includeDomains !== undefined) setIncludeDomains(parsed.includeDomains);
            if (parsed.excludeDomains !== undefined) setExcludeDomains(parsed.excludeDomains);
            if (parsed.systemPrompt !== undefined) setSystemPrompt(parsed.systemPrompt);
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

        const nextState: ExaStorageState = {
            query,
            searchType,
            category,
            maxResults,
            contentMode,
            maxCharacters,
            maxAgeHours,
            includeDomains,
            excludeDomains,
            systemPrompt,
            showAdvanced,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }, [
        category,
        contentMode,
        excludeDomains,
        includeDomains,
        maxAgeHours,
        maxCharacters,
        maxResults,
        query,
        searchType,
        showAdvanced,
        systemPrompt,
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
        setError('Search cancelled');
        resetRunState();
    };

    const beginRun = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        setIsPending(true);
        setError(null);
        setElapsedTime(0);
        setStartTime(Date.now());
        setSteps([]);
    };

    const runSearch = async () => {
        beginRun();
        setSearchResult(null);

        try {
            const response = await fetch('/api/operators/exa/search/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    type: searchType,
                    numResults: maxResults,
                    contentMode,
                    maxCharacters,
                    maxAgeHours: maxAgeHours.trim() ? Number(maxAgeHours) : undefined,
                    category: category === 'all' ? undefined : category,
                    includeDomains: parseDomainList(includeDomains),
                    excludeDomains: parseDomainList(excludeDomains),
                    systemPrompt: systemPrompt.trim() || undefined,
                }),
                signal: abortControllerRef.current!.signal,
            });

            if (!response.ok || !response.body) {
                const payload = await response.json().catch(() => null);
                throw new Error(getExaErrorMessage(payload));
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const rawEvents = buffer.split('\n\n');
                buffer = rawEvents.pop() || '';

                for (const rawEvent of rawEvents) {
                    const parsed = parseSseEvent(rawEvent);
                    if (!parsed) {
                        continue;
                    }

                    if (parsed.event === 'progress') {
                        setSteps((current) => mergeProgressStep(current, parsed.data as ExaProgressStep));
                        continue;
                    }

                    if (parsed.event === 'result') {
                        setSearchResult(parsed.data as ExaSearchResponse);
                        continue;
                    }

                    if (parsed.event === 'error') {
                        setError(parsed.data?.error || 'Search failed');
                        continue;
                    }

                    if (parsed.event === 'done') {
                        resetRunState();
                    }
                }
            }

            resetRunState();
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return;
            }

            setError(error instanceof Error ? error.message : 'Search failed');
            resetRunState();
        }
    };

    return (
        <WorkbenchLayout
            header={
                <ExaHeader
                    available={available}
                    elapsedTime={elapsedTime}
                    isPending={isPending}
                    hasResult={Boolean(searchResult)}
                    hasError={Boolean(error)}
                />
            }
            config={
                <ConfigurationPanel
                    available={available}
                    query={query}
                    onQueryChange={setQuery}
                    searchType={searchType}
                    onSearchTypeChange={setSearchType}
                    category={category}
                    onCategoryChange={setCategory}
                    maxResults={maxResults}
                    onMaxResultsChange={setMaxResults}
                    contentMode={contentMode}
                    onContentModeChange={setContentMode}
                    maxCharacters={maxCharacters}
                    onMaxCharactersChange={setMaxCharacters}
                    maxAgeHours={maxAgeHours}
                    onMaxAgeHoursChange={setMaxAgeHours}
                    includeDomains={includeDomains}
                    onIncludeDomainsChange={setIncludeDomains}
                    excludeDomains={excludeDomains}
                    onExcludeDomainsChange={setExcludeDomains}
                    systemPrompt={systemPrompt}
                    onSystemPromptChange={setSystemPrompt}
                    showAdvanced={showAdvanced}
                    onShowAdvancedChange={setShowAdvanced}
                    isPending={isPending}
                    onRun={runSearch}
                    onStop={stopCurrentRun}
                />
            }
            results={
                <ResultsPanel
                    available={available}
                    query={query}
                    searchType={searchType}
                    steps={steps}
                    searchResult={searchResult}
                    error={error}
                    isPending={isPending}
                    elapsedTime={elapsedTime}
                />
            }
        />
    );
}
