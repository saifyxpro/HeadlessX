import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CrawlPageData, CrawlResultData } from '../types';
import { ResultStat } from './ResultStat';

const RAW_CODE_BLOCK_CLASSNAME =
    'custom-scrollbar overflow-auto rounded-3xl border border-slate-200 bg-white p-5 font-mono text-xs leading-6 text-slate-700';

const MARKDOWN_PROSE_CLASSNAME =
    'prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none prose-pre:custom-scrollbar prose-pre:overflow-auto prose-pre:rounded-3xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-white prose-pre:p-5 prose-pre:text-slate-700 prose-img:rounded-2xl';

interface CrawlResultsProps {
    data: CrawlResultData;
    selectedPage: CrawlPageData | null;
    onSelectPage: (page: CrawlPageData) => void;
    viewRaw: boolean;
    expanded: boolean;
}

export function CrawlResults({
    data,
    selectedPage,
    onSelectPage,
    viewRaw,
    expanded,
}: CrawlResultsProps) {
    return (
        <div className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultStat label="Pages" value={data.summary.pagesCrawled} />
                <ResultStat label="Depth" value={data.summary.maxDepthReached} />
                <ResultStat label="Failures" value={data.summary.failureCount} />
                <ResultStat label="Discovered" value={data.summary.discoveredCount} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className={`rounded-3xl border border-slate-200 bg-slate-50 p-3 ${expanded ? '' : 'max-h-[52rem] overflow-auto'}`}>
                    <div className="mb-3 px-2">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Pages</div>
                        <div className="mt-1 text-sm text-slate-500">Select a crawled page to inspect its markdown.</div>
                    </div>

                    <div className="space-y-2">
                        {data.pages.map((page) => {
                            const isActive = selectedPage?.url === page.url;

                            return (
                                <button
                                    key={page.url}
                                    type="button"
                                    onClick={() => onSelectPage(page)}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                                        isActive
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="text-sm font-semibold">{page.title}</div>
                                    <div className={`mt-1 line-clamp-2 text-xs leading-5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {page.url}
                                    </div>
                                    <div className={`mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                        <span>Depth {page.depth}</span>
                                        <span>{page.linkCount} links</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    {selectedPage ? (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <ResultStat label="Title" value={selectedPage.title || 'Untitled'} />
                                <ResultStat label="Depth" value={selectedPage.depth} />
                                <ResultStat label="Links" value={selectedPage.linkCount} />
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                <div className="mb-4">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Selected Page</div>
                                    <div className="mt-1 break-all text-sm text-slate-500">{selectedPage.url}</div>
                                </div>

                                {viewRaw ? (
                                    <pre className={`${RAW_CODE_BLOCK_CLASSNAME} ${expanded ? 'max-h-none' : 'max-h-[42rem]'} rounded-2xl`}>
                                        {selectedPage.markdown}
                                    </pre>
                                ) : (
                                    <div className={`${expanded ? 'max-h-none' : 'max-h-[42rem] overflow-auto'} rounded-2xl border border-slate-200 p-5`}>
                                        <div className={MARKDOWN_PROSE_CLASSNAME}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPage.markdown}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                            No crawl pages were captured.
                        </div>
                    )}

                    {data.failures.length > 0 && (
                        <div className={`rounded-3xl border border-red-200 bg-red-50 p-5 ${expanded ? '' : 'max-h-[22rem] overflow-auto'}`}>
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Failures</div>
                            <div className="mt-3 space-y-2">
                                {data.failures.map((failure) => (
                                    <div key={`${failure.url}-${failure.depth}`} className="rounded-2xl border border-red-200 bg-white px-4 py-3">
                                        <div className="text-sm font-semibold text-slate-900">{failure.url}</div>
                                        <div className="mt-1 text-xs text-red-600">{failure.error}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
