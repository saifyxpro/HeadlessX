import { ArrowDown01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { WebsiteTool } from '../types';
import { ToggleRow } from './ToggleRow';

interface AdvancedSettingsProps {
    tool: WebsiteTool;
    selector: string;
    setSelector: (value: string) => void;
    timeout: number;
    setTimeoutValue: (value: number) => void;
    showAdvanced: boolean;
    setShowAdvanced: (show: boolean) => void;
    stealth: boolean;
    setStealth: (value: boolean) => void;
    disabled: boolean;
}

export function AdvancedSettings({
    tool,
    selector,
    setSelector,
    timeout,
    setTimeoutValue,
    showAdvanced,
    setShowAdvanced,
    stealth,
    setStealth,
    disabled,
}: AdvancedSettingsProps) {
    const advancedSummary = [
        ...(tool === 'scrape' ? [`${timeout / 1000}s timeout`] : []),
        selector ? 'Custom selector' : 'No selector',
        stealth ? 'Stealth on' : 'Stealth off',
    ].join(' • ');

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => !disabled && setShowAdvanced(!showAdvanced)}
                disabled={disabled}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-colors hover:border-slate-300 hover:bg-white"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 text-slate-400">
                            <HugeiconsIcon icon={Settings02Icon} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Advanced
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                Browser and timing controls
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-500">
                                {advancedSummary}
                            </div>
                        </div>
                    </div>

                    <HugeiconsIcon icon={ArrowDown01Icon} className={`h-4 w-4 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </div>
            </button>

            <div
                className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all ${
                    showAdvanced ? 'max-h-[360px] opacity-100' : 'max-h-0 border-transparent opacity-0'
                }`}
            >
                <div className="space-y-4 px-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Wait For Selector
                        </label>
                        <input
                            value={selector}
                            onChange={(event) => setSelector(event.target.value)}
                            placeholder="#content, .article-body"
                            disabled={disabled}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                        />
                    </div>

                    {tool === 'scrape' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Timeout
                                </label>
                                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                                    {timeout / 1000}s
                                </span>
                            </div>
                            <input
                                type="range"
                                min={5000}
                                max={60000}
                                step={1000}
                                value={timeout}
                                onChange={(event) => setTimeoutValue(Number(event.target.value))}
                                disabled={disabled}
                                className="w-full accent-slate-900"
                            />
                        </div>
                    )}

                    <ToggleRow
                        label="Stealth Mode"
                        description="Use the full anti-detection path instead of the faster reduced-interaction mode."
                        checked={stealth}
                        onChange={setStealth}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}
