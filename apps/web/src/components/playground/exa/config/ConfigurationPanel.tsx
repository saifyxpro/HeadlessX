'use client';

import { Clock03Icon, Search01Icon, SourceCodeCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Input } from '@/components/ui/input';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { AdvancedSettingsDialog, ConfigPanelShell } from '../../shared';
import type { ExaCategory, ExaContentMode, ExaSearchType } from '../types';
import { ActionButtons } from './ActionButtons';

interface ConfigurationPanelProps {
    available: boolean;
    query: string;
    onQueryChange: (value: string) => void;
    searchType: ExaSearchType;
    onSearchTypeChange: (value: ExaSearchType) => void;
    category: ExaCategory;
    onCategoryChange: (value: ExaCategory) => void;
    maxResults: number;
    onMaxResultsChange: (value: number) => void;
    contentMode: ExaContentMode;
    onContentModeChange: (value: ExaContentMode) => void;
    maxCharacters: number;
    onMaxCharactersChange: (value: number) => void;
    maxAgeHours: string;
    onMaxAgeHoursChange: (value: string) => void;
    includeDomains: string;
    onIncludeDomainsChange: (value: string) => void;
    excludeDomains: string;
    onExcludeDomainsChange: (value: string) => void;
    systemPrompt: string;
    onSystemPromptChange: (value: string) => void;
    showAdvanced: boolean;
    onShowAdvancedChange: (value: boolean) => void;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

export function ConfigurationPanel(props: ConfigurationPanelProps) {
    const {
        available,
        query,
        onQueryChange,
        searchType,
        onSearchTypeChange,
        category,
        onCategoryChange,
        maxResults,
        onMaxResultsChange,
        contentMode,
        onContentModeChange,
        maxCharacters,
        onMaxCharactersChange,
        maxAgeHours,
        onMaxAgeHoursChange,
        includeDomains,
        onIncludeDomainsChange,
        excludeDomains,
        onExcludeDomainsChange,
        systemPrompt,
        onSystemPromptChange,
        showAdvanced,
        onShowAdvancedChange,
        isPending,
        onRun,
        onStop,
    } = props;

    const advancedSummary = [
        `${maxCharacters.toLocaleString()} chars`,
        maxAgeHours.trim() ? `${maxAgeHours}h freshness` : 'Default freshness',
        includeDomains.trim() || excludeDomains.trim() ? 'Domain filters' : 'No domain filters',
    ].join(' • ');

    return (
        <ConfigPanelShell
            disabled={isPending}
            iconSlot={
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] text-slate-900 ring-1 ring-slate-200">
                    <HugeiconsIcon icon={Search01Icon} className="h-5 w-5" />
                </div>
            }
            title="Exa Config"
            description="Tune Exa search quality, category focus, and retrieved content before running the query."
        >
            <div className="space-y-6">
                {!available && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                        Add `EXA_API_KEY` to your environment to activate Exa requests.
                    </div>
                )}

                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Query
                    </label>
                    <textarea
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        rows={4}
                        placeholder="Ask Exa to search the web..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Search Type
                        </label>
                        <CustomDropdown
                            value={searchType}
                            onChange={(value) => onSearchTypeChange(value as ExaSearchType)}
                            options={[
                                { value: 'auto', label: 'Auto' },
                                { value: 'fast', label: 'Fast' },
                                { value: 'instant', label: 'Instant' },
                                { value: 'deep', label: 'Deep' },
                            ]}
                            icon={Search01Icon}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Category
                        </label>
                        <CustomDropdown
                            value={category}
                            onChange={(value) => onCategoryChange(value as ExaCategory)}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'news', label: 'News' },
                                { value: 'company', label: 'Company' },
                                { value: 'people', label: 'People' },
                                { value: 'research paper', label: 'Research Paper' },
                                { value: 'personal site', label: 'Personal Site' },
                                { value: 'financial report', label: 'Financial Report' },
                            ]}
                            icon={SourceCodeCircleIcon}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        <span>Max Results</span>
                        <span>{maxResults}</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={maxResults}
                        onChange={(event) => onMaxResultsChange(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                    />
                </div>

                <AdvancedSettingsDialog
                    open={showAdvanced}
                    onOpenChange={onShowAdvancedChange}
                    disabled={isPending}
                    title="Search and content controls"
                    description="Control content extraction mode, freshness, domain filters, and deep-search guidance."
                    summary={advancedSummary}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Content Mode
                            </label>
                            <CustomDropdown
                                value={contentMode}
                                onChange={(value) => onContentModeChange(value as ExaContentMode)}
                                options={[
                                    { value: 'highlights', label: 'Highlights' },
                                    { value: 'text', label: 'Text' },
                                ]}
                                icon={SourceCodeCircleIcon}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Freshness
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={maxAgeHours}
                                    onChange={(event) => onMaxAgeHoursChange(event.target.value)}
                                    min={-1}
                                    max={720}
                                    placeholder="Default"
                                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-sm text-slate-900 focus-visible:ring-0"
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                    <HugeiconsIcon icon={Clock03Icon} className="h-4 w-4" />
                                </div>
                            </div>
                            <p className="text-xs leading-5 text-slate-500">
                                Leave empty for Exa default. Use `0` for livecrawl and `-1` for cache-only.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            <span>Content Length</span>
                            <span>{maxCharacters.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min={500}
                            max={10000}
                            step={500}
                            value={maxCharacters}
                            onChange={(event) => onMaxCharactersChange(Number(event.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Include Domains
                            </label>
                            <textarea
                                rows={4}
                                value={includeDomains}
                                onChange={(event) => onIncludeDomainsChange(event.target.value)}
                                placeholder="exa.ai, docs.exa.ai"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Exclude Domains
                            </label>
                            <textarea
                                rows={4}
                                value={excludeDomains}
                                onChange={(event) => onExcludeDomainsChange(event.target.value)}
                                placeholder="example.com"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400"
                            />
                        </div>
                    </div>

                    {searchType === 'deep' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Deep System Prompt
                            </label>
                            <textarea
                                rows={4}
                                value={systemPrompt}
                                onChange={(event) => onSystemPromptChange(event.target.value)}
                                placeholder="Prefer official sources and avoid duplicate findings."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400"
                            />
                        </div>
                    )}
                </AdvancedSettingsDialog>

                <div className="pt-4">
                    <ActionButtons
                        disabled={!available || !query.trim()}
                        isPending={isPending}
                        onRun={onRun}
                        onStop={onStop}
                    />
                </div>
            </div>
        </ConfigPanelShell>
    );
}
