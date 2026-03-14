import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

class MarkdownService {
    private turndownService: TurndownService;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-'
        });

        // Add GitHub Flavored Markdown plugin for tables, strikethrough, etc.
        this.turndownService.use(gfm);

        // Remove scripts, styles, iframes
        this.turndownService.remove(['script', 'style', 'iframe', 'noscript', 'meta', 'link', 'nav', 'footer']);
    }

    public convert(html: string): string {
        return this.turndownService.turndown(html);
    }
}

export const markdownService = new MarkdownService();
