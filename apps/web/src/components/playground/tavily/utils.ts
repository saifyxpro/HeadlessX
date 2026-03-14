import type {
    TavilyResearchResponse,
    TavilySearchResponse,
    TavilySearchResultItem,
} from './types';

export function parseDomainList(value: string) {
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function normalizeResearchRequestId(result: { requestId?: string; request_id?: string }) {
    return result.requestId || result.request_id || '';
}

export function normalizeResearchStatus(status?: string) {
    if (!status) {
        return 'pending';
    }

    return status.toLowerCase();
}

export function getTavilyErrorMessage(payload: any) {
    if (typeof payload?.error === 'string') {
        return payload.error;
    }

    if (payload?.error?.message) {
        return payload.error.message;
    }

    return 'Request failed';
}

function getSearchResultMarkdown(result: TavilySearchResultItem, index: number) {
    const lines = [`${index + 1}. [${result.title || result.url}](${result.url})`];

    if (result.publishedDate) {
        lines.push(`   Published: ${result.publishedDate}`);
    }

    if (typeof result.score === 'number') {
        lines.push(`   Score: ${result.score}`);
    }

    if (result.content) {
        lines.push(`\n   ${result.content.replace(/\n/g, '\n   ')}`);
    }

    if (result.rawContent) {
        lines.push(`\n   Raw Content:\n\n\`\`\`\n${result.rawContent}\n\`\`\``);
    }

    return lines.join('\n');
}

export function buildSearchMarkdown(searchResult: TavilySearchResponse | null, query: string) {
    if (!searchResult) {
        return '';
    }

    const lines = ['# Tavily Search', '', `Query: ${query}`];

    if (searchResult.answer) {
        lines.push('', '## Answer', '', searchResult.answer);
    }

    if (searchResult.results?.length) {
        lines.push('', '## Results', '');
        lines.push(searchResult.results.map(getSearchResultMarkdown).join('\n\n'));
    }

    if (searchResult.images?.length) {
        lines.push('', '## Images', '');
        lines.push(searchResult.images.map((image) => `- ${image.description || 'Image'}: ${image.url}`).join('\n'));
    }

    return lines.join('\n');
}

export function buildResearchMarkdown(researchResult: TavilyResearchResponse | null, query: string) {
    if (!researchResult) {
        return '';
    }

    const lines = ['# Tavily Research', '', `Query: ${query}`];
    const status = normalizeResearchStatus(researchResult.status);
    const requestId = normalizeResearchRequestId(researchResult);

    if (requestId) {
        lines.push(`Request ID: ${requestId}`);
    }

    lines.push(`Status: ${status}`);

    if (researchResult.content) {
        lines.push('', '## Report', '');
        lines.push(
            typeof researchResult.content === 'string'
                ? researchResult.content
                : `\`\`\`json\n${JSON.stringify(researchResult.content, null, 2)}\n\`\`\``
        );
    }

    if (researchResult.sources?.length) {
        lines.push('', '## Sources', '');
        lines.push(
            researchResult.sources
                .map((source, index) => `${index + 1}. [${source.title || source.url || 'Source'}](${source.url || '#'})`)
                .join('\n')
        );
    }

    return lines.join('\n');
}

export function downloadMarkdownFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
