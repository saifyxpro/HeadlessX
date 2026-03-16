'use client';

import { useEffect, useRef, useState } from 'react';
import { YoutubeHeader } from './YouTubeHeader';
import { ConfigurationPanel } from './config/ConfigurationPanel';
import { ResultsPanel } from './results/ResultsPanel';
import type { YoutubeEngineResponse, YoutubePlayerClientProfile, YoutubeProgressStep } from './types';
import { getDefaultYoutubeExtractSteps, getYoutubeErrorMessage, markProgressError, mergeProgressStep, parseSseEvent } from './utils';
import { WorkbenchLayout } from '../shared';

interface YoutubeWorkbenchProps {
    available: boolean;
}

type YoutubeStorageState = {
    url?: string;
    includeFormats?: boolean;
    includeSubtitles?: boolean;
    flatPlaylist?: boolean;
    playlistPreviewLimit?: number;
    playerClientProfile?: YoutubePlayerClientProfile;
    metadataLanguage?: string;
    socketTimeout?: number;
    showAdvanced?: boolean;
};

const STORAGE_KEY = 'headlessx.playground.youtube';

export function YoutubeWorkbench({ available }: YoutubeWorkbenchProps) {
    const [url, setUrl] = useState('');
    const [includeFormats, setIncludeFormats] = useState(true);
    const [includeSubtitles, setIncludeSubtitles] = useState(true);
    const [flatPlaylist, setFlatPlaylist] = useState(true);
    const [playlistPreviewLimit, setPlaylistPreviewLimit] = useState(10);
    const [playerClientProfile, setPlayerClientProfile] = useState<YoutubePlayerClientProfile>('mobile');
    const [metadataLanguage, setMetadataLanguage] = useState('');
    const [socketTimeout, setSocketTimeout] = useState(30);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [steps, setSteps] = useState<YoutubeProgressStep[]>([]);
    const [result, setResult] = useState<YoutubeEngineResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [activeDownloadJobId, setActiveDownloadJobId] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const storageHydratedRef = useRef(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                storageHydratedRef.current = true;
                return;
            }
            const parsed = JSON.parse(raw) as YoutubeStorageState;
            if (parsed.url !== undefined) setUrl(parsed.url);
            if (typeof parsed.includeFormats === 'boolean') setIncludeFormats(parsed.includeFormats);
            if (typeof parsed.includeSubtitles === 'boolean') setIncludeSubtitles(parsed.includeSubtitles);
            if (typeof parsed.flatPlaylist === 'boolean') setFlatPlaylist(parsed.flatPlaylist);
            if (typeof parsed.playlistPreviewLimit === 'number') setPlaylistPreviewLimit(parsed.playlistPreviewLimit);
            if (parsed.playerClientProfile) setPlayerClientProfile(parsed.playerClientProfile);
            if (parsed.metadataLanguage !== undefined) setMetadataLanguage(parsed.metadataLanguage);
            if (typeof parsed.socketTimeout === 'number') setSocketTimeout(parsed.socketTimeout);
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

        const nextState: YoutubeStorageState = {
            url,
            includeFormats,
            includeSubtitles,
            flatPlaylist,
            playlistPreviewLimit,
            playerClientProfile,
            metadataLanguage,
            socketTimeout,
            showAdvanced,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }, [url, includeFormats, includeSubtitles, flatPlaylist, playlistPreviewLimit, playerClientProfile, metadataLanguage, socketTimeout, showAdvanced]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (startTime) {
            interval = setInterval(() => setElapsedTime(Date.now() - startTime), 100);
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
        resetRunState();
    };

    const runExtract = async () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const cleanupJobId = activeDownloadJobId || undefined;
        setIsPending(true);
        setError(null);
        setElapsedTime(0);
        setStartTime(Date.now());
        setResult(null);
        setSteps([]);
        if (cleanupJobId) {
            setActiveDownloadJobId(null);
        }

        try {
            const response = await fetch('/api/youtube/info/stream', {
                method: 'POST',
                headers: {
                    Accept: 'text/event-stream',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    includeFormats,
                    includeSubtitles,
                    flatPlaylist,
                    playlistPreviewLimit,
                    playerClientProfile,
                    metadataLanguage: metadataLanguage.trim() || undefined,
                    socketTimeout,
                    cleanupJobId,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok || !response.body) {
                const payload = await response.json().catch(() => null);
                throw new Error(getYoutubeErrorMessage(payload));
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const applyExtractEvent = (parsed: ReturnType<typeof parseSseEvent>) => {
                if (!parsed) {
                    return;
                }

                if (parsed.event === 'progress') {
                    setSteps((current) => mergeProgressStep(current, parsed.data as YoutubeProgressStep));
                    return;
                }

                if (parsed.event === 'result') {
                    setResult(parsed.data as YoutubeEngineResponse);
                    return;
                }

                if (parsed.event === 'error') {
                    const message = parsed.data?.error || 'Extract failed';
                    setError(message);
                    setSteps((current) => markProgressError(current, getDefaultYoutubeExtractSteps(), message));
                    return;
                }

                if (parsed.event === 'done') {
                    resetRunState();
                }
            };

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const rawEvents = buffer.split('\n\n');
                buffer = rawEvents.pop() || '';

                for (const rawEvent of rawEvents) {
                    applyExtractEvent(parseSseEvent(rawEvent));
                }
            }

            if (buffer.trim()) {
                applyExtractEvent(parseSseEvent(buffer.trim()));
            }

            resetRunState();
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return;
            }
            const message = error instanceof Error ? error.message : 'Extract failed';
            setError(message);
            setSteps((current) => markProgressError(current, getDefaultYoutubeExtractSteps(), message));
            resetRunState();
        }
    };

    return (
        <WorkbenchLayout
            header={
                <YoutubeHeader
                    available={available}
                    elapsedTime={elapsedTime}
                    isPending={isPending}
                    hasResult={Boolean(result)}
                    hasError={Boolean(error)}
                />
            }
            config={
                <ConfigurationPanel
                    available={available}
                    url={url}
                    onUrlChange={setUrl}
                    includeFormats={includeFormats}
                    onIncludeFormatsChange={setIncludeFormats}
                    includeSubtitles={includeSubtitles}
                    onIncludeSubtitlesChange={setIncludeSubtitles}
                    flatPlaylist={flatPlaylist}
                    onFlatPlaylistChange={setFlatPlaylist}
                    playlistPreviewLimit={playlistPreviewLimit}
                    onPlaylistPreviewLimitChange={setPlaylistPreviewLimit}
                    playerClientProfile={playerClientProfile}
                    onPlayerClientProfileChange={setPlayerClientProfile}
                    metadataLanguage={metadataLanguage}
                    onMetadataLanguageChange={setMetadataLanguage}
                    socketTimeout={socketTimeout}
                    onSocketTimeoutChange={setSocketTimeout}
                    showAdvanced={showAdvanced}
                    onShowAdvancedChange={setShowAdvanced}
                    isPending={isPending}
                    onRun={runExtract}
                    onStop={stopCurrentRun}
                />
            }
            results={
                <ResultsPanel
                    available={available}
                    url={url}
                    result={result}
                    steps={steps}
                    error={error}
                    isPending={isPending}
                    elapsedTime={elapsedTime}
                    requestContext={{
                        playerClientProfile,
                        metadataLanguage,
                        socketTimeout,
                    }}
                    activeDownloadJobId={activeDownloadJobId}
                    onActiveDownloadJobChange={setActiveDownloadJobId}
                />
            }
        />
    );
}
