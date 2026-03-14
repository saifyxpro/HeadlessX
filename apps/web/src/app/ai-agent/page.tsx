"use client";

import { SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AiAgentPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Agent"
                description="Automated agent workflows will live here."
                icon={<HugeiconsIcon icon={SparklesIcon} size={24} />}
            />

            <Card className="overflow-hidden border-slate-200 bg-white">
                <CardHeader className="border-b border-slate-200 pb-4">
                    <CardTitle className="text-lg text-slate-900">Coming Soon</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        This section is reserved for AI-driven crawl and scrape orchestration.
                    </p>
                </CardHeader>
                <CardContent className="flex min-h-[320px] items-center justify-center p-8">
                    <div className="max-w-md text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-blue-50 text-blue-600">
                            <HugeiconsIcon icon={SparklesIcon} size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Coming soon</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            The AI Agent workspace is not live yet. It will be added here without changing the rest of your dashboard navigation.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
