"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, Copy, MessageSquare, ExternalLink, Search, Zap, FileText } from 'lucide-react';

interface DocsPageActionsProps {
    title?: string;
}

export const DocsPageActions = ({ title = "Documentation" }: DocsPageActionsProps) => {
    const [copied, setCopied] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const getPageContent = (): string => {
        // Get the main content from the page
        const mainContent = document.querySelector('main');
        if (!mainContent) return '';
        
        // Clone to avoid modifying the actual DOM
        const clone = mainContent.cloneNode(true) as HTMLElement;
        
        // Remove the actions bar from the clone
        const actionsBar = clone.querySelector('[data-docs-actions]');
        if (actionsBar) actionsBar.remove();
        
        // Convert to markdown-like text
        let markdown = '';
        
        // Get all headings and paragraphs
        clone.querySelectorAll('h1, h2, h3, h4, p, li, pre, code, table').forEach((el) => {
            const tag = el.tagName.toLowerCase();
            const text = el.textContent?.trim() || '';
            
            if (tag === 'h1') markdown += `# ${text}\n\n`;
            else if (tag === 'h2') markdown += `## ${text}\n\n`;
            else if (tag === 'h3') markdown += `### ${text}\n\n`;
            else if (tag === 'h4') markdown += `#### ${text}\n\n`;
            else if (tag === 'p') markdown += `${text}\n\n`;
            else if (tag === 'li') markdown += `- ${text}\n`;
            else if (tag === 'pre') markdown += `\`\`\`\n${text}\n\`\`\`\n\n`;
            else if (tag === 'code' && el.parentElement?.tagName !== 'PRE') markdown += `\`${text}\``;
        });
        
        return markdown.trim();
    };

    const handleCopyMarkdown = () => {
        const content = getPageContent();
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openInAI = (service: 'chatgpt' | 'perplexity' | 'grok') => {
        const content = getPageContent();
        const prompt = encodeURIComponent(`Help me understand this documentation:\n\n${content.slice(0, 2000)}`);
        const urls = {
            chatgpt: `https://chatgpt.com/?q=${prompt}`,
            perplexity: `https://www.perplexity.ai/search?q=${prompt}`,
            grok: `https://x.com/i/grok?text=${prompt}`
        };
        window.open(urls[service], '_blank');
        setShowAIMenu(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowAIMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div data-docs-actions className="flex items-center justify-end gap-2 mb-6 pb-4 border-b border-slate-200">
            {/* Ask AI Dropdown */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setShowAIMenu(!showAIMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                    <MessageSquare className="w-4 h-4" />
                    Ask AI
                </button>
                {showAIMenu && (
                    <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[9999]">
                        <button
                            onClick={() => openInAI('chatgpt')}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4 text-emerald-500" />
                            Ask ChatGPT
                        </button>
                        <button
                            onClick={() => openInAI('perplexity')}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Search className="w-4 h-4 text-blue-500" />
                            Ask Perplexity
                        </button>
                        <button
                            onClick={() => openInAI('grok')}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Zap className="w-4 h-4 text-orange-500" />
                            Ask Grok
                        </button>
                    </div>
                )}
            </div>

            {/* Copy as Markdown */}
            <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
                {copied ? (
                    <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600">Copied!</span>
                    </>
                ) : (
                    <>
                        <FileText className="w-4 h-4" />
                        Copy as Markdown
                    </>
                )}
            </button>
        </div>
    );
};
