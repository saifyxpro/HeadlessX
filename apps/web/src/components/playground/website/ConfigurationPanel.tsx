import { useState } from 'react';
import {
    ArrowDown01Icon,
    CodeSquareIcon,
    File01Icon,
    Image01Icon,
    LinkSquare01Icon,
    Search01Icon,
    Settings02Icon,
    SparklesIcon,
    ZapIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { HugeiconType, OutputType, OutputTypeOption, WebsiteTool } from './types';

function CustomDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon: Icon,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    icon?: HugeiconType;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((option) => option.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 text-left text-sm font-medium text-slate-900 transition-colors hover:border-slate-300 hover:bg-white ${Icon ? 'pl-11 pr-10' : 'px-4'}`}
            >
                {Icon && (
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <HugeiconsIcon icon={Icon} className="h-4.5 w-4.5" />
                    </div>
                )}
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <HugeiconsIcon icon={ArrowDown01Icon} className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 right-0 z-[9999] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                                    option.value === value
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
            <div className="pr-4">
                <div className="text-sm font-semibold text-slate-900">{label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
            </div>

            <span
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                    checked ? 'bg-slate-900' : 'bg-slate-300'
                }`}
            >
                <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </span>
        </button>
    );
}

const OUTPUT_TYPES: OutputTypeOption[] = [
    { id: 'html', label: 'HTML', icon: CodeSquareIcon },
    { id: 'html-js', label: 'Rendered HTML', icon: ZapIcon },
    { id: 'markdown', label: 'Markdown', icon: File01Icon },
    { id: 'screenshot', label: 'Screenshot', icon: Image01Icon },
];

const OUTPUT_TYPE_OPTIONS = OUTPUT_TYPES.map((type) => ({
    value: type.id,
    label: type.label,
}));

const PANEL_META: Record<WebsiteTool, {
    title: string;
    description: string;
    icon: typeof Search01Icon;
}> = {
    scrape: {
        title: 'Scrape Config',
        description: 'Tune a single-page extraction run.',
        icon: Search01Icon,
    },
    crawl: {
        title: 'Crawl Config',
        description: 'Queue a markdown crawl across a controlled page set.',
        icon: SparklesIcon,
    },
    map: {
        title: 'Map Config',
        description: 'Discover internal structure and sitemap coverage quickly.',
        icon: LinkSquare01Icon,
    },
};

interface ConfigurationPanelProps {
    url: string;
    setUrl: (url: string) => void;
    tool: WebsiteTool;
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
    crawlLimit: number;
    setCrawlLimit: (value: number) => void;
    crawlDepth: number;
    setCrawlDepth: (value: number) => void;
    includeSubdomains: boolean;
    setIncludeSubdomains: (value: boolean) => void;
    includeExternal: boolean;
    setIncludeExternal: (value: boolean) => void;
    useSitemap: boolean;
    setUseSitemap: (value: boolean) => void;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

export function ConfigurationPanel({
    url,
    setUrl,
    tool,
    outputType,
    setOutputType,
    selector,
    setSelector,
    timeout,
    setTimeoutValue,
    showAdvanced,
    setShowAdvanced,
    stealth,
    setStealth,
    crawlLimit,
    setCrawlLimit,
    crawlDepth,
    setCrawlDepth,
    includeSubdomains,
    setIncludeSubdomains,
    includeExternal,
    setIncludeExternal,
    useSitemap,
    setUseSitemap,
    isPending,
    onRun,
    onStop,
}: ConfigurationPanelProps) {
    const panelMeta = PANEL_META[tool];
    const PanelIcon = panelMeta.icon;
    const isDisabled = isPending;
    const advancedSummary = [
        `${timeout / 1000}s timeout`,
        selector ? 'Custom selector' : 'No selector',
        stealth ? 'Stealth on' : 'Stealth off',
    ].join(' • ');

    const buttonLabel = tool === 'scrape'
        ? 'Run Scrape'
        : tool === 'crawl'
            ? 'Queue Crawl'
            : 'Run Map';

    return (
        <div className="space-y-6 lg:col-span-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <div className={`space-y-6 ${isDisabled ? 'pointer-events-none opacity-70' : ''}`}>
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] text-slate-900 ring-1 ring-slate-200">
                            <HugeiconsIcon icon={PanelIcon} className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{panelMeta.title}</h2>
                            <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">{panelMeta.description}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Target URL
                        </label>
                        <div className="relative">
                            <input
                                value={url}
                                onChange={(event) => setUrl(event.target.value)}
                                placeholder="https://example.com"
                                disabled={isDisabled}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400"
                            />
                            {url.startsWith('http') && (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <HugeiconsIcon icon={LinkSquare01Icon} className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    {tool === 'scrape' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Output Format
                            </label>
                            <CustomDropdown
                                value={outputType}
                                onChange={(value) => setOutputType(value as OutputType)}
                                options={OUTPUT_TYPE_OPTIONS}
                                placeholder="Select output format"
                                icon={File01Icon}
                            />
                        </div>
                    )}

                    {(tool === 'crawl' || tool === 'map') && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    {tool === 'crawl' ? 'Page Limit' : 'Link Limit'}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={tool === 'crawl' ? 100 : 250}
                                    value={crawlLimit}
                                    onChange={(event) => setCrawlLimit(Number(event.target.value))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 hover:bg-white focus:border-slate-400"
                                />
                            </div>

                            {tool === 'crawl' && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                        Max Depth
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={4}
                                        value={crawlDepth}
                                        onChange={(event) => setCrawlDepth(Number(event.target.value))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 hover:bg-white focus:border-slate-400"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {tool === 'crawl' && (
                        <ToggleRow
                            label="Include Subdomains"
                            description="Allow the crawl queue to follow pages on docs.example.com and other subdomains."
                            checked={includeSubdomains}
                            onChange={setIncludeSubdomains}
                            disabled={isDisabled}
                        />
                    )}

                    {tool === 'map' && (
                        <div className="space-y-3">
                            <ToggleRow
                                label="Use Sitemap"
                                description="Merge `/sitemap.xml` links with on-page discovery when available."
                                checked={useSitemap}
                                onChange={setUseSitemap}
                                disabled={isDisabled}
                            />
                            <ToggleRow
                                label="Include Subdomains"
                                description="Keep docs/blog subdomains in the map output."
                                checked={includeSubdomains}
                                onChange={setIncludeSubdomains}
                                disabled={isDisabled}
                            />
                            <ToggleRow
                                label="Include External Links"
                                description="Surface third-party links alongside internal discovery."
                                checked={includeExternal}
                                onChange={setIncludeExternal}
                                disabled={isDisabled}
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => !isDisabled && setShowAdvanced(!showAdvanced)}
                            disabled={isDisabled}
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
                                        disabled={isDisabled}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                                    />
                                </div>

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
                                        disabled={isDisabled}
                                        className="w-full accent-slate-900"
                                    />
                                </div>

                                <ToggleRow
                                    label="Stealth Mode"
                                    description="Use the full anti-detection path instead of the faster reduced-interaction mode."
                                    checked={stealth}
                                    onChange={setStealth}
                                    disabled={isDisabled}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={onRun}
                            disabled={isDisabled || !url}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <HugeiconsIcon icon={tool === 'map' ? LinkSquare01Icon : SparklesIcon} className="h-4 w-4" />
                            {buttonLabel}
                        </button>

                        <button
                            type="button"
                            onClick={onStop}
                            disabled={!isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4" />
                            Stop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
