import { Suspense } from 'react';
import { PlaygroundWorkbenchSkeleton } from '@/components/playground/shared';
import { WebsiteWorkbench } from '@/components/playground/website/WebsiteWorkbench';

export default function WebsiteScrapePage() {
    return (
        <Suspense fallback={<PlaygroundWorkbenchSkeleton />}>
            <WebsiteWorkbench tool="scrape" />
        </Suspense>
    );
}
