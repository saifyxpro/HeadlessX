'use client';

import { cn } from '@/lib/utils';

interface ConfigPanelShellProps {
    iconSlot: React.ReactNode;
    title: string;
    description: string;
    disabled?: boolean;
    children: React.ReactNode;
}

export function ConfigPanelShell({
    iconSlot,
    title,
    description,
    disabled = false,
    children,
}: ConfigPanelShellProps) {
    return (
        <div className="space-y-6 lg:col-span-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        {iconSlot}
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                            <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">{description}</p>
                        </div>
                    </div>

                    <div className={cn(disabled ? 'pointer-events-none opacity-70' : '')}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
