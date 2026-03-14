import axios from 'axios';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

class MarkdownService {
    private readonly turndownService: TurndownService;
    private readonly serviceUrl = process.env.HTML_TO_MARKDOWN_SERVICE_URL?.trim() || '';
    private readonly requestTimeoutMs = Number(process.env.HTML_TO_MARKDOWN_TIMEOUT_MS || '60000');
    private serviceWarningShown = false;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
            emDelimiter: '*',
        });

        this.turndownService.use(gfm);
        this.turndownService.addRule('inlineLinks', {
            filter: (node, options) =>
                options.linkStyle === 'inlined' &&
                node.nodeName === 'A' &&
                Boolean(node.getAttribute('href')),
            replacement: (content, node) => {
                const href = node.getAttribute('href')?.trim() || '';
                const title = node.getAttribute('title')?.trim();
                const suffix = title ? ` "${title}"` : '';
                return `[${content.trim()}](${href}${suffix})`;
            },
        });

        this.turndownService.remove(['script', 'style', 'iframe', 'noscript', 'meta', 'link', 'nav', 'footer']);
    }

    public async convert(html: string): Promise<string> {
        if (!html || !html.trim()) {
            return '';
        }

        if (this.serviceUrl) {
            try {
                const response = await axios.post<{ markdown: string; success: boolean }>(
                    `${this.serviceUrl.replace(/\/$/, '')}/convert`,
                    { html },
                    {
                        timeout: this.requestTimeoutMs,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );

                if (response.data?.success && typeof response.data.markdown === 'string') {
                    return this.postProcess(response.data.markdown);
                }
            } catch (error) {
                if (!this.serviceWarningShown) {
                    console.warn('⚠️ HTML-to-Markdown service unavailable, using local fallback.', (error as Error).message);
                    this.serviceWarningShown = true;
                }
            }
        }

        return this.postProcess(this.turndownService.turndown(html));
    }

    private postProcess(markdown: string) {
        return markdown
            .replace(/\[Skip to Content\]\(#[^)]+\)/gi, '')
            .replace(/\[Skip to content\]\(#[^)]+\)/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\[(.*?)\]\((.*?)\)/g, (_match, label, href) => {
                const cleanedLabel = String(label).replace(/\n+/g, ' ').trim();
                return `[${cleanedLabel}](${String(href).trim()})`;
            })
            .split('\n')
            .map((line) => line.replace(/[ \t]+$/g, ''))
            .join('\n')
            .trim();
    }
}

export const markdownService = new MarkdownService();
