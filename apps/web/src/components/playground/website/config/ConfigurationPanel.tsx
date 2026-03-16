import {
    File01Icon,
    Image01Icon,
    LinkSquare01Icon,
    Search01Icon,
    SparklesIcon,
    ZapIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { OutputType, OutputTypeOption, WebsiteTool } from '../types';
import { ActionButtons } from './ActionButtons';
import { AdvancedSettings } from './AdvancedSettings';
import { CustomDropdown } from './CustomDropdown';
import { ToggleRow } from './ToggleRow';
import { UrlField } from './UrlField';
import { ConfigPanelShell } from '../../shared';

const OUTPUT_TYPES: OutputTypeOption[] = [
    { id: 'html', label: 'HTML', icon: File01Icon },
    { id: 'html-js', label: 'Rendered HTML', icon: ZapIcon },
    { id: 'markdown', label: 'Markdown', icon: File01Icon },
    { id: 'screenshot', label: 'Screenshot', icon: Image01Icon },
];

const OUTPUT_TYPE_OPTIONS = OUTPUT_TYPES.map((type) => ({
    value: type.id,
    label: type.label,
}));

const PANEL_META: Record<WebsiteTool, { title: string; description: string; icon: typeof Search01Icon }> = {
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

export interface WebsiteConfigurationPanelProps {
    url: string;
    setUrl: (url: string) => void;
    lastUsedUrl?: string | null;
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
    crawlEntireDomain: boolean;
    setCrawlEntireDomain: (value: boolean) => void;
    ignoreQueryParameters: boolean;
    setIgnoreQueryParameters: (value: boolean) => void;
    includePaths: string;
    setIncludePaths: (value: string) => void;
    excludePaths: string;
    setExcludePaths: (value: string) => void;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

export function ConfigurationPanel({
    url,
    setUrl,
    lastUsedUrl,
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
    crawlEntireDomain,
    setCrawlEntireDomain,
    ignoreQueryParameters,
    setIgnoreQueryParameters,
    includePaths,
    setIncludePaths,
    excludePaths,
    setExcludePaths,
    isPending,
    onRun,
    onStop,
}: WebsiteConfigurationPanelProps) {
    const panelMeta = PANEL_META[tool];
    const PanelIcon = panelMeta.icon;

    return (
        <ConfigPanelShell
            disabled={isPending}
            iconSlot={
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] text-slate-900 ring-1 ring-slate-200">
                    <HugeiconsIcon icon={PanelIcon} className="h-5 w-5" />
                </div>
            }
            title={panelMeta.title}
            description={panelMeta.description}
        >
            <div className="space-y-6">
                <UrlField url={url} setUrl={setUrl} lastUsedUrl={lastUsedUrl} disabled={isPending} />

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
                                            disabled={isPending}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 hover:bg-white focus:border-slate-400"
                                        />
                                    </div>

                                    {(tool === 'crawl' || tool === 'map') && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                {tool === 'crawl' ? 'Max Depth' : 'Discovery Depth'}
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={tool === 'crawl' ? 4 : 3}
                                                value={crawlDepth}
                                                onChange={(event) => setCrawlDepth(Number(event.target.value))}
                                                disabled={isPending}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 hover:bg-white focus:border-slate-400"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {tool === 'crawl' && (
                                <div className="space-y-3">
                                    <ToggleRow
                                        label="Full Domain Scope"
                                        description="Follow internal links across the whole domain instead of keeping the crawl under the starting path."
                                        checked={crawlEntireDomain}
                                        onChange={setCrawlEntireDomain}
                                        disabled={isPending}
                                    />
                                    <ToggleRow
                                        label="Include Subdomains"
                                        description="Allow the crawl queue to follow pages on docs.example.com and other subdomains."
                                        checked={includeSubdomains}
                                        onChange={setIncludeSubdomains}
                                        disabled={isPending}
                                    />
                                    <ToggleRow
                                        label="Include External Links"
                                        description="Allow the crawl queue to follow third-party links that pass the configured filters."
                                        checked={includeExternal}
                                        onChange={setIncludeExternal}
                                        disabled={isPending}
                                    />
                                    <ToggleRow
                                        label="Ignore Query Parameters"
                                        description="Collapse `?page=1` style URL variants into a cleaner canonical crawl list."
                                        checked={ignoreQueryParameters}
                                        onChange={setIgnoreQueryParameters}
                                        disabled={isPending}
                                    />
                                </div>
                            )}

                            {tool === 'map' && (
                                <div className="space-y-3">
                                    <ToggleRow
                                        label="Use Sitemap"
                                        description="Merge `/sitemap.xml` links with on-page discovery when available."
                                        checked={useSitemap}
                                        onChange={setUseSitemap}
                                        disabled={isPending}
                                    />
                                    <ToggleRow
                                        label="Full Domain Scope"
                                        description="Expand discovery across the full domain instead of staying under the starting path."
                                        checked={crawlEntireDomain}
                                        onChange={setCrawlEntireDomain}
                                        disabled={isPending}
                                    />
                                    <ToggleRow
                                        label="Include Subdomains"
                                        description="Keep docs/blog subdomains in the map output."
                                        checked={includeSubdomains}
                                        onChange={setIncludeSubdomains}
                                        disabled={isPending}
                                    />
                                    <ToggleRow
                                        label="Include External Links"
                                        description="Surface third-party links alongside internal discovery."
                                        checked={includeExternal}
                                        onChange={setIncludeExternal}
                                        disabled={isPending}
                                    />
                                    <ToggleRow
                                        label="Ignore Query Parameters"
                                        description="Deduplicate `?ref=` and faceted URL variants while building the map."
                                        checked={ignoreQueryParameters}
                                        onChange={setIgnoreQueryParameters}
                                        disabled={isPending}
                                    />
                                </div>
                            )}

                <AdvancedSettings
                    tool={tool}
                    selector={selector}
                    setSelector={setSelector}
                    timeout={timeout}
                    setTimeoutValue={setTimeoutValue}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    stealth={stealth}
                    setStealth={setStealth}
                    includePaths={includePaths}
                    setIncludePaths={setIncludePaths}
                    excludePaths={excludePaths}
                    setExcludePaths={setExcludePaths}
                    disabled={isPending}
                />
            </div>

            <div className="pt-4">
                <ActionButtons
                    tool={tool}
                    isPending={isPending}
                    hasUrl={Boolean(url)}
                    onRun={onRun}
                    onStop={onStop}
                />
            </div>
        </ConfigPanelShell>
    );
}
