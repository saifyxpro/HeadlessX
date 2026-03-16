import { getExaAvailability } from '@/lib/playgroundAvailability';
import { ExaWorkbench } from '@/components/playground/exa';

export default async function ExaPage() {
    return <ExaWorkbench available={await getExaAvailability()} />;
}
