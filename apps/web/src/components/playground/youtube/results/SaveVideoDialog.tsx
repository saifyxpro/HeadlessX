'use client';

import { CheckmarkCircle02Icon, Download01Icon, Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { YoutubeSaveOption } from '../utils';
import type { YoutubeProgressStep } from '../types';
import { ProgressSteps } from './ProgressSteps';

interface SaveVideoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: YoutubeSaveOption[];
    selectedOptionId: string | null;
    onSelectOption: (id: string) => void;
    isSaving: boolean;
    onConfirm: () => void;
    saveError: string | null;
    steps: YoutubeProgressStep[];
}

export function SaveVideoDialog({
    open,
    onOpenChange,
    options,
    selectedOptionId,
    onSelectOption,
    isSaving,
    onConfirm,
    saveError,
    steps,
}: SaveVideoDialogProps) {
    const selectedOption = options.find((option) => option.id === selectedOptionId) || null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[86vh] max-w-3xl overflow-hidden rounded-[1.75rem] border-slate-200 p-0">
                <div className="flex max-h-[86vh] flex-col">
                    <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
                        <DialogTitle className="text-xl">Save Video Zip</DialogTitle>
                        <DialogDescription className="mt-1 text-sm leading-6">
                            Only extracted formats from the current result are shown here. Saving builds a temporary zip with the selected media file and `metadata.md`.
                        </DialogDescription>
                    </DialogHeader>

                    <div data-native-scroll="true" className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
                        <div className="space-y-3">
                            {options.map((option) => {
                                const isActive = option.id === selectedOptionId;

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => onSelectOption(option.id)}
                                        className={`flex w-full items-start justify-between gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-colors ${
                                            isActive
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-sm font-semibold">{option.label}</div>
                                                {option.recommended ? (
                                                    <div className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] ${isActive ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                                                        Recommended
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className={`mt-1 text-sm leading-6 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                                                {option.description}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                                    isActive ? 'border-white/15 bg-white/10 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'
                                                }`}>
                                                    Format {option.formatLabel}
                                                </div>
                                                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                                    isActive ? 'border-white/15 bg-white/10 text-white' : 'border-blue-200 bg-blue-50 text-blue-700'
                                                }`}>
                                                    Quality {option.qualityLabel}
                                                </div>
                                                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                                    isActive ? 'border-white/15 bg-white/10 text-white' : 'border-violet-200 bg-violet-50 text-violet-700'
                                                }`}>
                                                    {option.deliveryLabel}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`mt-0.5 rounded-full ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-5 w-5" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {saveError ? (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {saveError}
                            </div>
                        ) : null}

                        {isSaving ? (
                            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Save Flow
                                </div>
                                <ProgressSteps
                                    steps={steps}
                                    emptyLabel="Waiting for YouTube save progress"
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-5">
                        <div className="min-w-0 text-sm text-slate-500">
                            {selectedOption ? `Selected: ${selectedOption.label}` : 'Select a save format to continue.'}
                        </div>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={!selectedOption || isSaving}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <HugeiconsIcon icon={isSaving ? Loading03Icon : Download01Icon} className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                            {isSaving ? 'Preparing Zip' : 'Download Zip'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
