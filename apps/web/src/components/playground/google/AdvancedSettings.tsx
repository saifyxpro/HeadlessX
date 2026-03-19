import { AdvancedSettingsDialog } from '../shared/AdvancedSettingsDialog';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { Clock03Icon, Calendar03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const TIME_FILTER_OPTIONS = [
    { value: '', label: 'Any time' },
    { value: 'qdr:h', label: 'Past hour' },
    { value: 'qdr:d', label: 'Past day' },
    { value: 'qdr:w', label: 'Past week' },
];

interface AdvancedSettingsProps {
    timeout: number;
    setTimeoutValue: (value: number) => void;
    timeFilter: string;
    setTimeFilter: (value: string) => void;
    showAdvanced: boolean;
    setShowAdvanced: (open: boolean) => void;
    disabled: boolean;
}

export function AdvancedSettings({
    timeout,
    setTimeoutValue,
    timeFilter,
    setTimeFilter,
    showAdvanced,
    setShowAdvanced,
    disabled,
}: AdvancedSettingsProps) {
    const timeFilterLabel = TIME_FILTER_OPTIONS.find((option) => option.value === timeFilter)?.label || 'Any time';
    const advancedSummary = `${timeout}s timeout • ${timeFilterLabel}`;

    return (
        <AdvancedSettingsDialog
            open={showAdvanced}
            onOpenChange={setShowAdvanced}
            disabled={disabled}
            title="Search timing and filters"
            description="Refine Google search time filtering and browser timeout behavior without expanding the main search form."
            summary={advancedSummary}
        >
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Time Filter
                </label>
                <CustomDropdown
                    value={timeFilter}
                    onChange={setTimeFilter}
                    options={TIME_FILTER_OPTIONS}
                    placeholder="Select time filter"
                    icon={Calendar03Icon}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Timeout
                    </label>
                    <span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                        {timeout}s
                    </span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span className="inline-flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                                <HugeiconsIcon icon={Clock03Icon} className="h-4 w-4" />
                            </span>
                            Browser timeout
                        </span>
                    </div>
                    <input
                        type="range"
                        min="30"
                        max="120"
                        step="10"
                        value={timeout}
                        onChange={(event) => setTimeoutValue(Number(event.target.value))}
                        disabled={disabled}
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
        </AdvancedSettingsDialog>
    );
}
