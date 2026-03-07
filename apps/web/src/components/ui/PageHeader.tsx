import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
    return (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 md:px-6 md:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    {icon && (
                        <div className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-blue-600 sm:flex">
                            {icon}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="mb-2 h-px w-12 bg-slate-200" />
                        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-[2rem]">
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-1.5 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 md:text-base">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {action && (
                    <div className="shrink-0 self-start lg:self-center lg:border-l lg:border-slate-200 lg:pl-4">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}
