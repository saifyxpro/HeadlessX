export type PlaygroundOperatorState =
    | 'active'
    | 'configuration_required'
    | 'coming_soon'
    | 'offline';

export interface PlaygroundOperator {
    id: string;
    name: string;
    tagline: string;
    description: string;
    category: 'website' | 'search' | 'media' | 'social' | 'commerce';
    features: string[];
    playgroundHref: string;
    apiBasePath?: string;
    order: number;
    available: boolean;
    comingSoon: boolean;
    state: PlaygroundOperatorState;
    reason: string | null;
}

type PlaygroundOperatorsPayload = {
    success?: boolean;
    data?: {
        operators?: PlaygroundOperator[];
    };
};

const backendApiUrl =
    process.env.INTERNAL_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
const dashboardInternalApiKey = process.env.DASHBOARD_INTERNAL_API_KEY?.trim();

async function fetchOperators(): Promise<PlaygroundOperator[]> {
    if (!backendApiUrl || !dashboardInternalApiKey) {
        return [];
    }

    try {
        const response = await fetch(new URL('/api/playground/operators', backendApiUrl), {
            method: 'GET',
            headers: { 'x-api-key': dashboardInternalApiKey },
            cache: 'no-store',
        });

        if (!response.ok) {
            return [];
        }

        const payload = (await response.json()) as PlaygroundOperatorsPayload;
        return payload.success ? (payload.data?.operators ?? []) : [];
    } catch {
        return [];
    }
}

export async function getPlaygroundOperators() {
    return fetchOperators();
}

export async function getTavilyAvailability() {
    const operators = await fetchOperators();
    return operators.find((operator) => operator.id === 'tavily')?.available ?? false;
}

export async function getExaAvailability() {
    const operators = await fetchOperators();
    return operators.find((operator) => operator.id === 'exa')?.available ?? false;
}

export async function getYoutubeAvailability() {
    const operators = await fetchOperators();
    return operators.find((operator) => operator.id === 'youtube')?.available ?? false;
}

export async function getPlaygroundAvailability() {
    const operators = await fetchOperators();

    return {
        youtubeAvailable: operators.find((operator) => operator.id === 'youtube')?.available ?? false,
        exaAvailable: operators.find((operator) => operator.id === 'exa')?.available ?? false,
        tavilyAvailable: operators.find((operator) => operator.id === 'tavily')?.available ?? false,
    };
}
