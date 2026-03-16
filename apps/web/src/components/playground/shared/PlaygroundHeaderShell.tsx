'use client';

import Link from 'next/link';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface PlaygroundHeaderShellProps {
    title: string;
    description: string;
    iconSlot: React.ReactNode;
    controls?: React.ReactNode;
    secondary?: React.ReactNode;
    backHref?: string;
}

export function PlaygroundHeaderShell({
    title,
    description,
    iconSlot,
    controls,
    secondary,
    backHref = '/playground',
}: PlaygroundHeaderShellProps) {
    return (
        <div className="group mb-6 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="flex items-start gap-4">
                        <div className="relative h-12 w-12 shrink-0">
                            <div className="absolute inset-0 transition-opacity duration-200 group-hover:opacity-0">
                                {iconSlot}
                            </div>
                            <Link
                                href={backHref}
                                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 opacity-0 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 group-hover:pointer-events-auto group-hover:opacity-100"
                            >
                                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                            </Link>
                        </div>

                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {title}
                            </h1>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                                {description}
                            </p>
                            {secondary ? <div className="mt-4">{secondary}</div> : null}
                        </div>
                    </div>
                </div>

                {controls ? <div className="flex flex-wrap items-center gap-3 xl:justify-end">{controls}</div> : null}
            </div>
        </div>
    );
}
