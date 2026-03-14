interface ToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function ToggleRow({
    label,
    description,
    checked,
    onChange,
    disabled,
}: ToggleRowProps) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
            <div className="pr-4">
                <div className="text-sm font-semibold text-slate-900">{label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
            </div>

            <span
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                    checked ? 'bg-slate-900' : 'bg-slate-300'
                }`}
            >
                <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </span>
        </button>
    );
}
