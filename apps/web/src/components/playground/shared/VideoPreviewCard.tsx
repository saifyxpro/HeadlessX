'use client';

import { PlayIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface VideoPreviewCardProps {
    title: string;
    description: string;
    src?: string | null;
    poster?: string | null;
    badge?: string | null;
    detail?: string | null;
    mimeType?: string | null;
}

export function VideoPreviewCard({
    title,
    description,
    src,
    poster,
    badge,
    detail,
    mimeType,
}: VideoPreviewCardProps) {
    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
            <div className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="truncate text-lg font-bold text-slate-900">{title}</div>
                        <div className="mt-1 truncate text-sm text-slate-500">{description}</div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {badge ? (
                            <div className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                {badge}
                            </div>
                        ) : null}
                        {detail ? (
                            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                {detail}
                            </div>
                        ) : null}
                    </div>
                </div>

                {src ? (
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">
                        <video
                            key={src}
                            controls
                            playsInline
                            preload="metadata"
                            poster={poster || undefined}
                            className="aspect-video w-full bg-black"
                        >
                            <source src={src} type={mimeType || undefined} />
                            Your browser could not play this preview.
                        </video>
                    </div>
                ) : poster ? (
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                        <img src={poster} alt={title} className="aspect-video w-full object-cover" />
                    </div>
                ) : (
                    <div className="flex aspect-video items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                        <HugeiconsIcon icon={PlayIcon} className="h-8 w-8" />
                    </div>
                )}
            </div>
        </div>
    );
}
