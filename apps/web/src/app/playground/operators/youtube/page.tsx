import { YoutubeWorkbench } from '@/components/playground/youtube';
import { getYoutubeAvailabilityState } from '@/lib/playgroundAvailability';

export default async function YoutubeOperatorPage() {
    const availability = await getYoutubeAvailabilityState();

    return (
        <YoutubeWorkbench
            available={availability.available}
            unavailableReason={availability.reason}
        />
    );
}
