import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ScrapeResult } from '../types';
import { ResultStat } from './ResultStat';

const RAW_CODE_BLOCK_CLASSNAME =
    'custom-scrollbar overflow-auto rounded-3xl border border-slate-200 bg-white p-5 font-mono text-xs leading-6 text-slate-700';

const MARKDOWN_PROSE_CLASSNAME =
    'prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none prose-pre:custom-scrollbar prose-pre:overflow-auto prose-pre:rounded-3xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-white prose-pre:p-5 prose-pre:text-slate-700 prose-img:rounded-2xl';

interface ScrapePreviewProps {
    result: Extract<ScrapeResult, { type: 'html' | 'html-js' | 'markdown' }>;
    viewRaw: boolean;
    expanded: boolean;
}

export function ScrapePreview({ result, viewRaw, expanded }: ScrapePreviewProps) {
    const isMarkdown = result.type === 'markdown';
    const content = isMarkdown ? result.data.markdown : result.data.html;

    return (
        <div className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ResultStat label="Mode" value={isMarkdown ? 'Markdown' : result.type === 'html-js' ? 'Rendered HTML' : 'HTML'} />
                <ResultStat label="Title" value={result.data.title || 'Untitled'} />
                <ResultStat label="Chars" value={content.length.toLocaleString()} />
            </div>

            {viewRaw ? (
                <pre className={`${RAW_CODE_BLOCK_CLASSNAME} ${expanded ? 'max-h-none' : 'max-h-[36rem]'}`}>
                    {content}
                </pre>
            ) : isMarkdown ? (
                <div className={`rounded-3xl border border-slate-200 bg-white p-6 ${expanded ? 'max-h-none' : 'max-h-[36rem] overflow-auto'}`}>
                    <div className={MARKDOWN_PROSE_CLASSNAME}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.data.markdown}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white ${expanded ? 'h-[52rem]' : 'h-[36rem]'}`}>
                    <iframe
                        srcDoc={result.data.html}
                        title="Scrape preview"
                        className="h-full w-full"
                        sandbox="allow-same-origin"
                    />
                </div>
            )}
        </div>
    );
}
