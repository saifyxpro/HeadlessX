import { getPlaygroundAvailability } from '@/lib/playgroundAvailability';
import { PlaygroundClient } from '@/components/playground/PlaygroundClient';

export default async function PlaygroundPage() {
    const { youtubeAvailable, exaAvailable, tavilyAvailable } = await getPlaygroundAvailability();

    return (
        <PlaygroundClient
            youtubeAvailable={youtubeAvailable}
            exaAvailable={exaAvailable}
            tavilyAvailable={tavilyAvailable}
        />
    );
}
