import { useState } from 'react';
import { Target, ExternalLink, User, ChevronDown, FileText, Code, Zap, Sparkles, Image as ImageIcon, FileDown, Eye, Square, AlertCircle, Loader2 } from 'lucide-react';
import { OutputType, Profile, OutputTypeOption } from './types';
import type { LucideIcon } from 'lucide-react';

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
    icon?: LucideIcon;
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
                        <Icon className="w-4.5 h-4.5 text-slate-400" />
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
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
    { id: 'html', label: 'HTML', icon: Code },
    { id: 'html-js', label: 'HTML + JS', icon: Zap },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'screenshot', label: 'Screenshot', icon: ImageIcon },
];

interface ConfigurationPanelProps {
    url: string;
    setUrl: (url: string) => void;
    selectedProfileId: string;
    setSelectedProfileId: (id: string) => void;
    profiles: Profile[];
    outputType: OutputType;
    setOutputType: (type: OutputType) => void;
    selector: string;
    setSelector: (val: string) => void;
    timeout: number;
    setTimeoutValue: (val: number) => void;
    showAdvanced: boolean;
    setShowAdvanced: (show: boolean) => void;
    isStreaming: boolean;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

export function ConfigurationPanel({
    url, setUrl,
    selectedProfileId, setSelectedProfileId, profiles,
    outputType, setOutputType,
    selector, setSelector,
    timeout, setTimeoutValue,
    showAdvanced, setShowAdvanced,
    isStreaming, isPending,
    onRun, onStop
}: ConfigurationPanelProps) {

    // Derived state for disabled inputs
    const isDisabled = isStreaming || isPending;

    return (
        <div className="lg:col-span-4 lg:max-h-[calc(100vh-140px)] sticky top-6">
            <div className="flex flex-col h-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-[24px] shadow-premium overflow-hidden transition-all duration-300 hover:shadow-premium-hover">

                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent ${isDisabled ? 'opacity-60 pointer-events-none grayscale-[0.5]' : ''}`}>

                    {/* URL Input */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
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
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                    {/* Profile Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-500" />
                            Browser Profile
                        </label>
                        <div className="relative">
                            <CustomDropdown
                                value={selectedProfileId}
                                onChange={setSelectedProfileId}
                                placeholder="Fresh Session (No Profile)"
                                icon={User}
                                options={[
                                    { value: '', label: 'Fresh Session (No Profile)' },
                                    ...profiles
                                        .filter(p => p.name !== 'Default Profile')
                                        .map((profile) => ({
                                            value: profile.id,
                                            label: `${profile.name}`,
                                            suffix: profile.is_running ? 'Running' : undefined
                                        }))
                                ]}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 px-1">
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            Preserve cookies & storage
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                    {/* Format Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-500" />
                            Output Format
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {OUTPUT_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setOutputType(type.id)}
                                    className={`
                                    flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all duration-300 text-center cursor-pointer relative overflow-hidden group
                                    ${outputType === type.id
                                            ? 'bg-blue-50/80 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-500/20'
                                            : 'bg-white/40 border-transparent hover:bg-white/60 hover:border-blue-100 text-slate-500'
                                        }
                                `}
                                >
                                    <type.icon className={`w-5 h-5 transition-colors ${outputType === type.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-400'}`} />
                                    <span className="text-[10px] font-bold tracking-tight">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                    {/* Advanced Options */}
                    <div className="bg-slate-50/50 rounded-xl border border-white/50 overflow-hidden">
                        <button
                            onClick={() => !isDisabled && setShowAdvanced(!showAdvanced)}
                            disabled={isDisabled}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/50 transition-colors cursor-pointer group disabled:cursor-not-allowed"
                        >
                            <span className="font-bold text-slate-600 text-xs uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                                Advanced Config
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`transition-all duration-300 ease-in-out px-5 ${showAdvanced ? 'max-h-[300px] opacity-100 pb-5' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="space-y-4 pt-2">
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
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{timeout / 1000}s</span>
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-white/60 backdrop-blur-md border-t border-white/40 z-10">
                    {isStreaming ? (
                        <button
                            onClick={onStop}
                            className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                            <Square className="w-5 h-5 fill-current" />
                            Stop Scraping
                        </button>
                    ) : (
                        <button
                            onClick={onRun}
                            disabled={!url || isPending}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Starting...
                                </span>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform text-yellow-400" />
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
