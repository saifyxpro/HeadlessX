'use client';

import { PlayIcon } from '@hugeicons/core-free-icons';
import { PlaygroundEmptyState } from '../../shared';

export function EmptyState({ available }: { available: boolean }) {
    return (
        <PlaygroundEmptyState
            icon={PlayIcon}
            title={available ? 'Ready to extract' : 'yt-dude engine is not configured'}
            body={available
                ? 'Extract metadata, available formats, subtitles, and playlist previews from a video or playlist URL.'
                : 'Add YT_ENGINE_URL to your environment and the YouTube workspace will become active.'}
        />
    );
}
