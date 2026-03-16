import { Loading03Icon, Search01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { TavilyTool } from '../types';

interface ProgressStateProps {
    tool: TavilyTool;
    hasRequestId: boolean;
    researchStatus: string | null;
}

export function ProgressState({ tool, hasRequestId, researchStatus }: ProgressStateProps) {
    const steps = tool === 'search'
        ? [
            { step: 1, total: 2, message: 'Sending Tavily search request', status: 'completed' as const },
            { step: 2, total: 2, message: 'Waiting for Tavily answer and sources', status: 'active' as const },
        ]
        : [
            { step: 1, total: 3, message: 'Submitting Tavily research job', status: hasRequestId ? 'completed' as const : 'active' as const },
            { step: 2, total: 3, message: hasRequestId ? `Polling research status: ${researchStatus || 'pending'}` : 'Waiting for research request ID', status: hasRequestId ? 'active' as const : 'pending' as const },
            { step: 3, total: 3, message: 'Waiting for final research report', status: 'pending' as const },
        ];

    return (
        <div className="absolute inset-0 overflow-auto px-6 py-8">
            <div className="mx-auto max-w-2xl space-y-3">
                {steps.map((step) => (
                    <div
                        key={`${step.step}-${step.message}`}
                        className={`flex items-start gap-4 rounded-2xl border px-4 py-4 ${
                            step.status === 'completed'
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                            step.status === 'completed'
                                ? 'border-emerald-300 bg-white text-emerald-600'
                                : 'border-slate-200 bg-white text-slate-600'
                        }`}>
                            {step.status === 'active' ? (
                                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                            ) : step.status === 'completed' ? (
                                <HugeiconsIcon icon={tool === 'search' ? Search01Icon : SparklesIcon} className="h-4 w-4" />
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
        </div>
    );
}
