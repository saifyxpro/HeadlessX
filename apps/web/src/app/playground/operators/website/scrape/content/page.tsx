import { redirect } from 'next/navigation';

interface LegacyWebsiteScrapePageProps {
    searchParams: Promise<{
        url?: string;
    }>;
}

export default async function WebsiteContentScrapePage({ searchParams }: LegacyWebsiteScrapePageProps) {
    const params = await searchParams;
    const query = new URLSearchParams({ format: 'markdown' });
    if (params.url) {
        query.set('url', params.url);
    }

    redirect(`/playground/operators/website/scrape?${query.toString()}`);
}
