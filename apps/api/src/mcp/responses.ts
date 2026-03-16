import type { ToolResponseFormat } from './schemas';

export function serializeJson(data: unknown) {
    return JSON.stringify(data, null, 2);
}

export function asMarkdownCodeBlock(data: unknown) {
    return `\`\`\`json\n${serializeJson(data)}\n\`\`\``;
}

export function createToolSuccess(data: unknown, responseFormat: ToolResponseFormat, markdown?: string) {
    return {
        content: [{
            type: 'text' as const,
            text: responseFormat === 'json'
                ? serializeJson(data)
                : (markdown?.trim() || asMarkdownCodeBlock(data)),
        }],
        structuredContent: {
            data,
        },
    };
}

export function createToolError(message: string) {
    return {
        isError: true,
        content: [{
            type: 'text' as const,
            text: `Error: ${message}`,
        }],
    };
}
