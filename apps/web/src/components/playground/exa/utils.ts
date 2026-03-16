import type { ExaProgressStep, ExaSearchResponse, ExaSearchResultItem } from './types';

export function parseDomainList(value: string) {
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function getExaErrorMessage(payload: any) {
    if (typeof payload?.error === 'string') {
        return payload.error;
    }

    if (payload?.error?.message) {
        return payload.error.message;
    }

    return 'Request failed';
}

export function parseSseEvent(rawEvent: string) {
    let event = 'message';
    const dataLines: string[] = [];

    for (const line of rawEvent.split('\n')) {
        if (!line) {
            continue;
        }

        if (line.startsWith('event:')) {
            event = line.slice(6).trim();
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

export function mergeProgressStep(steps: ExaProgressStep[], nextStep: ExaProgressStep) {
    const existingIndex = steps.findIndex((step) => step.step === nextStep.step);

    if (existingIndex === -1) {
        return [...steps, nextStep];
    }

    const updated = [...steps];
    updated[existingIndex] = nextStep;
    return updated;
}

function buildResultMarkdown(result: ExaSearchResultItem, index: number) {
    const lines = [`${index + 1}. [${result.title || result.url}](${result.url})`];

    if (result.publishedDate) {
        lines.push(`   Published: ${result.publishedDate}`);
    }

    if (result.author) {
        lines.push(`   Author: ${result.author}`);
    }

    if (typeof result.score === 'number') {
        lines.push(`   Score: ${result.score}`);
    }

    if (result.highlights?.length) {
        lines.push('', ...result.highlights.map((highlight) => `   - ${highlight}`));
    } else if (result.text) {
        lines.push('', `   ${result.text.replace(/\n/g, '\n   ')}`);
    }

    return lines.join('\n');
}

export function buildSearchMarkdown(searchResult: ExaSearchResponse | null, query: string) {
    if (!searchResult) {
        return '';
    }

    const lines = ['# Exa Search', '', `Query: ${query}`];

    if (searchResult.requestId) {
        lines.push(`Request ID: ${searchResult.requestId}`);
    }

    if (searchResult.resolvedSearchType) {
        lines.push(`Resolved Type: ${searchResult.resolvedSearchType}`);
    }

    if (searchResult.output?.content) {
        lines.push('', '## Synthesis', '');
        lines.push(
            typeof searchResult.output.content === 'string'
                ? searchResult.output.content
                : `\`\`\`json\n${JSON.stringify(searchResult.output.content, null, 2)}\n\`\`\``
        );
    }

    if (searchResult.results?.length) {
        lines.push('', '## Results', '');
        lines.push(searchResult.results.map(buildResultMarkdown).join('\n\n'));
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
