import TurndownService from 'turndown';

class MarkdownService {
    private turndownService: TurndownService;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-'
        });

        // Remove scripts, styles, iframes
        this.turndownService.remove(['script', 'style', 'iframe', 'noscript', 'meta', 'link']);
    }

    public convert(html: string): string {
        return this.turndownService.turndown(html);
    }
}

export const markdownService = new MarkdownService();
