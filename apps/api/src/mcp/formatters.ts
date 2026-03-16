import { asMarkdownCodeBlock } from './responses';

export function websiteHtmlMarkdown(data: {
    url: string;
    title: string;
    statusCode: number;
    metadata?: Record<string, unknown>;
    html: string;
}) {
    return [
        '# Website HTML',
        '',
        `**URL:** ${data.url}`,
        `**Title:** ${data.title || 'Untitled'}`,
        `**Status Code:** ${data.statusCode}`,
        '',
        '## Metadata',
        '',
        asMarkdownCodeBlock(data.metadata || {}),
        '',
        '## HTML',
        '',
        '```html',
        data.html,
        '```',
    ].join('\n');
}

export function websiteMarkdownResult(data: {
    url: string;
    title: string;
    metadata?: Record<string, unknown>;
    markdown: string;
}) {
    return [
        '# Website Markdown',
        '',
        `**URL:** ${data.url}`,
        `**Title:** ${data.title || 'Untitled'}`,
        '',
        '## Metadata',
        '',
        asMarkdownCodeBlock(data.metadata || {}),
        '',
        '## Content',
        '',
        data.markdown || '_No markdown content returned._',
    ].join('\n');
}

export function websiteMapMarkdown(data: {
    url: string;
    title: string;
    summary: unknown;
    links: Array<{ url: string; title?: string; source?: string }>;
}) {
    const lines = [
        '# Website Map',
        '',
        `**URL:** ${data.url}`,
        `**Title:** ${data.title || 'Untitled'}`,
        '',
        '## Summary',
        '',
        asMarkdownCodeBlock(data.summary),
        '',
        '## Links',
        '',
    ];

    if (!data.links.length) {
        lines.push('_No links found._');
        return lines.join('\n');
    }

    data.links.forEach((link, index) => {
        lines.push(`${index + 1}. [${link.title || link.url}](${link.url})`);
    });

    return lines.join('\n');
}

export function jsonTitleMarkdown(title: string, data: unknown) {
    return `# ${title}\n\n${asMarkdownCodeBlock(data)}`;
}
