import { YoutubeWorkbench } from '@/components/playground/youtube';
import { getYoutubeAvailability } from '@/lib/playgroundAvailability';

export default async function YoutubeOperatorPage() {
    return <YoutubeWorkbench available={await getYoutubeAvailability()} />;
}
