'use client';

import { HugeiconsIcon } from '@hugeicons/react';

interface PlaygroundEmptyStateProps {
    icon: any;
    title: string;
    body: string;
}

export function PlaygroundEmptyState({ icon, title, body }: PlaygroundEmptyStateProps) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,1),rgba(241,245,249,1))] ring-1 ring-slate-200">
                <HugeiconsIcon icon={icon} className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">{title}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{body}</p>
        </div>
    );
}
