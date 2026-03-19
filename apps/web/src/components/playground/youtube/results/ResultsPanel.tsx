'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type {
    YoutubeEngineResponse,
    YoutubePlayerClientProfile,
    YoutubeProgressStep,
    YoutubeSavedDownload,
} from '../types';
import {
    buildYoutubeMarkdown,
    buildYoutubeSaveOptions,
    formatBytes,
    getDefaultYoutubeSaveSteps,
    getYoutubeErrorMessage,
    getYoutubeFormatLabel,
    getYoutubeQualityLabel,
    markProgressError,
    mergeProgressStep,
    parseSseEvent,
    triggerBrowserDownload,
} from '../utils';
import { ResultsPanelShell, VideoPreviewCard } from '../../shared';
import { EmptyState } from './EmptyState';
import { ProgressSteps } from './ProgressSteps';
import { ResultsHeader } from './ResultsHeader';
import { SaveVideoDialog } from './SaveVideoDialog';

interface ResultsPanelProps {
    available: boolean;
    url: string;
    result: YoutubeEngineResponse | null;
    steps: YoutubeProgressStep[];
    error: string | null;
    isPending: boolean;
    elapsedTime: number | null;
    requestContext: {
        playerClientProfile: YoutubePlayerClientProfile;
        metadataLanguage: string;
        socketTimeout: number;
    };
    activeDownloadJobId: string | null;
    onActiveDownloadJobChange: (jobId: string | null) => void;
}

function formatCount(value?: number | null) {
    if (typeof value !== 'number') {
        return 'N/A';
    }
    return new Intl.NumberFormat().format(value);
}

