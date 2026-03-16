import { Suspense } from 'react';
import { PlaygroundWorkbenchSkeleton } from '@/components/playground/shared';
import { WebsiteWorkbench } from '@/components/playground/website/WebsiteWorkbench';

export default function WebsiteCrawlPage() {
    return (
        <Suspense fallback={<PlaygroundWorkbenchSkeleton />}>
            <WebsiteWorkbench tool="crawl" />
        </Suspense>
    );
}
