interface PathPatternFieldsProps {
    includePaths: string;
    setIncludePaths: (value: string) => void;
    excludePaths: string;
    setExcludePaths: (value: string) => void;
    disabled?: boolean;
}

export function PathPatternFields({
    includePaths,
    setIncludePaths,
    excludePaths,
    setExcludePaths,
    disabled,
}: PathPatternFieldsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Include Paths
                </label>
                <textarea
                    value={includePaths}
                    onChange={(event) => setIncludePaths(event.target.value)}
                    placeholder={"/docs/.*\n/blog/.*"}
                    disabled={disabled}
                    rows={4}
                    className="custom-scrollbar w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
                <p className="text-xs leading-5 text-slate-500">One regex per line. Leave empty to allow all matching paths.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Exclude Paths
                </label>
                <textarea
                    value={excludePaths}
                    onChange={(event) => setExcludePaths(event.target.value)}
                    placeholder={"/tag/.*\n/search/.*"}
                    disabled={disabled}
                    rows={4}
                    className="custom-scrollbar w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
                <p className="text-xs leading-5 text-slate-500">Exclude matching paths before queueing crawl pages or map links.</p>
            </div>
        </div>
    );
}
