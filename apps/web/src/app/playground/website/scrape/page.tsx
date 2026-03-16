import { Suspense } from 'react';
import { WebsiteWorkbench } from '@/components/playground/website/WebsiteWorkbench';

function WebsiteScrapeFallback() {
    return <div className="min-h-[70vh] rounded-[1.75rem] border border-slate-200 bg-white" />;
}

export default function WebsiteScrapePage() {
    return (
        <Suspense fallback={<WebsiteScrapeFallback />}>
            <WebsiteWorkbench tool="scrape" />
        </Suspense>
    );
}
