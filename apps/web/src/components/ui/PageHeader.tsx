import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
    return (
        <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 md:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                        {icon && (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_60%),linear-gradient(135deg,rgba(255,255,255,1),rgba(241,245,249,1))] text-blue-600 ring-1 ring-slate-200">
                                {icon}
                            </div>
                        )}

                        <div className="min-w-0">
                            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-[2rem]">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-1.5 max-w-3xl text-sm font-medium leading-6 text-slate-500 md:text-base">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {action && (
                    <div className="flex w-full shrink-0 flex-wrap items-center gap-3 self-start xl:w-auto xl:self-center xl:justify-end">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}
