'use client';

import { PlayIcon } from '@hugeicons/core-free-icons';
import { PlaygroundEmptyState } from '../../shared';

export function EmptyState({
    available,
    unavailableReason,
}: {
    available: boolean;
    unavailableReason?: string | null;
}) {
    return (
        <PlaygroundEmptyState
            icon={PlayIcon}
            title={available ? 'Ready to extract' : 'yt-dude engine is not configured'}
            body={available
                ? 'Extract metadata, available formats, subtitles, and playlist previews from a video or playlist URL.'
                : unavailableReason || 'Set YT_ENGINE_URL to your yt-engine service URL and the YouTube workspace will become active.'}
        />
    );
}
