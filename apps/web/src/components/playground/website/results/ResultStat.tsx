interface ResultStatProps {
    label: string;
    value: string | number;
}

export function ResultStat({ label, value }: ResultStatProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
        </div>
    );
}
