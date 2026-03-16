import { getYoutubeAvailability } from '@/lib/playgroundAvailability';
import { YoutubeWorkbench } from '@/components/playground/youtube';

export default async function YoutubePage() {
    return <YoutubeWorkbench available={await getYoutubeAvailability()} />;
}
