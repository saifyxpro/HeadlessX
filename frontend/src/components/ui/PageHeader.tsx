import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start mb-10 gap-6 border-b border-border/40 pb-8 relative">
            {/* Subtle decorative background gradient */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/0 via-transparent to-transparent pointer-events-none" />

            <div className="relative flex gap-5 items-start z-10">
                {icon && (
                    <div className="hidden sm:flex mt-1 items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200/60 shadow-sm text-blue-600 shrink-0">
                        {icon}
                    </div>
                )}

                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-3xl">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {action && (
                <div className="relative shrink-0 pt-1 z-10 self-start sm:self-center">
                    {action}
                </div>
            )}
        </div>
    );
}
