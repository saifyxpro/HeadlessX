import { getPlaygroundOperators } from '@/lib/playgroundAvailability';
import { PlaygroundClient } from '@/components/playground/PlaygroundClient';

export default async function PlaygroundPage() {
    const operators = await getPlaygroundOperators();

    return (
        <PlaygroundClient operators={operators} />
    );
}
