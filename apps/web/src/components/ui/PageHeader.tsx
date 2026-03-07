import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
    return (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white px-6 py-5 md:px-7 md:py-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    {icon && (
                        <div className="hidden sm:flex mt-0.5 items-center justify-center w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 text-blue-600 shrink-0">
                            {icon}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="mb-2 h-px w-14 bg-slate-900/10" />
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-2 text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-3xl">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {action && (
                    <div className="shrink-0 self-start sm:self-center sm:border-l sm:border-slate-200 sm:pl-5">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}
