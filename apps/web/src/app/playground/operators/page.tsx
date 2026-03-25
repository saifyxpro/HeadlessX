import { PlaygroundClient } from '@/components/playground/PlaygroundClient';
import { getPlaygroundOperators } from '@/lib/playgroundAvailability';

export const dynamic = 'force-dynamic';

export default async function OperatorsPlaygroundPage() {
    const operators = await getPlaygroundOperators();

    return <PlaygroundClient operators={operators} />;
}
