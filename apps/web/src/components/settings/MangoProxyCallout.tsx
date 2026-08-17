'use client';

import { useEffect, useState } from 'react';
import { Cancel01Icon, Copy01Icon, CheckmarkCircle02Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'headlessx-mangoproxy-callout-dismissed';
const MANGOPROXY_URL =
    'https://mangoproxy.com/prod-isp-static/?utm_source=saifyxpro&utm_medium=partner&utm_campaign=saifyxpro_github';

const PROMO_CODES = [{ code: 'SAIFYXPRO', label: '8% off Static ISP Proxies' }] as const;

function PromoCodePill({ code, label }: { code: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={() => {
                void handleCopy();
            }}
            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-amber-200 hover:bg-amber-50/40"
            title={`Copy ${code}`}
        >
            <div className="min-w-0">
                <div className="font-mono text-sm font-semibold text-slate-900">{code}</div>
                <div className="mt-0.5 text-xs text-slate-500">{label}</div>
            </div>
            <HugeiconsIcon
                icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
                size={16}
                className={cn('shrink-0', copied ? 'text-emerald-500' : 'text-slate-400 group-hover:text-amber-600')}
            />
        </button>
    );
}

export function MangoProxyCallout() {
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, '1');
        setDismissed(true);
    };

    if (dismissed) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,1))] p-5">
            <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-600"
                aria-label="Dismiss Mango Proxy recommendation"
            >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-start">
                <img
                    src="/mangoproxy-square-icon.png"
                    alt="Mango Proxy"
                    className="h-10 w-10 shrink-0 rounded-lg border border-amber-100 bg-black object-contain p-1"
                />
                <div className="min-w-0 flex-1 space-y-3">
                    <div>
                        <div className="mb-1 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                            Recommended provider
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Mango Proxy provides residential, ISP, datacenter, and mobile proxies for automation, web
                            scraping, SEO, and social workflows. HTTP(S) and SOCKS5, rotating or static.
                        </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        {PROMO_CODES.map((promo) => (
                            <PromoCodePill key={promo.code} code={promo.code} label={promo.label} />
                        ))}
                    </div>

                    <a
                        href={MANGOPROXY_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 transition-colors hover:text-amber-900"
                    >
                        Get Mango Proxy
                        <HugeiconsIcon icon={LinkSquare01Icon} size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}
