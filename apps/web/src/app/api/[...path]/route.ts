import { NextRequest } from 'next/server';

const backendApiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const dashboardInternalApiKey = process.env.DASHBOARD_INTERNAL_API_KEY;

export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ path?: string[] }> | { path?: string[] };
};

function buildBackendUrl(request: NextRequest, path: string[]): URL {
    const url = new URL(`/api/${path.join('/')}`, backendApiUrl);
    url.search = request.nextUrl.search;
    return url;
}

function buildForwardHeaders(request: NextRequest): Headers {
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
    if (!dashboardInternalApiKey) {
        return Response.json(
            { success: false, error: 'DASHBOARD_INTERNAL_API_KEY is not configured' },
            { status: 500 }
        );
    }

    const resolvedParams = await Promise.resolve(context.params);
    const backendUrl = buildBackendUrl(request, resolvedParams.path || []);

    const init: RequestInit = {
        method: request.method,
        headers: buildForwardHeaders(request),
        cache: 'no-store',
        redirect: 'manual',
        signal: request.signal,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.arrayBuffer();
    }

    const upstreamResponse = await fetch(backendUrl, init);

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
