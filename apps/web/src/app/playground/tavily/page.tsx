import { getTavilyAvailability } from '@/lib/playgroundAvailability';
import { TavilyWorkbench } from '@/components/playground/tavily';

export default async function TavilyPage() {
    return <TavilyWorkbench available={await getTavilyAvailability()} />;
}
