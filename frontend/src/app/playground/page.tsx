"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    Globe02Icon,
    ArrowRight01Icon,
    Search01Icon,
    CommandLineIcon,
    ArrowRight02Icon,
    CheckmarkBadge01Icon,
    LockKeyIcon,
    SparklesIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

// Scraper Definitions
const SCRAPERS = [
    {
        id: 'website',
        name: 'Website Scraper',
        tagline: 'Universal web extractor',
        description: 'Scrape HTML, render JavaScript, capture screenshots, and export to PDF with enterprise-grade stealth technology.',
        icon: Globe02Icon,
        available: true,
        href: '/playground/website',
        features: ['HTML Extraction', 'JS Rendering', 'Screenshots', 'PDF Export'],
        color: 'text-blue-600',
        bg: 'bg-blue-600/10'
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
        bg: 'bg-red-500/10'
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
        bg: 'bg-sky-500/10'
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
        bg: 'bg-blue-700/10'
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
        bg: 'bg-pink-600/10'
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
        bg: 'bg-slate-900/10'
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
        bg: 'bg-orange-600/10'
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
        bg: 'bg-red-600/10'
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
        bg: 'bg-amber-600/10'
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
        bg: 'bg-blue-600/10'
    }
];

export default function PlaygroundPage() {
    const router = useRouter();
    const [searchUrl, setSearchUrl] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchUrl.trim()) {
            router.push(`/playground/website?url=${encodeURIComponent(searchUrl.trim())}`);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                title="Playground"
                description="Experiment with our powerful scraping engines in real-time."
                icon={<HugeiconsIcon icon={CommandLineIcon} size={24} />}
            />

            {/* Hero / Search Section */}
            <div className="relative overflow-hidden rounded-[40px] border border-white/50 bg-white/40 backdrop-blur-2xl shadow-premium p-8 md:p-12 text-center">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <HugeiconsIcon icon={SparklesIcon} size={200} className="text-primary rotate-12" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-white/60 shadow-sm text-slate-600 text-sm font-semibold mb-6">
                        <HugeiconsIcon icon={CommandLineIcon} size={16} className="text-primary" />
                        <span>Interactive API Playground</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900 leading-tight">
                        What would you like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">scrape today?</span>
                    </h2>

                    <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto">
                        Enter a URL to instantly extract data using our universal web scraper, or select a specialized engine below.
                    </p>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative flex items-center bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                            <div className="pl-4 text-slate-400">
                                <HugeiconsIcon icon={Search01Icon} size={22} />
                            </div>
                            <Input
                                type="text"
                                value={searchUrl}
                                onChange={(e) => setSearchUrl(e.target.value)}
                                placeholder="Paste any URL here (e.g. https://example.com)..."
                                className="border-none shadow-none focus-visible:ring-0 h-12 text-lg bg-transparent placeholder:text-slate-400 text-slate-900 px-4"
                            />
                            <Button
                                type="submit"
                                disabled={!searchUrl.trim()}
                                className="h-12 px-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30"
                            >
                                Scrape
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Scrapers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SCRAPERS.map((scraper) => (
                    scraper.available ? (
                        <Link href={scraper.href} key={scraper.id} className="group block h-full">
                            <Card className="h-full border-white/60 bg-white/60 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden rounded-3xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-slate-50/50 z-0" />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-transparent z-0" />

                                <CardContent className="relative z-10 p-8 h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 bg-white",
                                            scraper.color
                                        )}>
                                            {typeof scraper.icon === 'string' ? (
                                                <img src={scraper.icon} alt={scraper.name} className="w-8 h-8 object-contain" />
                                            ) : (
                                                <HugeiconsIcon icon={scraper.icon} size={32} />
                                            )}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{scraper.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 mb-4">{scraper.tagline}</p>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">{scraper.description}</p>

                                    <div className="mt-auto">
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {scraper.features.map((feature, i) => (
                                                <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 border border-slate-200/50">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center text-sm font-bold text-slate-900 group-hover:text-primary transition-all">
                                            <span>Launch Scraper</span>
                                            <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ) : (
                        <div key={scraper.id} className="h-full block select-none">
                            <Card className="h-full border-slate-100 bg-slate-50/50 transition-all duration-300 relative overflow-hidden rounded-3xl opacity-80 hover:opacity-100">
                                <CardContent className="relative z-10 p-8 h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm bg-slate-100 text-slate-300 grayscale">
                                            {typeof scraper.icon === 'string' ? (
                                                <img src={scraper.icon} alt={scraper.name} className="w-8 h-8 object-contain opacity-40" />
                                            ) : (
                                                <HugeiconsIcon icon={scraper.icon} size={32} />
                                            )}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center gap-1.5">
                                            <HugeiconsIcon icon={LockKeyIcon} size={12} />
                                            soon
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-400 mb-2">{scraper.name}</h3>
                                    <p className="text-sm font-medium text-slate-400 mb-4">{scraper.tagline}</p>
                                    <p className="text-slate-400/80 text-sm leading-relaxed mb-8 line-clamp-3">{scraper.description}</p>

                                    <div className="mt-auto">
                                        <div className="flex flex-wrap gap-2 mb-6 opacity-60">
                                            {scraper.features.map((feature, i) => (
                                                <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 border border-slate-200/50">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center text-sm font-bold text-slate-400">
                                            <span>Not Available</span>
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