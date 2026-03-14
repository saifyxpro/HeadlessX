'use client';

import { LinkSquare01Icon, Search01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Input } from '@/components/ui/input';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import type {
    TavilyCitationFormat,
    TavilyRawContentMode,
    TavilyResearchModel,
    TavilySearchDepth,
    TavilyTool,
    TavilyTopic,
} from '../types';
import { ActionButtons } from './ActionButtons';

interface ConfigurationPanelProps {
    available: boolean;
    tool: TavilyTool;
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    researchQuery: string;
    onResearchQueryChange: (value: string) => void;
    searchDepth: TavilySearchDepth;
    onSearchDepthChange: (value: TavilySearchDepth) => void;
    topic: TavilyTopic;
    onTopicChange: (value: TavilyTopic) => void;
    maxResults: number;
    onMaxResultsChange: (value: number) => void;
    includeAnswer: boolean;
    onIncludeAnswerChange: (value: boolean) => void;
    includeImages: boolean;
    onIncludeImagesChange: (value: boolean) => void;
    includeRawContent: TavilyRawContentMode;
    onIncludeRawContentChange: (value: TavilyRawContentMode) => void;
    includeDomains: string;
    onIncludeDomainsChange: (value: string) => void;
    excludeDomains: string;
    onExcludeDomainsChange: (value: string) => void;
    model: TavilyResearchModel;
    onModelChange: (value: TavilyResearchModel) => void;
    citationFormat: TavilyCitationFormat;
    onCitationFormatChange: (value: TavilyCitationFormat) => void;
    researchTimeout: number;
    onResearchTimeoutChange: (value: number) => void;
    showAdvanced: boolean;
    onShowAdvancedChange: (value: boolean) => void;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

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
        tool,
        searchQuery,
        onSearchQueryChange,
        researchQuery,
        onResearchQueryChange,
        searchDepth,
        onSearchDepthChange,
        topic,
        onTopicChange,
        maxResults,
        onMaxResultsChange,
        includeAnswer,
        onIncludeAnswerChange,
        includeImages,
        onIncludeImagesChange,
        includeRawContent,
        onIncludeRawContentChange,
        includeDomains,
        onIncludeDomainsChange,
        excludeDomains,
        onExcludeDomainsChange,
        model,
        onModelChange,
        citationFormat,
        onCitationFormatChange,
        researchTimeout,
        onResearchTimeoutChange,
        showAdvanced,
        onShowAdvancedChange,
        isPending,
        onRun,
        onStop,
    } = props;

    const activeQuery = tool === 'search' ? searchQuery : researchQuery;

    return (
        <div className="space-y-6 lg:col-span-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] text-slate-900 ring-1 ring-slate-200">
                            <HugeiconsIcon icon={tool === 'search' ? Search01Icon : SparklesIcon} className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {tool === 'search' ? 'Search Config' : 'Research Config'}
                            </h2>
                            <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                                {tool === 'search'
                                    ? 'Tune Tavily web search for answer quality, depth, and source richness.'
                                    : 'Start a Tavily research job and poll the final report through the backend.'}
                            </p>
                        </div>
                    </div>

                    <div className={isPending ? 'pointer-events-none opacity-70' : ''}>
                        <div className="space-y-6">
                            {!available && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                                    Add `TAVILY_API_KEY` to your environment to activate Tavily requests.
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Query
                                </label>
                                {tool === 'search' ? (
                                    <Input
                                        value={activeQuery}
                                        onChange={(event) => onSearchQueryChange(event.target.value)}
                                        placeholder="Ask Tavily to search the web..."
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus-visible:ring-0"
                                    />
                                ) : (
                                    <textarea
                                        value={activeQuery}
                                        onChange={(event) => onResearchQueryChange(event.target.value)}
                                        rows={4}
                                        placeholder="Ask Tavily to research a topic..."
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400"
                                    />
                                )}
                            </div>

                            {tool === 'search' ? (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                Search Depth
                                            </label>
                                            <CustomDropdown
                                                value={searchDepth}
                                                onChange={(value) => onSearchDepthChange(value as TavilySearchDepth)}
                                                options={[
                                                    { value: 'basic', label: 'Basic' },
                                                    { value: 'advanced', label: 'Advanced' },
                                                ]}
                                                icon={Search01Icon}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                Topic
                                            </label>
                                            <CustomDropdown
                                                value={topic}
                                                onChange={(value) => onTopicChange(value as TavilyTopic)}
                                                options={[
                                                    { value: 'general', label: 'General' },
                                                    { value: 'news', label: 'News' },
                                                    { value: 'finance', label: 'Finance' },
                                                ]}
                                                icon={LinkSquare01Icon}
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

                                    <div className="space-y-3">
                                        <ToggleRow
                                            label="Include Answer"
                                            description="Request Tavily’s direct answer in the search response."
                                            checked={includeAnswer}
                                            onChange={onIncludeAnswerChange}
                                        />
                                        <ToggleRow
                                            label="Include Images"
                                            description="Return image results and descriptions when Tavily provides them."
                                            checked={includeImages}
                                            onChange={onIncludeImagesChange}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                Model
                                            </label>
                                            <CustomDropdown
                                                value={model}
                                                onChange={(value) => onModelChange(value as TavilyResearchModel)}
                                                options={[
                                                    { value: 'auto', label: 'Auto' },
                                                    { value: 'mini', label: 'Mini' },
                                                    { value: 'pro', label: 'Pro' },
                                                ]}
                                                icon={SparklesIcon}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                Citation Format
                                            </label>
                                            <CustomDropdown
                                                value={citationFormat}
                                                onChange={(value) => onCitationFormatChange(value as TavilyCitationFormat)}
                                                options={[
                                                    { value: 'numbered', label: 'Numbered' },
                                                    { value: 'mla', label: 'MLA' },
                                                    { value: 'apa', label: 'APA' },
                                                    { value: 'chicago', label: 'Chicago' },
                                                ]}
                                                icon={LinkSquare01Icon}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                            <span>Timeout</span>
                                            <span>{researchTimeout}s</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={30}
                                            max={180}
                                            step={15}
                                            value={researchTimeout}
                                            onChange={(event) => onResearchTimeoutChange(Number(event.target.value))}
                                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => onShowAdvancedChange(!showAdvanced)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300"
                            >
                                Advanced
                            </button>

                            {showAdvanced && (
                                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    {tool === 'search' && (
                                        <>
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                    Raw Content
                                                </label>
                                                <CustomDropdown
                                                    value={String(includeRawContent)}
                                                    onChange={(value) => onIncludeRawContentChange(value === 'false' ? false : value as TavilyRawContentMode)}
                                                    options={[
                                                        { value: 'false', label: 'Disabled' },
                                                        { value: 'markdown', label: 'Markdown' },
                                                        { value: 'text', label: 'Text' },
                                                    ]}
                                                    icon={Search01Icon}
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                    Include Domains
                                                </label>
                                                <textarea
                                                    value={includeDomains}
                                                    onChange={(event) => onIncludeDomainsChange(event.target.value)}
                                                    rows={3}
                                                    placeholder={"docs.tavily.com\nopenai.com"}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                    Exclude Domains
                                                </label>
                                                <textarea
                                                    value={excludeDomains}
                                                    onChange={(event) => onExcludeDomainsChange(event.target.value)}
                                                    rows={3}
                                                    placeholder={"example.com\nads.example"}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {tool === 'research' && (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-500">
                                            Research stays focused in v1: query, model, citation format, and timeout. Structured schema controls can be added later without changing the workbench shell.
                                        </div>
                                    )}
                                </div>
                            )}

                            <ActionButtons
                                tool={tool}
                                isPending={isPending}
                                hasQuery={Boolean(activeQuery.trim())}
                                hasApiKey={available}
                                onRun={onRun}
                                onStop={onStop}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
