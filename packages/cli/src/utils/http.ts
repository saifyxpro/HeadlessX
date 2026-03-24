import { getApiUrl, getConfig, validateConfig } from './config';

export interface RequestContext {
  apiKey?: string;
  apiUrl?: string;
}

interface JsonRequestOptions extends RequestContext {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  requireAuth?: boolean;
}

function buildLoopbackCandidates(url: string): string[] {
  const parsed = new URL(url);
  const candidates = [parsed.toString()];

  if (parsed.hostname === 'localhost' || parsed.hostname === '0.0.0.0') {
    parsed.hostname = '127.0.0.1';
    candidates.push(parsed.toString());
  }

  return Array.from(new Set(candidates));
}

async function fetchWithLoopbackFallback(url: string, init: RequestInit): Promise<Response> {
  const candidates = buildLoopbackCandidates(url);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await fetch(candidate, init);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Request failed for ${url}`);
}

function buildUrl(apiUrl: string, path: string, query?: URLSearchParams): string {
  const base = apiUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${suffix}`);
  if (query) {
    url.search = query.toString();
  }
  return url.toString();
}

function buildHeaders(
  apiKey: string | undefined,
  hasBody: boolean
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { success: response.ok, raw: text } : { success: response.ok };
}

function resolveContext(context?: RequestContext, requireAuth: boolean = true) {
  const config = getConfig();
  const apiUrl = getApiUrl(context?.apiUrl ?? config.apiUrl);
  const apiKey = requireAuth
    ? validateConfig(context?.apiKey ?? config.apiKey)
    : context?.apiKey ?? config.apiKey;

  return { apiUrl, apiKey };
}

export async function requestJson<T = unknown>(
  options: JsonRequestOptions
): Promise<T> {
  const { apiKey, apiUrl } = resolveContext(options, options.requireAuth !== false);
  const response = await fetchWithLoopbackFallback(buildUrl(apiUrl, options.path), {
    method: options.method ?? 'GET',
    headers: buildHeaders(apiKey, options.body !== undefined),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? JSON.stringify((payload as Record<string, unknown>).error)
        : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function requestBuffer(
  options: JsonRequestOptions
): Promise<Buffer> {
  const { apiKey, apiUrl } = resolveContext(options, options.requireAuth !== false);
  const response = await fetchWithLoopbackFallback(buildUrl(apiUrl, options.path), {
    method: options.method ?? 'GET',
    headers: buildHeaders(apiKey, options.body !== undefined),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = await parseResponse(response);
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? JSON.stringify((payload as Record<string, unknown>).error)
        : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function requestJsonWithQuery<T = unknown>(options: {
  context?: RequestContext;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
}): Promise<T> {
  const { apiKey, apiUrl } = resolveContext(options.context, options.requireAuth !== false);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const response = await fetchWithLoopbackFallback(buildUrl(apiUrl, options.path, params), {
    method: 'GET',
    headers: buildHeaders(apiKey, false),
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? JSON.stringify((payload as Record<string, unknown>).error)
        : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return payload as T;
}
