import { LinkSquare01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface UrlFieldProps {
    url: string;
    setUrl: (url: string) => void;
    lastUsedUrl?: string | null;
    disabled: boolean;
}

export function UrlField({ url, setUrl, lastUsedUrl, disabled }: UrlFieldProps) {
    const showLastUsed = Boolean(lastUsedUrl && url.trim() === lastUsedUrl.trim());
    const showOpenLink = url.startsWith('http');

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Target URL
                </label>
                {showLastUsed && (
                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                        Last Used
                    </span>
                )}
            </div>
            <div className="relative">
                <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    disabled={disabled}
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-slate-400 ${
                        showOpenLink ? 'pr-14' : ''
                    }`}
                />
                {showOpenLink && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Open target URL in a new tab"
                    >
                        <HugeiconsIcon icon={LinkSquare01Icon} className="h-4 w-4" />
                    </a>
                )}
            </div>
        </div>
    );
}
