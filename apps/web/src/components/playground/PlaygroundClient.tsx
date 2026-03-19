"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    Globe02Icon,
    ArrowRight01Icon,
    Search01Icon,
    CommandLineIcon,
    LockKeyIcon,
    SparklesIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import type { PlaygroundOperator } from '@/lib/playgroundAvailability';

type PlaygroundOperatorVisual = {
    icon: typeof Globe02Icon | string;
    color: string;
    bg: string;
};

interface PlaygroundClientProps {
    operators: PlaygroundOperator[];
}

const OPERATOR_VISUALS: Record<string, PlaygroundOperatorVisual> = {
    website: {
        icon: Globe02Icon,
        color: 'text-blue-600',
        bg: 'bg-blue-600/10',
    },
    google: {
        icon: '/icons/google.svg',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
    },
    tavily: {
        icon: '/icons/tavily.svg',
        color: 'text-emerald-600',
        bg: 'bg-emerald-600/10',
    },
    exa: {
        icon: '/icons/exa.svg',
        color: 'text-slate-900',
        bg: 'bg-slate-900/10',
    },
    twitter: {
        icon: '/icons/twitter.svg',
        color: 'text-sky-500',
        bg: 'bg-sky-500/10',
    },
    linkedin: {
        icon: '/icons/linkedin.svg',
        color: 'text-blue-700',
        bg: 'bg-blue-700/10',
    },
    instagram: {
        icon: '/icons/instagram.svg',
        color: 'text-pink-600',
        bg: 'bg-pink-600/10',
    },
    tiktok: {
        icon: '/icons/tiktok.svg',
        color: 'text-slate-900',
        bg: 'bg-slate-900/10',
    },
    reddit: {
        icon: '/icons/reddit.svg',
        color: 'text-orange-600',
        bg: 'bg-orange-600/10',
    },
    youtube: {
        icon: '/icons/youtube.svg',
        color: 'text-red-600',
        bg: 'bg-red-600/10',
    },
    amazon: {
        icon: '/icons/amazon.svg',
        color: 'text-amber-600',
        bg: 'bg-amber-600/10',
    },
    facebook: {
        icon: '/icons/facebook.svg',
        color: 'text-blue-600',
        bg: 'bg-blue-600/10',
    },
};

function getOperatorVisual(id: string): PlaygroundOperatorVisual {
    return OPERATOR_VISUALS[id] || {
        icon: Globe02Icon,
        color: 'text-slate-600',
        bg: 'bg-slate-600/10',
    };
}

