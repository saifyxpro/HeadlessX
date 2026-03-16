import type { WebsiteTool } from '../types';
import { AdvancedSettingsDialog } from '../../shared/AdvancedSettingsDialog';
import { PathPatternFields } from './PathPatternFields';
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
    includePaths: string;
    setIncludePaths: (value: string) => void;
    excludePaths: string;
    setExcludePaths: (value: string) => void;
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
    includePaths,
    setIncludePaths,
    excludePaths,
    setExcludePaths,
    disabled,
}: AdvancedSettingsProps) {
    const advancedSummary = [
        ...(tool === 'scrape' ? [`${timeout / 1000}s timeout`] : []),
        selector ? 'Custom selector' : 'No selector',
        stealth ? 'Stealth on' : 'Stealth off',
    ].join(' • ');

    return (
        <AdvancedSettingsDialog
            open={showAdvanced}
            onOpenChange={setShowAdvanced}
            disabled={disabled}
            title="Browser and timing controls"
            description="Refine selector waiting, scrape timeout behavior, stealth mode, and path filtering without expanding the main config panel."
            summary={advancedSummary}
        >
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
                        <span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
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

            {(tool === 'crawl' || tool === 'map') && (
                <PathPatternFields
                    includePaths={includePaths}
                    setIncludePaths={setIncludePaths}
                    excludePaths={excludePaths}
                    setExcludePaths={setExcludePaths}
                    disabled={disabled}
                />
            )}
        </AdvancedSettingsDialog>
    );
}
