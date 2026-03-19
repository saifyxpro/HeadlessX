import {
    ArrowRight01Icon,
    Cancel01Icon,
    GlobeIcon,
    LanguageSquareIcon,
    Loading03Icon,
    Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { ConfigPanelShell } from '../shared';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { AdvancedSettings } from './AdvancedSettings';
import regions from '@/data/googleRegions.json';
import languages from '@/data/googleLanguages.json';

const REGION_OPTIONS = [
    { value: '', label: 'Auto (Google default)' },
    ...regions,
];

const LANGUAGE_OPTIONS = [
    { value: '', label: 'Auto (Google default)' },
    ...languages,
];

interface ConfigurationPanelProps {
    query: string;
    setQuery: (query: string) => void;
    region: string;
    setRegion: (region: string) => void;
    language: string;
    setLanguage: (language: string) => void;
    timeFilter: string;
    setTimeFilter: (timeFilter: string) => void;
    timeout: number;
    setTimeout: (timeout: number) => void;
    showAdvanced: boolean;
    setShowAdvanced: (open: boolean) => void;
    onSearch: (e?: React.FormEvent) => void;
    onStop: () => void;
    isLoading: boolean;
}

export function ConfigurationPanel({
    query,
    setQuery,
    region,
    setRegion,
    language,
    setLanguage,
    timeFilter,
    setTimeFilter,
    timeout,
    setTimeout,
    showAdvanced,
    setShowAdvanced,
    onSearch,
    onStop,
    isLoading,
}: ConfigurationPanelProps) {
    return (
        <ConfigPanelShell
            disabled={isLoading}
            iconSlot={
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] text-slate-900 ring-1 ring-slate-200">
                    <HugeiconsIcon icon={Search01Icon} className="h-5 w-5" />
                </div>
            }
            title="Search Config"
            description="Run a Google AI Search flow. Leave region and language on auto unless you need explicit targeting."
        >
            <form onSubmit={onSearch} className="space-y-6">
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Search Query
                    </label>
                    <div className="relative">
                        <HugeiconsIcon
                            icon={Search01Icon}
                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="best headphones 2026 or site:twitter.com ai"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400"
                        />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Region
                        </label>
                        <CustomDropdown
                            value={region}
                            onChange={setRegion}
                            options={REGION_OPTIONS}
                            placeholder="Auto (Google default)"
                            icon={GlobeIcon}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Language
                        </label>
                        <CustomDropdown
                            value={language}
                            onChange={setLanguage}
                            options={LANGUAGE_OPTIONS}
                            placeholder="Auto (Google default)"
                            icon={LanguageSquareIcon}
                        />
                    </div>
                </div>

                <AdvancedSettings
                    timeout={timeout}
                    setTimeoutValue={setTimeout}
                    timeFilter={timeFilter}
                    setTimeFilter={setTimeFilter}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    disabled={isLoading}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin text-blue-400" />
                                Searching
                            </>
                        ) : (
                            <>
                                <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                                Run Search
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onStop}
                        disabled={!isLoading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-50"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                        Stop
                    </button>
                </div>
            </form>
        </ConfigPanelShell>
    );
}
