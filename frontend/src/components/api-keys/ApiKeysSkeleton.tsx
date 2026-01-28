'use client';

import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export function ApiKeysSkeleton() {
    return (
        <div className="min-h-screen space-y-8">
            <PageHeader
                title="API Keys"
                description="Manage access tokens and authentication for your applications."
                action={
                    <Button disabled className="h-11 px-6 bg-primary/50 text-white font-medium shadow-lg shadow-primary/20 rounded-xl opacity-60">
                        <Plus className="mr-2 h-5 w-5" />
                        New Key
                    </Button>
                }
            />

            <div className="max-w-5xl mx-auto px-6">
                {/* List Header Skeleton */}
                <div className="flex items-center justify-between p-4 mb-2">
                    <Skeleton className="h-5 w-28" />
                </div>

                {/* List Items Skeleton */}
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-b-0">
                            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-64" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-9 w-20 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
