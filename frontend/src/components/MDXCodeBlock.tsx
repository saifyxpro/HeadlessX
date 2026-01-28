"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, Copy, ExternalLink, MessageSquare, Search, Zap } from 'lucide-react';

interface MDXCodeBlockProps {
    children: any;
    className?: string;
}

export const MDXCodeBlock = ({ children, className }: MDXCodeBlockProps) => {
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Extract text content from children (which is usually a <code> element)
    const getTextContent = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(getTextContent).join('');
        if (node?.props?.children) return getTextContent(node.props.children);
        return '';
    };

    const code = getTextContent(children);
    
    // Extract language from code element's className or parent's className
    const extractLanguage = (): string => {
        if (className?.includes('language-')) {
            return className.replace(/.*language-(\w+).*/, '$1');
        }
        // Check if children is a code element with className
        const childClassName = children?.props?.className;
        if (childClassName?.includes('language-')) {
            return childClassName.replace(/.*language-(\w+).*/, '$1');
        }
        return 'text';
    };
    
    const language = extractLanguage();

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openInAI = (service: 'chatgpt' | 'perplexity' | 'grok') => {
        const prompt = encodeURIComponent(`Explain this ${language} code:\n\n${code}`);
        const urls = {
            chatgpt: `https://chatgpt.com/?q=${prompt}`,
            perplexity: `https://www.perplexity.ai/search?q=${prompt}`,
            grok: `https://x.com/i/grok?text=${prompt}`
        };
        window.open(urls[service], '_blank');
        setShowMenu(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="group relative not-prose my-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-white/5">
                <span className="text-xs font-mono text-slate-400 lowercase">{language}</span>
                <div className="flex items-center gap-2">
                    {/* Custom Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" 
                            title="Ask AI"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[9999]">
                                <button 
                                    onClick={() => openInAI('chatgpt')}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Ask ChatGPT
                                </button>
                                <button 
                                    onClick={() => openInAI('perplexity')}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Search className="w-4 h-4" />
                                    Ask Perplexity
                                </button>
                                <button 
                                    onClick={() => openInAI('grok')}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Zap className="w-4 h-4" />
                                    Ask Grok
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy code"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Code */}
            <div className="p-4 overflow-x-auto text-sm">
                <pre className="m-0! p-0! bg-transparent!">
                    <code className="text-slate-300 font-mono">{code}</code>
                </pre>
            </div>
        </div>
    );
};
