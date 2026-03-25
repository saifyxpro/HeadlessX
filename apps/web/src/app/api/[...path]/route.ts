import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ path?: string[] }> | { path?: string[] };
};

function getBackendApiUrl() {
    return process.env.INTERNAL_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || null;
}

function getDashboardInternalApiKey() {
    return process.env.DASHBOARD_INTERNAL_API_KEY?.trim() || null;
}

function buildBackendUrl(request: NextRequest, backendApiUrl: string, path: string[]): URL {
    const url = new URL(`/api/${path.join('/')}`, backendApiUrl);
    url.search = request.nextUrl.search;
    return url;
}

function buildForwardHeaders(request: NextRequest, dashboardInternalApiKey: string): Headers {
    const headers = new Headers(request.headers);

    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    headers.delete('x-api-key');
    headers.set('x-api-key', dashboardInternalApiKey || '');

    return headers;
}

function buildResponseHeaders(upstreamHeaders: Headers): Headers {
    const headers = new Headers(upstreamHeaders);
    headers.delete('content-length');
    return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<Response> {
    const backendApiUrl = getBackendApiUrl();

    if (!backendApiUrl) {
        return Response.json(
            { success: false, error: 'INTERNAL_API_URL or NEXT_PUBLIC_API_URL is not configured' },
            { status: 500 }
        );
    }

    const dashboardInternalApiKey = getDashboardInternalApiKey();

    if (!dashboardInternalApiKey) {
        return Response.json(
            { success: false, error: 'DASHBOARD_INTERNAL_API_KEY is not configured' },
            { status: 500 }
        );
    }

    const resolvedParams = await Promise.resolve(context.params);
    const backendUrl = buildBackendUrl(request, backendApiUrl, resolvedParams.path || []);

    const init: RequestInit = {
        method: request.method,
        headers: buildForwardHeaders(request, dashboardInternalApiKey),
        cache: 'no-store',
        redirect: 'manual',
        signal: request.signal,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.arrayBuffer();
    }

    let upstreamResponse: Response;

    try {
        upstreamResponse = await fetch(backendUrl, init);
    } catch (error) {
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reach backend API',
                backendUrl: backendUrl.toString(),
            },
            { status: 503 }
        );
    }

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: buildResponseHeaders(upstreamResponse.headers),
    });
}

export async function GET(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}
