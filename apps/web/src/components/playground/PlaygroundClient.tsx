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

type PlaygroundTool = {
    id: string;
    name: string;
    tagline: string;
    description: string;
    icon: typeof Globe02Icon | string;
    available: boolean;
    href: string;
    features: string[];
    color: string;
    bg: string;
    inactiveLabel?: string;
};

interface PlaygroundClientProps {
    exaAvailable: boolean;
    tavilyAvailable: boolean;
}

export function PlaygroundClient({ exaAvailable, tavilyAvailable }: PlaygroundClientProps) {
    const router = useRouter();
    const [searchUrl, setSearchUrl] = useState('');

    const getInactiveMessage = (tool: PlaygroundTool) => {
        if (tool.inactiveLabel !== 'env required') {
            return 'Not Available';
        }

        if (tool.id === 'exa') {
            return 'Add Exa API key';
        }

        if (tool.id === 'tavily') {
            return 'Add Tavily API key';
        }

        return 'Add API key';
    };

    const scrapers: PlaygroundTool[] = [
        {
            id: 'website',
            name: 'Website',
            tagline: 'Universal web extraction',
            description: 'Extract HTML, render JavaScript, capture screenshots, crawl pages, and map links with enterprise-grade stealth technology.',
            icon: Globe02Icon,
            available: true,
            href: '/playground/website/scrape',
            features: ['Extract', 'Crawl', 'Map'],
            color: 'text-blue-600',
            bg: 'bg-blue-600/10',
        },
        {
            id: 'google-serp',
            name: 'Google Search',
            tagline: 'SERP & Intelligence',
            description: 'Extract organic results, featured snippets, People Also Ask, and more from Google search pages.',
            icon: '/icons/google.svg',
            available: true,
            href: '/playground/google-serp',
            features: ['Organic Results', 'Featured Snippets', 'PAA', 'Maps'],
            color: 'text-red-500',
            bg: 'bg-red-500/10',
        },
        {
            id: 'tavily',
            name: 'Tavily',
            tagline: 'Search API workspace',
            description: 'Prepare Tavily-powered web search and extraction flows with a dedicated workbench shell inside the playground.',
            icon: '/icons/tavily.svg',
            available: tavilyAvailable,
            href: '/playground/tavily',
            features: ['Search', 'Extract', 'Research'],
            color: 'text-emerald-600',
            bg: 'bg-emerald-600/10',
            inactiveLabel: 'env required',
        },
        {
            id: 'exa',
            name: 'Exa',
            tagline: 'LLM-first web search',
            description: 'Search the web with Exa using highlights, text extraction, category filters, and optional deep search synthesis.',
            icon: '/icons/exa.svg',
            available: exaAvailable,
            href: '/playground/exa',
            features: ['Search', 'Highlights', 'Deep Search'],
            color: 'text-slate-900',
            bg: 'bg-slate-900/10',
            inactiveLabel: 'env required',
        },
        {
            id: 'twitter',
            name: 'Twitter / X',
            tagline: 'Social data extraction',
            description: 'Scrape profiles, tweets, replies, and trends from Twitter/X with automatic authentication handling.',
            icon: '/icons/twitter.svg',
            available: false,
            href: '/playground/twitter',
            features: ['Profile Data', 'Tweets', 'Replies', 'Trends'],
            color: 'text-sky-500',
            bg: 'bg-sky-500/10',
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            tagline: 'Professional network data',
            description: 'Extract public profile data, job postings, and company information from LinkedIn.',
            icon: '/icons/linkedin.svg',
            available: false,
            href: '/playground/linkedin',
            features: ['Profiles', 'Jobs', 'Company Data', 'Posts'],
            color: 'text-blue-700',
            bg: 'bg-blue-700/10',
        },
        {
            id: 'instagram',
            name: 'Instagram',
            tagline: 'Visual content scraper',
            description: 'Download posts, reels, stories, and extract profile analytics from Instagram.',
            icon: '/icons/instagram.svg',
            available: false,
            href: '/playground/instagram',
            features: ['Posts', 'Reels', 'Stories', 'Analytics'],
            color: 'text-pink-600',
            bg: 'bg-pink-600/10',
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            tagline: 'Short-form video data',
            description: 'Scrape trending videos, hashtags, music usage, and user profiles from TikTok.',
            icon: '/icons/tiktok.svg',
            available: false,
            href: '/playground/tiktok',
            features: ['Videos', 'Hashtags', 'Profiles', 'Music'],
            color: 'text-slate-900',
            bg: 'bg-slate-900/10',
        },
        {
            id: 'reddit',
            name: 'Reddit',
            tagline: 'Community discussions',
            description: 'Extract posts, comments, and sentiment from subreddits and user histories.',
            icon: '/icons/reddit.svg',
            available: false,
            href: '/playground/reddit',
            features: ['Subreddits', 'Comments', 'Users', 'Sentiment'],
            color: 'text-orange-600',
            bg: 'bg-orange-600/10',
        },
        {
            id: 'youtube',
            name: 'YouTube',
            tagline: 'Video platform data',
            description: 'Scrape video details, comments, transcripts, and channel statistics.',
            icon: '/icons/youtube.svg',
            available: false,
            href: '/playground/youtube',
            features: ['Videos', 'Comments', 'Transcripts', 'Channels'],
            color: 'text-red-600',
            bg: 'bg-red-600/10',
        },
        {
            id: 'amazon',
            name: 'Amazon',
            tagline: 'E-commerce intelligence',
            description: 'Extract product details, pricing, reviews, and best-seller rankings.',
            icon: '/icons/amazon.svg',
            available: false,
            href: '/playground/amazon',
            features: ['Products', 'Reviews', 'Pricing', 'Bestsellers'],
            color: 'text-amber-600',
            bg: 'bg-amber-600/10',
        },
        {
            id: 'facebook',
            name: 'Facebook',
            tagline: 'Social graph data',
            description: 'Extract public pages, posts, and group information with stealth.',
            icon: '/icons/facebook.svg',
            available: false,
            href: '/playground/facebook',
            features: ['Pages', 'Posts', 'Groups', 'About'],
            color: 'text-blue-600',
            bg: 'bg-blue-600/10',
        },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchUrl.trim()) {
            router.push(`/playground/website/scrape?url=${encodeURIComponent(searchUrl.trim())}`);
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
                        What would you like to <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">scrape today?</span>
                    </h2>

                    <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500">
                        Enter a URL to instantly extract website data, or select a specialized engine below.
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
                {scrapers.map((scraper) => (
                    scraper.available ? (
                        <Link href={scraper.href} key={scraper.id} className="group block h-full">
                            <Card className="relative h-full overflow-hidden border-slate-200 bg-white">
                                <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/80 to-slate-50/50" />
                                <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                                <CardContent className="relative z-10 flex h-full flex-col p-8">
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className={cn(
                                            "flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-inner transition-transform duration-500 group-hover:scale-110",
                                            scraper.color
                                        )}>
                                            {typeof scraper.icon === 'string' ? (
                                                <img src={scraper.icon} alt={scraper.name} className="h-8 w-8 object-contain" />
                                            ) : (
                                                <HugeiconsIcon icon={scraper.icon} size={32} />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-full border border-emerald-100/50 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </div>
                                    </div>

                                    <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-primary">{scraper.name}</h3>
                                    <p className="mb-4 text-sm font-medium text-slate-500">{scraper.tagline}</p>
                                    <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-500">{scraper.description}</p>

                                    <div className="mt-auto">
                                        <div className="mb-6 flex flex-wrap gap-2">
                                            {scraper.features.map((feature) => (
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
                        <div key={scraper.id} className="block h-full select-none">
                            <Card className="relative h-full overflow-hidden border-slate-200 bg-slate-50 opacity-80 hover:opacity-100">
                                <CardContent className="relative z-10 flex h-full flex-col p-8">
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 shadow-sm grayscale">
                                            {typeof scraper.icon === 'string' ? (
                                                <img src={scraper.icon} alt={scraper.name} className="h-8 w-8 object-contain opacity-40" />
                                            ) : (
                                                <HugeiconsIcon icon={scraper.icon} size={32} />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                            <HugeiconsIcon icon={LockKeyIcon} size={12} />
                                            {scraper.inactiveLabel ?? 'soon'}
                                        </div>
                                    </div>

                                    <h3 className="mb-2 text-xl font-bold text-slate-400">{scraper.name}</h3>
                                    <p className="mb-4 text-sm font-medium text-slate-400">{scraper.tagline}</p>
                                    <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-400/80">{scraper.description}</p>

                                    <div className="mt-auto">
                                        <div className="mb-6 flex flex-wrap gap-2 opacity-60">
                                            {scraper.features.map((feature) => (
                                                <span key={feature} className="rounded-md border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center text-sm font-bold text-slate-400">
                                            <span>{getInactiveMessage(scraper)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
