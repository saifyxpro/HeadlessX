type ServiceStatusPayload = {
    success?: boolean;
    data?: {
        configured?: boolean;
    };
};

const backendApiUrl = process.env.INTERNAL_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
const dashboardInternalApiKey = process.env.DASHBOARD_INTERNAL_API_KEY?.trim();

async function getBackendConfigured(path: string): Promise<boolean> {
    if (!backendApiUrl || !dashboardInternalApiKey) {
        return false;
    }

    try {
        const response = await fetch(new URL(path, backendApiUrl), {
            method: 'GET',
            headers: { 'x-api-key': dashboardInternalApiKey },
            cache: 'no-store',
        });

        if (!response.ok) {
            return false;
        }

        const payload = await response.json() as ServiceStatusPayload;
        return Boolean(payload.success && payload.data?.configured);
    } catch {
        return false;
    }
}

export async function getTavilyAvailability() {
    return getBackendConfigured('/api/tavily/status');
}

export async function getExaAvailability() {
    return getBackendConfigured('/api/exa/status');
}

export async function getYoutubeAvailability() {
    return getBackendConfigured('/api/youtube/status');
}

export async function getPlaygroundAvailability() {
    const [youtubeAvailable, exaAvailable, tavilyAvailable] = await Promise.all([
        getYoutubeAvailability(),
        getExaAvailability(),
        getTavilyAvailability(),
    ]);

    return {
        youtubeAvailable,
        exaAvailable,
        tavilyAvailable,
    };
}
