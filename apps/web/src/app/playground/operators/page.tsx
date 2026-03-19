import { PlaygroundClient } from '@/components/playground/PlaygroundClient';
import { getPlaygroundOperators } from '@/lib/playgroundAvailability';

export default async function OperatorsPlaygroundPage() {
    const operators = await getPlaygroundOperators();

    return <PlaygroundClient operators={operators} />;
}
