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
            } catch {
                window.localStorage.removeItem(storageKey);
            }
        }

        setAdvancedSettingsReady(true);
    }, [setOutputType, setSelector, setShowAdvanced, setStealth, setTimeoutValue, setUrl, tool]);

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
        };

        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastUsedUrl(url.trim() ? url : null);
    }, [advancedSettingsReady, outputType, selector, showAdvanced, stealth, timeout, tool, url]);

    useEffect(() => {
        const nextUrl = searchParams.get('url');
        if (nextUrl) {
            setUrl(nextUrl);
        }
    }, [searchParams, setUrl]);

    return {
        lastUsedUrl,
    };
}
