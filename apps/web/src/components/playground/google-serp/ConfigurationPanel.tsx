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

interface ConfigurationPanelProps {
    query: string;
    setQuery: (query: string) => void;
    timeout: number;
    setTimeout: (timeout: number) => void;
    onSearch: (e?: React.FormEvent) => void;
    onStop: () => void;
    isLoading: boolean;
}

function DisabledOption({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: typeof GlobeIcon;
}) {
    return (
        <div className="space-y-3 opacity-50" title="Coming soon">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                {label}
            </label>
            <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-500">
                <HugeiconsIcon icon={icon} className="h-4 w-4" />
                <span>{value}</span>
            </div>
        </div>
    );
}

export function ConfigurationPanel({
    query,
    setQuery,
    timeout,
    setTimeout,
    onSearch,
    onStop,
    isLoading,
}: ConfigurationPanelProps) {
    return (
        <ConfigPanelShell
            disabled={isLoading}
            iconSlot={
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
                    <HugeiconsIcon icon={Search01Icon} className="h-5 w-5" />
                </div>
            }
            title="Search Config"
            description="Run a Google search and turn the result page into a clean report."
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
                            <DisabledOption label="Region" value="Global (US)" icon={GlobeIcon} />
                            <DisabledOption label="Language" value="English (en)" icon={LanguageSquareIcon} />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Browser Timeout
                                </label>
                                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                                    {timeout}s
                                </span>
                            </div>
                            <div className="mt-4">
                                <input
                                    type="range"
                                    min="30"
                                    max="120"
                                    step="10"
                                    value={timeout}
                                    onChange={(e) => setTimeout(Number(e.target.value))}
                                    className="w-full accent-slate-900"
                                />
                                <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-slate-400">
                                    <span>30s</span>
                                    <span>60s</span>
                                    <span>90s</span>
                                    <span>120s</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                                Stop
                            </button>
                        </div>
            </form>
        </ConfigPanelShell>
    );
}