export function ResultsPanel({
    available,
    url,
    result,
    steps,
    error,
    isPending,
    elapsedTime,
    requestContext,
    activeDownloadJobId,
    onActiveDownloadJobChange,
}: ResultsPanelProps) {
    const [viewRaw, setViewRaw] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [selectedSaveOptionId, setSelectedSaveOptionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSteps, setSaveSteps] = useState<YoutubeProgressStep[]>([]);

    const activeMarkdown = useMemo(() => buildYoutubeMarkdown(result, url), [result, url]);
    const rawPayload = useMemo(() => activeMarkdown || JSON.stringify(result, null, 2), [activeMarkdown, result]);
    const saveOptions = useMemo(() => buildYoutubeSaveOptions(result), [result]);
    const activeSaveOption = useMemo(
        () => saveOptions.find((option) => option.id === selectedSaveOptionId) || saveOptions[0] || null,
        [saveOptions, selectedSaveOptionId]
    );
    const defaultSaveSteps = useMemo(() => getDefaultYoutubeSaveSteps(), []);
    const hasResult = Boolean(result);
    const canSave = Boolean(result && !error && !result.info.is_playlist && saveOptions.length > 0);
    const collapsedBodyClass = 'custom-scrollbar h-[42rem] min-h-0 overflow-y-auto pr-2';
    const subtitleLanguageCount = useMemo(() => {
        const languages = new Set<string>();
        Object.keys(result?.subtitles?.subtitles || {}).forEach((language) => languages.add(language));
        Object.keys(result?.subtitles?.automatic_captions || {}).forEach((language) => languages.add(language));
        return languages.size;
    }, [result]);

    useEffect(() => {
        setSelectedSaveOptionId(saveOptions[0]?.id || null);
        setSaveError(null);
        setSaveSteps([]);
    }, [saveOptions, result?.info?.id]);

    const handleCopy = async () => {
        if (!rawPayload) {
            return;
        }
        await navigator.clipboard.writeText(rawPayload);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
    };

    const handleOpenSaveDialog = () => {
        if (!canSave) {
            return;
        }
        setSaveError(null);
        setSaveSteps([]);
        setSaveDialogOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!activeSaveOption || !result) {
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSteps([]);

        try {
            const response = await fetch('/api/operators/youtube/save/stream', {
                method: 'POST',
                headers: {
                    Accept: 'text/event-stream',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    formatId: activeSaveOption.formatId,
                    playerClientProfile: requestContext.playerClientProfile,
                    metadataLanguage: requestContext.metadataLanguage.trim() || undefined,
                    socketTimeout: requestContext.socketTimeout,
                    cleanupJobId: activeDownloadJobId || undefined,
                }),
            });

            if (!response.ok || !response.body) {
                const payload = await response.json().catch(() => null);
                throw new Error(getYoutubeErrorMessage(payload));
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const saveStreamState: {
                pendingSavedDownload: YoutubeSavedDownload | null;
                streamDone: boolean;
                streamFailed: boolean;
            } = {
                pendingSavedDownload: null,
                streamDone: false,
                streamFailed: false,
            };

            const applySaveEvent = (parsed: ReturnType<typeof parseSseEvent>) => {
                if (!parsed) {
                    return;
                }

                if (parsed.event === 'progress') {
                    setSaveSteps((current) => mergeProgressStep(current, parsed.data as YoutubeProgressStep));
                    return;
                }

                if (parsed.event === 'result') {
                    saveStreamState.pendingSavedDownload = parsed.data as YoutubeSavedDownload;
                    onActiveDownloadJobChange(saveStreamState.pendingSavedDownload.job_id);
                    return;
                }

                if (parsed.event === 'error') {
                    const message = parsed.data?.error || 'Unable to save the selected video zip';
                    setSaveError(message);
                    setSaveSteps((current) => markProgressError(current, defaultSaveSteps, message));
                    saveStreamState.streamFailed = true;
                    return;
                }

                if (parsed.event === 'done') {
                    saveStreamState.streamDone = true;
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
                    applySaveEvent(parseSseEvent(rawEvent));
                }
            }

            if (buffer.trim()) {
                applySaveEvent(parseSseEvent(buffer.trim()));
            }

            const savedDownload = saveStreamState.pendingSavedDownload;

            if (!saveStreamState.streamFailed && savedDownload && saveStreamState.streamDone) {
                await triggerBrowserDownload(
                    `/api/operators/youtube/download/${savedDownload.job_id}`,
                    savedDownload.download_name
                );
                setSaveDialogOpen(false);
            }
        } catch (saveRequestError) {
            const message = saveRequestError instanceof Error ? saveRequestError.message : 'Unable to save the selected video zip';
            setSaveError(message);
            setSaveSteps((current) => markProgressError(current, defaultSaveSteps, message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <ResultsPanelShell
                header={
                    <ResultsHeader
                        hasResult={hasResult}
                        hasError={Boolean(error)}
                        isPending={isPending}
                        isSaving={isSaving}
                        elapsedTime={elapsedTime}
                        expanded={expanded}
                        viewRaw={viewRaw}
                        copied={copied}
                        canCopy={hasResult && !error}
                        canSave={canSave}
                        onToggleExpanded={() => setExpanded((current) => !current)}
                        onToggleRaw={() => setViewRaw((current) => !current)}
                        onCopy={handleCopy}
                        onSave={handleOpenSaveDialog}
                    />
                }
                bodyClassName="min-h-[640px]"
            >
                {!hasResult && !isPending && !error && <EmptyState available={available} />}

                {isPending && !hasResult && (
                    <div className="flex h-full min-h-[640px] flex-col justify-center p-8">
                        <div className="mx-auto w-full max-w-2xl">
                            <ProgressSteps
                                steps={steps}
                                emptyLabel="Waiting for YouTube extract progress"
                            />
                        </div>
                    </div>
                )}

                {error && !isPending && (
                    <div className="flex h-full min-h-[640px] flex-col items-center justify-center px-8 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
                            <HugeiconsIcon icon={Cancel01Icon} className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Request Failed</h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p>
                    </div>
                )}

                {hasResult && !isPending && !error && result && (
                    viewRaw ? (
                        <div className="p-8">
                            <div data-native-scroll="true" className={expanded ? '' : collapsedBodyClass}>
                                <pre className={`rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 ${expanded ? 'custom-scrollbar overflow-auto' : 'overflow-x-auto overflow-y-visible'}`}>
                                    <code>{rawPayload}</code>
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8">
                            <div data-native-scroll="true" className={expanded ? '' : collapsedBodyClass}>
                                <div className="space-y-5">
                                    <VideoPreviewCard
                                        title={result.info.title || result.info.webpage_url}
                                        description="Best MP4 preview selected from the current extract result."
                                        src={result.preview?.url || undefined}
                                        poster={result.info.thumbnail || undefined}
                                        badge={result.preview?.ext ? result.preview.ext.toUpperCase() : 'PREVIEW'}
                                        detail={result.preview?.resolution || result.preview?.format_note || 'Best available MP4'}
                                        mimeType={result.preview?.mime_type || undefined}
                                    />

                                    <div className="grid gap-4 sm:grid-cols-4">
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Duration</div>
                                            <div className="mt-2 text-2xl font-bold text-slate-900">{result.info.duration_string || 'N/A'}</div>
                                        </div>
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Formats</div>
                                            <div className="mt-2 text-2xl font-bold text-slate-900">{result.formats?.length || 0}</div>
                                        </div>
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subtitles</div>
                                            <div className="mt-2 text-2xl font-bold text-slate-900">{subtitleLanguageCount}</div>
                                        </div>
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Views</div>
                                            <div className="mt-2 text-2xl font-bold text-slate-900">{formatCount(result.info.view_count)}</div>
                                        </div>
                                    </div>

                                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Metadata</div>
                                        <div className="text-lg font-bold text-slate-900">{result.info.title || result.info.webpage_url}</div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                            {result.info.channel ? <span>{result.info.channel}</span> : null}
                                            {result.info.upload_date ? <span>{result.info.upload_date}</span> : null}
                                            {result.info.live_status ? <span>{result.info.live_status}</span> : null}
                                            {result.info.availability ? <span>{result.info.availability}</span> : null}
                                            {result.engine?.service ? <span>{result.engine.service}</span> : null}
                                            {result.engine?.player_client_profile ? <span>{result.engine.player_client_profile} client</span> : null}
                                            {result.engine?.metadata_language ? <span>lang: {result.engine.metadata_language}</span> : null}
                                            {result.engine?.socket_timeout ? <span>timeout: {result.engine.socket_timeout}s</span> : null}
                                            {activeDownloadJobId ? <span>temp zip ready</span> : null}
                                        </div>
                                        {result.info.description ? (
                                            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                                {result.info.description}
                                            </p>
                                        ) : null}
                                    </div>

                                    {!!result.formats?.length && (
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Formats</div>
                                                {saveOptions.length ? (
                                                    <div className="text-xs font-medium text-slate-500">
                                                        Save zip includes video + <span className="font-semibold text-slate-700">metadata.md</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="space-y-3">
                                                {result.formats.map((format) => (
                                                    <div key={`${format.format_id}-${format.ext}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                                        <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                                                            <span>{format.format_id || 'unknown'}</span>
                                                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                                                                Format {getYoutubeFormatLabel(format)}
                                                            </span>
                                                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                                                                Quality {getYoutubeQualityLabel(format)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-3">
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Resolution:</span>{' '}
                                                                {format.resolution || 'N/A'}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Note:</span>{' '}
                                                                {format.format_note || 'N/A'}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Video Codec:</span>{' '}
                                                                {format.vcodec || 'N/A'}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Audio Codec:</span>{' '}
                                                                {format.acodec || 'N/A'}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-700">FPS:</span>{' '}
                                                                {format.fps || 'N/A'}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Size:</span>{' '}
                                                                {format.filesize ? formatBytes(format.filesize) : format.filesize_approx ? `~${formatBytes(format.filesize_approx)}` : 'N/A'}
                                                            </div>
                                                            <div className="sm:col-span-2 xl:col-span-3">
                                                                <span className="font-semibold text-slate-700">Protocol:</span>{' '}
                                                                {format.protocol || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(Object.keys(result.subtitles?.subtitles || {}).length > 0 || Object.keys(result.subtitles?.automatic_captions || {}).length > 0) && (
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subtitles</div>
                                            <div className="space-y-3 text-sm text-slate-600">
                                                {Object.keys(result.subtitles?.subtitles || {}).length > 0 ? (
                                                    <div>
                                                        <div className="font-semibold text-slate-900">Manual</div>
                                                        <div className="mt-1">{Object.keys(result.subtitles?.subtitles || {}).join(', ')}</div>
                                                    </div>
                                                ) : null}
                                                {Object.keys(result.subtitles?.automatic_captions || {}).length > 0 ? (
                                                    <div>
                                                        <div className="font-semibold text-slate-900">Automatic</div>
                                                        <div className="mt-1">{Object.keys(result.subtitles?.automatic_captions || {}).join(', ')}</div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}

                                    {!!result.info.entries?.length && (
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Playlist Preview</div>
                                            <div className="space-y-3">
                                                {result.info.entries.map((entry, index) => (
                                                    <div key={`${entry.id}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                                        <div className="font-semibold text-slate-900">{entry.title || entry.url || 'Entry'}</div>
                                                        <div className="mt-1 break-all text-xs text-slate-500">{entry.url}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </ResultsPanelShell>

            <SaveVideoDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                options={saveOptions}
                selectedOptionId={selectedSaveOptionId}
                onSelectOption={setSelectedSaveOptionId}
                isSaving={isSaving}
                onConfirm={handleConfirmSave}
                saveError={saveError}
                steps={saveSteps}
            />
        </>
    );
}
