import type {
    CrawlResultData,
    MapResultData,
    ScrapeHtmlData,
    ScrapeMarkdownData,
    ScrapeResult,
} from '../types';

export type StreamEventName = 'start' | 'progress' | 'result' | 'error' | 'cancelled' | 'done' | 'reconnect';

export type ParsedStreamEvent = {
    event: StreamEventName | 'message';
    data: any;
};

export function mapPayloadToResult(payload: any): ScrapeResult {
    if (!payload?.success) {
        return {
            type: 'error',
            data: payload?.error || 'Request failed',
        };
    }

    if (payload.type === 'screenshot') {
        return {
            type: 'image',
            data: typeof payload.data === 'string' ? payload.data : payload.data?.image || '',
        };
    }

    if (payload.type === 'content' || payload.type === 'markdown' || payload.type === 'extract') {
        return {
            type: 'markdown',
            data: payload.data as ScrapeMarkdownData,
        };
    }

    if (payload.type === 'crawl') {
        return {
            type: 'crawl',
            data: payload.data as CrawlResultData,
        };
    }

    if (payload.type === 'map') {
        return {
            type: 'map',
            data: payload.data as MapResultData,
        };
    }

    return {
        type: payload.type === 'html-js' ? 'html-js' : 'html',
        data: payload.data as ScrapeHtmlData,
    };
}

export function parseSseEvent(rawEvent: string): ParsedStreamEvent | null {
    let event: ParsedStreamEvent['event'] = 'message';
    const dataLines: string[] = [];

    for (const line of rawEvent.split('\n')) {
        if (!line) {
            continue;
        }

        if (line.startsWith('event:')) {
            event = line.slice(6).trim() as ParsedStreamEvent['event'];
            continue;
        }

        if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
        }
    }

    if (dataLines.length === 0) {
        return null;
    }

    try {
        return {
            event,
            data: JSON.parse(dataLines.join('\n')),
        };
    } catch {
        return null;
    }
}

export function normalizeTargetUrl(input: string) {
    const trimmed = input.trim();
    if (!trimmed) {
        return '';
    }

    const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;

    try {
        return new URL(withProtocol).toString();
    } catch {
        return trimmed;
    }
}
