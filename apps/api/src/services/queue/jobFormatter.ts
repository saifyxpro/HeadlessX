import { createHash } from 'crypto';
import type { StreamScrapeResult } from '../scrape/StreamingScraperService';
import type { IndexJobPayload, ScrapeOutputTypeName } from './jobSchemas';

function stripMarkdown(markdown: string) {
    return markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/[#>*_~\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildErrorResult(result: StreamScrapeResult) {
    return {
        success: false,
        type: result.cancelled ? 'cancelled' : 'error',
        error: result.cancelled ? 'Job cancelled' : result.error,
        code: result.code,
        challenge: result.challenge,
        cancelled: result.cancelled,
        duration: result.duration,
    };
}

export function formatQueueScrapeResult(type: ScrapeOutputTypeName, result: StreamScrapeResult) {
    if (!result.success) {
        return buildErrorResult(result);
    }

    if (type === 'screenshot') {
        return {
            success: true,
            type,
            data: {
                image: `data:image/jpeg;base64,${result.screenshot?.toString('base64') || ''}`,
            },
            url: result.url,
            duration: result.duration,
            statusCode: result.statusCode,
        };
    }

    return {
        success: true,
        type,
        data: {
            html: result.html,
            title: result.title,
            metadata: result.metadata,
        },
        url: result.url,
        duration: result.duration,
        statusCode: result.statusCode,
    };
}

export function formatQueueExtractResult(result: StreamScrapeResult) {
    if (!result.success) {
        return buildErrorResult(result);
    }

    return {
        success: true,
        type: 'extract',
        data: {
            markdown: result.markdown,
            title: result.title,
            metadata: result.metadata,
        },
        url: result.url,
        duration: result.duration,
        statusCode: result.statusCode,
    };
}

export function formatQueueIndexResult(jobId: string, payload: IndexJobPayload, result: StreamScrapeResult) {
    if (!result.success) {
        return buildErrorResult(result);
    }

    const markdown = result.markdown || '';
    const plainText = stripMarkdown(markdown);

    return {
        success: true,
        type: 'index',
        data: {
            document: {
                id: jobId,
                sourceUrl: payload.url,
                title: result.title || payload.url,
                markdown,
                plainText,
                metadata: {
                    ...(result.metadata || {}),
                    ...(payload.metadata || {}),
                },
                checksum: createHash('sha256').update(markdown).digest('hex'),
                stats: {
                    characters: markdown.length,
                    words: plainText ? plainText.split(/\s+/).length : 0,
                },
                indexedAt: new Date().toISOString(),
            },
        },
        url: result.url,
        duration: result.duration,
        statusCode: result.statusCode,
    };
}
