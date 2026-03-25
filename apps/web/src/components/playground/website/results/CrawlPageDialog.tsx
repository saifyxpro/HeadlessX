'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ArrowLeft01Icon,
    ArrowRight01Icon,
    CodeSquareIcon,
    Copy01Icon,
    Download01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CrawlPageData } from '../types';
import { ResultStat } from './ResultStat';

const RAW_CODE_BLOCK_CLASSNAME =
    'custom-scrollbar overflow-auto rounded-3xl border border-slate-200 bg-white p-5 font-mono text-xs leading-6 text-slate-700';

const MARKDOWN_PROSE_CLASSNAME =
    'prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none prose-pre:custom-scrollbar prose-pre:overflow-auto prose-pre:rounded-3xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-white prose-pre:p-5 prose-pre:text-slate-700 prose-img:rounded-2xl';

interface CrawlPageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pages: CrawlPageData[];
    selectedPage: CrawlPageData | null;
    onSelectPage: (page: CrawlPageData) => void;
    viewRaw: boolean;
    onToggleRaw: () => void;
    copied: boolean;
    onCopy: () => void;
    onSave: () => void;
}

export function CrawlPageDialog({
    open,
    onOpenChange,
    pages,
    selectedPage,
    onSelectPage,
    viewRaw,
    onToggleRaw,
    copied,
    onCopy,
    onSave,
}: CrawlPageDialogProps) {
    if (!selectedPage) {
        return null;
    }

    const selectedIndex = pages.findIndex((page) => page.url === selectedPage.url);
    const previousPage = selectedIndex > 0 ? pages[selectedIndex - 1] : null;
    const nextPage = selectedIndex >= 0 && selectedIndex < pages.length - 1 ? pages[selectedIndex + 1] : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden rounded-[1.75rem] border-slate-200 p-0">
                <div className="flex max-h-[92vh] flex-col">
                    <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    Page {selectedIndex + 1} of {pages.length}
                                </div>
                                <DialogTitle className="mt-3 break-words text-2xl leading-tight">
                                    {selectedPage.title || 'Untitled page'}
                                </DialogTitle>
                                <DialogDescription className="mt-2 break-all text-sm leading-6">
                                    {selectedPage.url}
                                </DialogDescription>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => previousPage && onSelectPage(previousPage)}
                                    disabled={!previousPage}
                                >
                                    <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-1.5 h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => nextPage && onSelectPage(nextPage)}
                                    disabled={!nextPage}
                                >
                                    Next
                                    <HugeiconsIcon icon={ArrowRight01Icon} className="ml-1.5 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <ResultStat label="Depth" value={selectedPage.depth} />
                            <ResultStat label="Links" value={selectedPage.linkCount} />
                            <ResultStat label="Status" value={selectedPage.statusCode ?? 'n/a'} />
                        </div>
                    </DialogHeader>

                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Page Content
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    Inspect the crawled markdown without leaving the results index.
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant={viewRaw ? 'default' : 'outline'} size="sm" onClick={onToggleRaw}>
                                    <HugeiconsIcon icon={CodeSquareIcon} className="mr-1.5 h-4 w-4" />
                                    {viewRaw ? 'Preview' : 'Raw'}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={onCopy}>
                                    <HugeiconsIcon icon={Copy01Icon} className="mr-1.5 h-4 w-4" />
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={onSave}>
                                    <HugeiconsIcon icon={Download01Icon} className="mr-1.5 h-4 w-4" />
                                    Save
                                </Button>
                            </div>
                        </div>

                        <div data-native-scroll="true" className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-white px-6 py-6">
                            {viewRaw ? (
                                <pre className={RAW_CODE_BLOCK_CLASSNAME}>{selectedPage.markdown}</pre>
                            ) : (
                                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                    <div className={MARKDOWN_PROSE_CLASSNAME}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPage.markdown}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
