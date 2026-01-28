'use client';

import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";

export function OverviewSkeleton() {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Overview"
                description="Welcome back to your scraping command center."
            />

            {/* Stats Cards Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-6 md:px-8 max-w-[1600px] mx-auto">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="col-span-1 bg-white/60 backdrop-blur-xl border-white/50 shadow-premium h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-6 md:px-8 max-w-[1600px] mx-auto pb-8">
                {/* Activity Feed Skeleton */}
                <div className="col-span-1 lg:col-span-2 rounded-3xl border border-white/50 bg-white/60 backdrop-blur-xl shadow-premium overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 pb-4">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="p-4 flex-1 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/50">
                                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="col-span-1 flex flex-col gap-6">
                    {/* Quick Actions Skeleton */}
                    <Card className="border-white/50 bg-white/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <Skeleton className="h-5 w-28 mb-1" />
                            <Skeleton className="h-4 w-20" />
                        </CardHeader>
                        <CardContent className="p-6 pt-2 grid gap-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-xl" />
                            ))}
                        </CardContent>
                    </Card>

                    {/* System Status Skeleton */}
                    <Card className="border-white/50 bg-white/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden flex-1">
                        <CardHeader className="p-6 pb-4">
                            <Skeleton className="h-5 w-28 mb-1" />
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                            <div className="pt-4 border-t border-slate-100/50 flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
