'use client';

import { cn } from '@/lib/utils';

interface WorkbenchLayoutProps {
    header: React.ReactNode;
    config: React.ReactNode;
    results: React.ReactNode;
    className?: string;
    gridClassName?: string;
}

export function WorkbenchLayout({
    header,
    config,
    results,
    className,
    gridClassName,
}: WorkbenchLayoutProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {header}
            <div className={cn('grid items-start gap-6 xl:grid-cols-12', gridClassName)}>
                {config}
                {results}
            </div>
        </div>
    );
}
