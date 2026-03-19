import { TavilyWorkbench } from '@/components/playground/tavily';
import { getTavilyAvailability } from '@/lib/playgroundAvailability';

export default async function TavilyOperatorPage() {
    return <TavilyWorkbench available={await getTavilyAvailability()} />;
}
