'use client';

import { LinkSquare01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AdvancedSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    disabled?: boolean;
    summary: string;
    title: string;
    description: string;
    children: React.ReactNode;
}

export function AdvancedSettingsDialog({
    open,
    onOpenChange,
    disabled = false,
    summary,
    title,
    description,
    children,
}: AdvancedSettingsDialogProps) {
    return (
        <>
            <button
                type="button"
                onClick={() => !disabled && onOpenChange(true)}
                disabled={disabled}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-colors hover:border-slate-300 hover:bg-white"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 text-slate-400">
                            <HugeiconsIcon icon={Settings02Icon} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Advanced
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {title}
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-500">
                                {summary}
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-400">
                        <HugeiconsIcon icon={LinkSquare01Icon} className="h-4 w-4" />
                    </div>
                </div>
            </button>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[86vh] max-w-3xl overflow-hidden rounded-[1.75rem] border-slate-200 p-0">
                    <div className="flex max-h-[86vh] flex-col">
                        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
                            <DialogTitle className="text-xl">{title}</DialogTitle>
                            <DialogDescription className="mt-1 text-sm leading-6">
                                {description}
                            </DialogDescription>
                        </DialogHeader>

                        <div
                            data-native-scroll="true"
                            className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6"
                        >
                            <div className="space-y-4">{children}</div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