export function PlaygroundClient({ operators }: PlaygroundClientProps) {
    const router = useRouter();
    const [searchUrl, setSearchUrl] = useState('');

    const getInactiveMessage = (operator: PlaygroundOperator) => {
        if (operator.reason) {
            return operator.reason;
        }

        if (operator.comingSoon) {
            return 'Coming soon';
        }

        return 'Not Available';
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchUrl.trim()) {
            router.push(`/playground/operators/website/scrape?url=${encodeURIComponent(searchUrl.trim())}`);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <PageHeader
                title="Playground"
                description="Experiment with our powerful scraping engines in real-time."
                icon={<HugeiconsIcon icon={CommandLineIcon} size={24} />}
            />

            <div className="group ui-panel relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center transition-all duration-500 ease-out hover:border-blue-200 md:p-10">
                {/* Premium Animated Gradients */}
                <div className="pointer-events-none absolute -top-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-gradient-to-bl from-blue-400/20 via-primary/5 to-transparent blur-3xl transition-all duration-1000 ease-out group-hover:scale-110 group-hover:from-blue-500/30 group-hover:via-blue-600/10" />
                <div className="pointer-events-none absolute -bottom-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl transition-all duration-1000 ease-out group-hover:scale-110 group-hover:from-emerald-500/25 group-hover:via-teal-500/10" />
                
                {/* Floating Modern Icons */}
                <div className="absolute top-8 right-12 flex items-center justify-center text-blue-500/10 transition-all duration-1000 ease-out group-hover:-translate-y-4 group-hover:rotate-12 group-hover:scale-110 group-hover:text-blue-600/20 pointer-events-none select-none">
                    <HugeiconsIcon icon={SparklesIcon} size={180} />
                </div>
                <div className="absolute -bottom-8 -left-8 flex items-center justify-center text-emerald-500/5 transition-all duration-1000 ease-out group-hover:translate-y-2 group-hover:-rotate-12 group-hover:scale-105 group-hover:text-emerald-600/15 pointer-events-none select-none">
                    <HugeiconsIcon icon={Globe02Icon} size={280} />
                </div>
                <div className="absolute top-1/4 left-12 flex items-center justify-center text-teal-500/5 transition-all duration-1000 ease-out group-hover:-translate-y-3 group-hover:rotate-6 group-hover:scale-110 group-hover:text-teal-500/15 pointer-events-none select-none">
                    <HugeiconsIcon icon={CommandLineIcon} size={100} />
                </div>
                <div className="absolute bottom-1/4 right-1/4 flex items-center justify-center text-blue-400/10 transition-all duration-1000 ease-out group-hover:-translate-y-5 group-hover:-rotate-6 group-hover:scale-110 group-hover:text-blue-500/20 pointer-events-none select-none">
                    <HugeiconsIcon icon={Search01Icon} size={120} />
                </div>

                <div className="relative z-10 mx-auto max-w-3xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600">
                        <HugeiconsIcon icon={CommandLineIcon} size={16} className="text-primary" />
                        <span>Interactive API Playground</span>
                    </div>

                    <h2 className="mb-6 text-4xl leading-tight font-bold tracking-tight text-slate-900 md:text-5xl">
                        Which <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">operator</span> do you want to run?
                    </h2>

                    <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500">
                        Enter a URL to instantly extract website data, or select a specialized operator below.
                    </p>

                    <form onSubmit={handleSearch} className="group relative mx-auto max-w-2xl">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/20 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />
                        <div className="ui-panel-soft relative flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-primary/40">
                            <div className="pl-4 text-slate-400">
                                <HugeiconsIcon icon={Search01Icon} size={22} />
                            </div>
                            <Input
                                type="text"
                                value={searchUrl}
                                onChange={(e) => setSearchUrl(e.target.value)}
                                placeholder="Paste any URL here (e.g. https://example.com)..."
                                className="h-12 border-none bg-transparent px-4 text-lg text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                            />
                            <Button
                                type="submit"
                                disabled={!searchUrl.trim()}
                                className="h-11 rounded-xl bg-slate-900 px-6 font-medium text-white hover:bg-slate-800"
                            >
                                Scrape
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {operators.map((operator) => {
                    const visual = getOperatorVisual(operator.id);
                    return operator.available ? (
                        <Link href={operator.playgroundHref} key={operator.id} className="group block h-full">
                            <Card className="relative h-full overflow-hidden border-slate-200 bg-white">
                                <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/80 to-slate-50/50" />
                                <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                                <CardContent className="relative z-10 flex h-full flex-col p-8">
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className={cn(
                                            "flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-inner transition-transform duration-500 group-hover:scale-110",
                                            visual.color
                                        )}>
                                            {typeof visual.icon === 'string' ? (
                                                <img src={visual.icon} alt={operator.name} className="h-8 w-8 object-contain" />
                                            ) : (
                                                <HugeiconsIcon icon={visual.icon} size={32} />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-full border border-emerald-100/50 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </div>
                                    </div>

                                    <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-primary">{operator.name}</h3>
                                    <p className="mb-4 text-sm font-medium text-slate-500">{operator.tagline}</p>
                                    <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-500">{operator.description}</p>

                                    <div className="mt-auto">
                                        <div className="mb-6 flex flex-wrap gap-2">
                                            {operator.features.map((feature) => (
                                                <span key={feature} className="rounded-md border border-slate-200/60 bg-white shadow-sm px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center text-sm font-bold text-slate-900 transition-all group-hover:text-primary">
                                            <span>Launch</span>
                                            <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ) : (
                        <div key={operator.id} className="block h-full select-none">
                            <Card className="relative h-full overflow-hidden border-slate-200 bg-slate-50 opacity-80 hover:opacity-100">
                                <CardContent className="relative z-10 flex h-full flex-col p-8">
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 shadow-sm grayscale">
                                            {typeof visual.icon === 'string' ? (
                                                <img src={visual.icon} alt={operator.name} className="h-8 w-8 object-contain opacity-40" />
                                            ) : (
                                                <HugeiconsIcon icon={visual.icon} size={32} />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                            <HugeiconsIcon icon={LockKeyIcon} size={12} />
                                            {operator.comingSoon ? 'soon' : 'setup required'}
                                        </div>
                                    </div>

                                    <h3 className="mb-2 text-xl font-bold text-slate-400">{operator.name}</h3>
                                    <p className="mb-4 text-sm font-medium text-slate-400">{operator.tagline}</p>
                                    <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-400/80">{operator.description}</p>

                                    <div className="mt-auto">
                                        <div className="mb-6 flex flex-wrap gap-2 opacity-60">
                                            {operator.features.map((feature) => (
                                                <span key={feature} className="rounded-md border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center text-sm font-bold text-slate-400">
                                            <span>{getInactiveMessage(operator)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
