import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { OutputType, WebsiteTool } from '../types';

type PersistedAdvancedSettings = {
    url: string;
    outputType: OutputType;
    showAdvanced: boolean;
    selector: string;
    timeout: number;
    stealth: boolean;
    crawlLimit: number;
    crawlDepth: number;
    includeSubdomains: boolean;
    includeExternal: boolean;
    useSitemap: boolean;
    crawlEntireDomain: boolean;
    ignoreQueryParameters: boolean;
    includePaths: string;
    excludePaths: string;
};

interface UseWebsiteStorageProps {
    tool: WebsiteTool;
    url: string;
    setUrl: (value: string) => void;
    outputType: OutputType;
    setOutputType: (value: OutputType) => void;
    showAdvanced: boolean;
    setShowAdvanced: (value: boolean) => void;
    selector: string;
    setSelector: (value: string) => void;
    timeout: number;
    setTimeoutValue: (value: number) => void;
    stealth: boolean;
    setStealth: (value: boolean) => void;
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
}

export function useWebsiteStorage({
    tool,
    url,
    setUrl,
    outputType,
    setOutputType,
    showAdvanced,
    setShowAdvanced,
    selector,
    setSelector,
    timeout,
    setTimeoutValue,
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
}: UseWebsiteStorageProps) {
    const searchParams = useSearchParams();
    const [advancedSettingsReady, setAdvancedSettingsReady] = useState(false);
    const [lastUsedUrl, setLastUsedUrl] = useState<string | null>(null);

    useEffect(() => {
        setAdvancedSettingsReady(false);
        const storageKey = `headlessx.playground.website.${tool}.advanced`;
        const storedValue = window.localStorage.getItem(storageKey);

        if (storedValue) {
            try {
                const parsed = JSON.parse(storedValue) as Partial<PersistedAdvancedSettings>;
                if (typeof parsed.url === 'string' && parsed.url.trim().length > 0) {
                    setUrl(parsed.url);
                    setLastUsedUrl(parsed.url);
                }
                if (parsed.outputType === 'html' || parsed.outputType === 'html-js' || parsed.outputType === 'markdown' || parsed.outputType === 'screenshot') {
                    setOutputType(parsed.outputType);
                }
                if (typeof parsed.showAdvanced === 'boolean') {
                    setShowAdvanced(parsed.showAdvanced);
                }
                if (typeof parsed.selector === 'string') {
                    setSelector(parsed.selector);
                }
                if (typeof parsed.timeout === 'number' && Number.isFinite(parsed.timeout)) {
                    setTimeoutValue(parsed.timeout);
                }
                if (typeof parsed.stealth === 'boolean') {
                    setStealth(parsed.stealth);
                }
                if (typeof parsed.crawlLimit === 'number' && Number.isFinite(parsed.crawlLimit)) {
                    setCrawlLimit(parsed.crawlLimit);
                }
                if (typeof parsed.crawlDepth === 'number' && Number.isFinite(parsed.crawlDepth)) {
                    setCrawlDepth(parsed.crawlDepth);
                }
                if (typeof parsed.includeSubdomains === 'boolean') {
                    setIncludeSubdomains(parsed.includeSubdomains);
                }
                if (typeof parsed.includeExternal === 'boolean') {
                    setIncludeExternal(parsed.includeExternal);
                }
                if (typeof parsed.useSitemap === 'boolean') {
                    setUseSitemap(parsed.useSitemap);
                }
                if (typeof parsed.crawlEntireDomain === 'boolean') {
                    setCrawlEntireDomain(parsed.crawlEntireDomain);
                }
                if (typeof parsed.ignoreQueryParameters === 'boolean') {
                    setIgnoreQueryParameters(parsed.ignoreQueryParameters);
                }
                if (typeof parsed.includePaths === 'string') {
                    setIncludePaths(parsed.includePaths);
                }
                if (typeof parsed.excludePaths === 'string') {
                    setExcludePaths(parsed.excludePaths);
                }
            } catch {
                window.localStorage.removeItem(storageKey);
            }
        }

        setAdvancedSettingsReady(true);
    }, [
        setCrawlDepth,
        setCrawlEntireDomain,
        setCrawlLimit,
        setExcludePaths,
        setIncludeExternal,
        setIncludePaths,
        setIncludeSubdomains,
        setIgnoreQueryParameters,
        setOutputType,
        setSelector,
        setShowAdvanced,
        setStealth,
        setTimeoutValue,
        setUrl,
        setUseSitemap,
        tool,
    ]);

    useEffect(() => {
        if (!advancedSettingsReady) {
            return;
        }

        const storageKey = `headlessx.playground.website.${tool}.advanced`;
        const payload: PersistedAdvancedSettings = {
            url,
            outputType,
            showAdvanced,
            selector,
            timeout,
            stealth,
            crawlLimit,
            crawlDepth,
            includeSubdomains,
            includeExternal,
            useSitemap,
            crawlEntireDomain,
            ignoreQueryParameters,
            includePaths,
            excludePaths,
        };

        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastUsedUrl(url.trim() ? url : null);
    }, [
        advancedSettingsReady,
        crawlDepth,
        crawlEntireDomain,
        crawlLimit,
        excludePaths,
        ignoreQueryParameters,
        includeExternal,
        includePaths,
        includeSubdomains,
        outputType,
        selector,
        showAdvanced,
        stealth,
        timeout,
        tool,
        url,
        useSitemap,
    ]);

    useEffect(() => {
        const nextUrl = searchParams.get('url');
        const nextFormat = searchParams.get('format');
        if (nextUrl) {
            setUrl(nextUrl);
        }
        if (
            tool === 'scrape'
            && (nextFormat === 'html' || nextFormat === 'html-js' || nextFormat === 'markdown' || nextFormat === 'screenshot')
        ) {
            setOutputType(nextFormat);
        }
    }, [searchParams, setOutputType, setUrl, tool]);

    return {
        lastUsedUrl,
    };
}
