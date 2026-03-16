'use client';

import { cn } from '@/lib/utils';

interface ResultsPanelShellProps {
    header: React.ReactNode;
    children: React.ReactNode;
    bodyClassName?: string;
}

export function ResultsPanelShell({ header, children, bodyClassName }: ResultsPanelShellProps) {
    return (
        <div className="relative flex min-h-[700px] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white xl:col-span-8">
            {header}
            <div className={cn('relative flex min-h-[640px] flex-1 flex-col bg-white', bodyClassName)}>
                {children}
            </div>
        </div>
    );
}
