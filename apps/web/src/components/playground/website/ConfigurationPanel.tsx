import { useState } from 'react';
import {
    ArrowDown01Icon,
    ArrowRight01Icon,
    CodeSquareIcon,
    File01Icon,
    Image01Icon,
    LinkSquare01Icon,
    Loading03Icon,
    SparklesIcon,
    SquareIcon,
    Target01Icon,
    ZapIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { HugeiconType, OutputType, OutputTypeOption, WebsiteTool } from './types';

// Custom Dropdown Component
function CustomDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon: Icon
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; suffix?: string }[];
    placeholder?: string;
    icon?: HugeiconType;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-10 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-slate-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all cursor-pointer hover:bg-white/80 hover:border-blue-200/50 text-left shadow-sm`}
            >
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <HugeiconsIcon icon={Icon} className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                )}
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                {selectedOption?.suffix && (
                    <span className="ml-1 text-emerald-500">{selectedOption.suffix}</span>
                )}
            </button>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <HugeiconsIcon icon={ArrowDown01Icon} className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 right-0 z-[9999] mt-2 py-2 bg-white/90 backdrop-blur-xl border border-white/50 rounded-xl shadow-xl ring-1 ring-slate-900/5 max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-blue-50/50 transition-colors flex items-center justify-between group ${value === opt.value ? 'bg-blue-50/80 text-blue-600 font-medium' : 'text-slate-700'
                                    }`}
                            >
                                <span className={`group-hover:translate-x-1 transition-transform ${value === opt.value ? 'translate-x-1' : ''}`}>{opt.label}</span>
                                {opt.suffix && <span className="text-emerald-500 text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50">{opt.suffix}</span>}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const OUTPUT_TYPES: OutputTypeOption[] = [
    { id: 'html', label: 'HTML', icon: CodeSquareIcon },
    { id: 'html-js', label: 'HTML + JS', icon: ZapIcon },
    { id: 'content', label: 'Content', icon: File01Icon },
    { id: 'screenshot', label: 'Screenshot', icon: Image01Icon },
];

const OUTPUT_TYPE_OPTIONS = OUTPUT_TYPES.map((type) => ({
    value: type.id,
    label: type.label,
}));

