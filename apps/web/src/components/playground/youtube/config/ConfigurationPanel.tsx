'use client';

import { LinkSquare01Icon, PlayIcon, SubtitleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Input } from '@/components/ui/input';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { AdvancedSettingsDialog, ConfigPanelShell } from '../../shared';
import { ActionButtons } from './ActionButtons';
import type { YoutubePlayerClientProfile } from '../types';

interface ConfigurationPanelProps {
    available: boolean;
    url: string;
    onUrlChange: (value: string) => void;
    includeFormats: boolean;
    onIncludeFormatsChange: (value: boolean) => void;
    includeSubtitles: boolean;
    onIncludeSubtitlesChange: (value: boolean) => void;
    flatPlaylist: boolean;
    onFlatPlaylistChange: (value: boolean) => void;
    playlistPreviewLimit: number;
    onPlaylistPreviewLimitChange: (value: number) => void;
    playerClientProfile: YoutubePlayerClientProfile;
    onPlayerClientProfileChange: (value: YoutubePlayerClientProfile) => void;
    metadataLanguage: string;
    onMetadataLanguageChange: (value: string) => void;
    socketTimeout: number;
    onSocketTimeoutChange: (value: number) => void;
    showAdvanced: boolean;
    onShowAdvancedChange: (value: boolean) => void;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

const playerClientOptions: { value: YoutubePlayerClientProfile; label: string; suffix?: string }[] = [
    { value: 'mobile', label: 'Mobile', suffix: 'recommended' },
    { value: 'default', label: 'Default' },
    { value: 'web', label: 'Web family' },
    { value: 'tv', label: 'TV family' },
];

function ToggleRow(props: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    const { label, description, checked, onChange } = props;

    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white"
        >
            <div className="pr-4">
                <div className="text-sm font-semibold text-slate-900">{label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
            </div>

            <span className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-slate-900' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
        </button>
    );
}

export function ConfigurationPanel(props: ConfigurationPanelProps) {
    const {
        available,
        url,
        onUrlChange,
        includeFormats,
        onIncludeFormatsChange,
        includeSubtitles,
        onIncludeSubtitlesChange,
        flatPlaylist,
        onFlatPlaylistChange,
        playlistPreviewLimit,
        onPlaylistPreviewLimitChange,
        playerClientProfile,
        onPlayerClientProfileChange,
        metadataLanguage,
        onMetadataLanguageChange,
        socketTimeout,
        onSocketTimeoutChange,
        showAdvanced,
        onShowAdvancedChange,
        isPending,
        onRun,
        onStop,
    } = props;

    const advancedSummary = [
        playerClientOptions.find((option) => option.value === playerClientProfile)?.label || 'Mobile',
        `${socketTimeout}s timeout`,
        includeFormats ? 'Formats on' : 'Formats off',
        includeSubtitles ? 'Subtitles on' : 'Subtitles off',
        metadataLanguage.trim() ? metadataLanguage.trim() : 'Default language',
    ].join(' • ');

    return (
        <ConfigPanelShell
            disabled={isPending}
            iconSlot={
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(254,242,242,1))] text-slate-900 ring-1 ring-slate-200">
                    <HugeiconsIcon icon={PlayIcon} className="h-5 w-5" />
                </div>
            }
            title="YouTube Config"
            description="Point the yt-dude-powered engine at a video or playlist URL and choose which metadata surfaces to include."
        >
            <div className="space-y-6">
                {!available && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                        Add `YT_ENGINE_URL` to your environment to activate the YouTube engine.
                    </div>
                )}

                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Target URL
                    </label>
                    <Input
                        value={url}
                        onChange={(event) => onUrlChange(event.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="pr-12"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Player Client
                    </label>
                    <CustomDropdown
                        value={playerClientProfile}
                        onChange={(value) => onPlayerClientProfileChange(value as YoutubePlayerClientProfile)}
                        options={playerClientOptions}
                        placeholder="Choose player client"
                    />
                </div>

                <div className="space-y-3">
                    <ToggleRow
                        label="Include Formats"
                        description="Return the available yt-dude format list with codecs, resolution, and protocol data."
                        checked={includeFormats}
                        onChange={onIncludeFormatsChange}
                    />
                    <ToggleRow
                        label="Include Subtitles"
                        description="Return subtitle and automatic-caption language inventory when available."
                        checked={includeSubtitles}
                        onChange={onIncludeSubtitlesChange}
                    />
                </div>

                <AdvancedSettingsDialog
                    open={showAdvanced}
                    onOpenChange={onShowAdvancedChange}
                    disabled={isPending}
                    title="Playlist and extraction controls"
                    description="Keep the higher-friction yt-dude controls here while the core extract flow stays short in the main panel."
                    summary={advancedSummary}
                >
                    <div className="space-y-3">
                        <ToggleRow
                            label="Flat Playlist"
                            description="Use faster flat playlist extraction for playlist entries instead of expanding every item deeply."
                            checked={flatPlaylist}
                            onChange={onFlatPlaylistChange}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Metadata Language
                        </label>
                        <Input
                            value={metadataLanguage}
                            onChange={(event) => onMetadataLanguageChange(event.target.value)}
                            placeholder="en, es, fr"
                        />
                        <p className="text-xs leading-5 text-slate-500">
                            Optional translated metadata preference passed to the YouTube extractor.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            <span>Socket Timeout</span>
                            <span>{socketTimeout}s</span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={120}
                            step={5}
                            value={socketTimeout}
                            onChange={(event) => onSocketTimeoutChange(Number(event.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            <span>Playlist Preview</span>
                            <span>{playlistPreviewLimit}</span>
                        </div>
                        <input
                            type="range"
                            min={5}
                            max={25}
                            step={1}
                            value={playlistPreviewLimit}
                            onChange={(event) => onPlaylistPreviewLimitChange(Number(event.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                        />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <HugeiconsIcon icon={LinkSquare01Icon} className="h-4 w-4 text-slate-500" />
                            yt-dude engine notes
                        </div>
                        <p className="mt-2">
                            This phase stays metadata-first, but now lets you choose a safer client profile, metadata language, and socket timeout so the UI matches the reliability-focused yt-dude fork better.
                        </p>
                    </div>
                </AdvancedSettingsDialog>

                <div className="pt-4">
                    <ActionButtons
                        disabled={!available || !url.trim()}
                        isPending={isPending}
                        onRun={onRun}
                        onStop={onStop}
                    />
                </div>
            </div>
        </ConfigPanelShell>
    );
}
