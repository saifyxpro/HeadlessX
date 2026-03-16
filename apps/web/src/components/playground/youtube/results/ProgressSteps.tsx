'use client';

import { CheckmarkCircle02Icon, Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { YoutubeProgressStep } from '../types';

interface ProgressStepsProps {
    steps: YoutubeProgressStep[];
    emptyLabel: string;
}

export function ProgressSteps({ steps, emptyLabel }: ProgressStepsProps) {
    return (
        <div className="space-y-3">
            {steps.length === 0 && (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500">
                    <HugeiconsIcon icon={Loading03Icon} className="h-5 w-5 animate-spin text-slate-400" />
                    {emptyLabel}
                </div>
            )}

            {steps.map((step) => (
                <div
                    key={`${step.step}-${step.message}`}
                    className={`flex items-start gap-4 rounded-2xl border px-4 py-4 ${
                        step.status === 'completed'
                            ? 'border-emerald-200 bg-emerald-50'
                            : step.status === 'error'
                                ? 'border-red-200 bg-red-50'
                                : 'border-slate-200 bg-slate-50'
                    }`}
                >
                    <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                            step.status === 'completed'
                                ? 'border-emerald-300 bg-white text-emerald-600'
                                : step.status === 'error'
                                    ? 'border-red-300 bg-white text-red-600'
                                    : 'border-slate-200 bg-white text-slate-600'
                        }`}
                    >
                        {step.status === 'active' ? (
                            <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                        ) : step.status === 'completed' ? (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4" />
                        ) : (
                            step.step
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Step {step.step} of {step.total}
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                            {step.message}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