interface ConfigurationPanelProps {
    url: string;
    setUrl: (url: string) => void;
    tool: WebsiteTool;
    setTool: (tool: WebsiteTool) => void;
    outputType: OutputType;
    setOutputType: (type: OutputType) => void;
    selector: string;
    setSelector: (val: string) => void;
    timeout: number;
    setTimeoutValue: (val: number) => void;
    showAdvanced: boolean;
    setShowAdvanced: (show: boolean) => void;
    stealth: boolean;
    setStealth: (val: boolean) => void;
    isStreaming: boolean;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

export function ConfigurationPanel({
    url, setUrl,
    tool, setTool,
    outputType, setOutputType,
    selector, setSelector,
    timeout, setTimeoutValue,
    showAdvanced, setShowAdvanced,
    stealth, setStealth,
    isStreaming, isPending,
    onRun, onStop
}: ConfigurationPanelProps) {

    // Derived state for disabled inputs
    const isDisabled = isStreaming || isPending;
    const outputTypeLabel = OUTPUT_TYPES.find((type) => type.id === outputType)?.label ?? 'HTML';
    const advancedSummary = [
        tool === 'scrape' ? 'Scrape tool' : 'Crawl tool',
        selector ? 'Custom selector' : 'No selector',
        `${timeout / 1000}s timeout`,
        stealth ? 'Stealth on' : 'Stealth off'
    ].join(' • ');

    return (
        <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
                <div className={`space-y-6 ${isDisabled ? 'opacity-60 pointer-events-none grayscale-[0.5]' : ''}`}>
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                            <HugeiconsIcon icon={Target01Icon} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-slate-800">Scrape Config</h2>
                            <p className="mt-1 max-w-[18rem] text-sm font-medium text-slate-400 leading-5">
                                Configure the target, output, and browser behavior
                            </p>
                        </div>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <HugeiconsIcon icon={Target01Icon} className="w-4 h-4 text-blue-500" />
                            Target URL
                        </label>
                        <div className="relative group">
                            <input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                disabled={isDisabled}
                                className="w-full pl-5 pr-12 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-slate-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60 shadow-sm text-base group-hover:bg-white/80"
                            />
                            {url && (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <HugeiconsIcon icon={ZapIcon} className="w-4 h-4 text-violet-500" />
                            Select Tool
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTool('scrape')}
                                className={`rounded-xl border px-4 py-4 text-left transition-all ${
                                    tool === 'scrape'
                                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                                }`}
                            >
                                <div className="text-sm font-semibold">Scrape</div>
                                <div className="mt-1 text-xs leading-5">Run the current page extractor and stream results.</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTool('crawl')}
                                className={`rounded-xl border px-4 py-4 text-left transition-all ${
                                    tool === 'crawl'
                                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold">Crawl</span>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Soon</span>
                                </div>
                                <div className="mt-1 text-xs leading-5">Reserved for multi-page crawling once the flow is ready.</div>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                    {/* Format Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-emerald-500" />
                            Output Format
                        </label>
                        <CustomDropdown
                            value={outputType}
                            onChange={(value) => setOutputType(value as OutputType)}
                            placeholder="Select output format"
                            icon={File01Icon}
                            options={OUTPUT_TYPE_OPTIONS}
                        />
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 px-1">
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            {tool === 'scrape' ? `${outputTypeLabel} selected` : 'Crawl workflow is not live yet'}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                    {/* Advanced Options */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => !isDisabled && setShowAdvanced(!showAdvanced)}
                            disabled={isDisabled}
                            className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-left hover:bg-white/80 hover:border-blue-200/50 transition-all disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0 text-orange-400">
                                        <HugeiconsIcon icon={SparklesIcon} className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Advanced Config
                                        </div>
                                        <div className="font-medium text-slate-900 mt-1">
                                            Additional scrape options
                                        </div>
                                        <div className="text-xs text-slate-400 truncate mt-0.5">
                                            {advancedSummary}
                                        </div>
                                    </div>
                                </div>
                                <HugeiconsIcon
                                    icon={ArrowDown01Icon}
                                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${showAdvanced ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </button>

                        <div
                            className={`bg-white/50 rounded-xl border border-white/60 transition-all duration-300 ease-in-out ${
                                showAdvanced ? 'max-h-[340px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden border-transparent'
                            }`}
                        >
                            <div className="px-4 pt-4 pb-4 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                            Wait for Selector
                                        </label>
                                        <input
                                            value={selector}
                                            onChange={(e) => setSelector(e.target.value)}
                                            placeholder="#content, .main-article"
                                            disabled={isDisabled}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Timeout limit
                                            </label>
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {timeout / 1000}s
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={5000}
                                            max={60000}
                                            step={1000}
                                            value={timeout}
                                            onChange={(e) => setTimeoutValue(Number(e.target.value))}
                                            disabled={isDisabled}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500 hover:accent-slate-700 disabled:accent-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Stealth Mode
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setStealth(!stealth)}
                                                disabled={isDisabled}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                    stealth ? 'bg-blue-600' : 'bg-slate-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                                                        stealth ? 'translate-x-5' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            {stealth
                                                ? 'Humanized interactions enabled for tougher targets.'
                                                : 'Speed mode favors faster execution with less browser mimicry.'}
                                        </p>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200/70">
                    {isStreaming ? (
                        <button
                            onClick={onStop}
                            className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                            <HugeiconsIcon icon={SquareIcon} className="w-5 h-5 fill-current" />
                            Stop Scraping
                        </button>
                    ) : (
                        <button
                            onClick={onRun}
                            disabled={!url || isPending}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Loading03Icon} className="w-5 h-5 animate-spin" />
                                    Starting...
                                </span>
                            ) : (
                                <>
                                    <HugeiconsIcon icon={ZapIcon} className="w-5 h-5 fill-current group-hover:scale-110 transition-transform text-yellow-400" />
                                    Run Scraper
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
