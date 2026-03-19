import { ExaWorkbench } from '@/components/playground/exa';
import { getExaAvailability } from '@/lib/playgroundAvailability';

export default async function ExaOperatorPage() {
    return <ExaWorkbench available={await getExaAvailability()} />;
}
