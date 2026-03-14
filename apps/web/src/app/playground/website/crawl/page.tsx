import { Suspense } from 'react';
import { WebsiteWorkbench } from '@/components/playground/website/WebsiteWorkbench';

function WebsiteCrawlFallback() {
    return <div className="min-h-[70vh] rounded-[1.75rem] border border-slate-200 bg-white" />;
}

export default function WebsiteCrawlPage() {
    return (
        <Suspense fallback={<WebsiteCrawlFallback />}>
            <WebsiteWorkbench tool="crawl" />
        </Suspense>
    );
}
