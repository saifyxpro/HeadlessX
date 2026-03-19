import { redirect } from 'next/navigation';

interface LegacyWebsiteScrapePageProps {
    searchParams: Promise<{
        url?: string;
    }>;
}

export default async function WebsiteHtmlScrapePage({ searchParams }: LegacyWebsiteScrapePageProps) {
    const params = await searchParams;
    const query = new URLSearchParams({ format: 'html' });
    if (params.url) {
        query.set('url', params.url);
    }

    redirect(`/playground/operators/website/scrape?${query.toString()}`);
}
