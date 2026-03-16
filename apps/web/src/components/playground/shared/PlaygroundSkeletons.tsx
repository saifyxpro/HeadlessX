import { Skeleton } from '@/components/ui/Skeleton';
import { WorkbenchLayout } from './WorkbenchLayout';

function WorkbenchHeaderSkeleton() {
    return (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="min-w-0 space-y-2">
                            <Skeleton className="h-7 w-44 rounded-xl" />
                            <Skeleton className="h-4 w-[28rem] max-w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    <Skeleton className="h-9 w-28 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                    <Skeleton className="h-9 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}

function ConfigPanelSkeleton() {
    return (
        <div className="space-y-6 lg:col-span-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-11 w-11 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-36 rounded-xl" />
                            <Skeleton className="h-4 w-56 rounded-xl" />
                            <Skeleton className="h-4 w-48 rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-28 rounded-full" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>

                        <div className="space-y-3">
                            <Skeleton className="h-3 w-24 rounded-full" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>

                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full rounded-2xl" />
                            <Skeleton className="h-16 w-full rounded-2xl" />
                        </div>

                        <Skeleton className="h-12 w-full rounded-2xl" />

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Skeleton className="h-11 w-full rounded-xl" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResultsPanelSkeleton() {
    return (
        <div className="relative flex min-h-[700px] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white xl:col-span-8">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40 rounded-xl" />
                    <Skeleton className="h-4 w-60 rounded-xl" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
            </div>

            <div className="flex min-h-[640px] flex-1 flex-col bg-white p-8">
                <div className="space-y-5">
                    <Skeleton className="h-56 w-full rounded-[1.5rem]" />

                    <div className="grid gap-4 sm:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-28 rounded-[1.5rem]" />
                        ))}
                    </div>

                    <Skeleton className="h-40 w-full rounded-[1.5rem]" />
                    <Skeleton className="h-64 w-full rounded-[1.5rem]" />
                </div>
            </div>
        </div>
    );
}

export function PlaygroundWorkbenchSkeleton() {
    return (
        <WorkbenchLayout
            header={<WorkbenchHeaderSkeleton />}
            config={<ConfigPanelSkeleton />}
            results={<ResultsPanelSkeleton />}
        />
    );
}

export function PlaygroundLandingSkeleton() {
    return (
        <div className="space-y-6 pb-10">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-40 rounded-xl" />
                        <Skeleton className="h-4 w-80 max-w-full rounded-xl" />
                    </div>
                </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 md:p-10">
                <div className="mx-auto max-w-3xl space-y-6 text-center">
                    <Skeleton className="mx-auto h-8 w-52 rounded-full" />
                    <Skeleton className="mx-auto h-12 w-3/4 rounded-2xl" />
                    <Skeleton className="mx-auto h-6 w-2/3 rounded-2xl" />
                    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-slate-50 p-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="ml-3 h-5 w-5 rounded-full" />
                            <Skeleton className="h-12 flex-1 rounded-xl" />
                            <Skeleton className="h-11 w-28 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-[1.75rem] border border-slate-200 bg-white p-8">
                        <div className="space-y-5">
                            <div className="flex items-start justify-between">
                                <Skeleton className="h-16 w-16 rounded-2xl" />
                                <Skeleton className="h-7 w-20 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-40 rounded-xl" />
                                <Skeleton className="h-4 w-28 rounded-xl" />
                            </div>
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-7 w-20 rounded-full" />
                                <Skeleton className="h-7 w-24 rounded-full" />
                                <Skeleton className="h-7 w-16 rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
