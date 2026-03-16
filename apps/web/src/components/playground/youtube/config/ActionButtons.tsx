'use client';

interface ActionButtonsProps {
    disabled?: boolean;
    isPending: boolean;
    onRun: () => void;
    onStop: () => void;
}

export function ActionButtons({ disabled = false, isPending, onRun, onStop }: ActionButtonsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <button
                type="button"
                onClick={onRun}
                disabled={disabled || isPending}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
                Extract
            </button>
            <button
                type="button"
                onClick={onStop}
                disabled={!isPending}
                className={`inline-flex h-12 items-center justify-center rounded-2xl border px-5 text-sm font-semibold transition-colors ${
                    isPending
                        ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                }`}
            >
                Stop
            </button>
        </div>
    );
}
