"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Activity02Icon,
    Key01Icon,
    PlayCircleIcon,
    File01Icon,
    ServerStack01Icon,
    ComputerIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import StackedList from "@/components/ui/stacked-list";
import { PageHeader } from "@/components/ui/PageHeader";
import { OverviewSkeleton } from "./OverviewSkeleton";

function RecentActivityList() {
    const { data: logsData } = useQuery({
        queryKey: ["dashboard-logs"],
        queryFn: async () => {
            const res = await fetch('/api/logs?limit=5');
            if (!res.ok) throw new Error('Failed to fetch logs');
            return res.json();
        },
        refetchInterval: 10000
    });

    const activityItems = logsData?.logs?.map((log: any) => {
        let status = 'System';
        let icon = Activity02Icon;

        if (log.status_code === 0 || log.status_code === undefined) {
            status = 'Pending';
            icon = Activity02Icon;
        } else if (log.status_code >= 200 && log.status_code < 300) {
            status = 'Success';
            icon = PlayCircleIcon;
        } else if (log.status_code >= 400) {
            status = 'Error';
            icon = Activity02Icon;
        } else {
            status = 'System'; // 1xx, 3xx
        }

        return {
            id: log.id,
            title: `${log.method} ${log.url}`,
            subtitle: `${new Date(log.created_at).toLocaleTimeString()} • ${log.duration_ms}ms`,
            status,
            icon,
            active: false
        };
    }) || [];

    if (activityItems.length === 0) {
        return <div className="p-8 text-center text-slate-500">No recent activity</div>;
    }

    return (
        <StackedList
            items={activityItems}
            title=""
        />
    );
}

export default function Overview() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        refetchInterval: 30000 // Refetch every 30s
    });

    if (isLoading) {
        return <OverviewSkeleton />;
    }

    const failedRate = Number.parseFloat(stats?.failedRate || "0");
    const browserUsage = stats?.maxConcurrency
        ? Math.min(100, ((stats?.runningBrowsers || 0) / stats.maxConcurrency) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Overview"
                description="Welcome back to your scraping command center."
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Card className="col-span-1 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Total Jobs
                        </CardTitle>
                        <HugeiconsIcon icon={PlayCircleIcon} className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.totalJobs || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Request logs captured by the API
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-1 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Failure Rate
                        </CardTitle>
                        <HugeiconsIcon icon={Activity02Icon} className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.failedRate || "0.0%"}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Lower is better for scrape reliability
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-1 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Global Proxy
                        </CardTitle>
                        <HugeiconsIcon icon={ServerStack01Icon} className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.proxyEnabled ? 'Enabled' : 'Disabled'}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {stats?.proxyEnabled
                                ? 'Every scrape now routes through the configured global proxy.'
                                : 'Scrapes run directly until you enable the global proxy in Settings.'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-1 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Browser Capacity
                        </CardTitle>
                        <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats?.runningBrowsers || 0} / {stats?.maxConcurrency || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {stats?.browserHeadless ? 'Headless' : 'Visible'} browser mode
                        </p>
                    </CardContent>
                </Card>

            </div>

            <div className="grid gap-5 pb-2 xl:grid-cols-12">
                {/* Main Content - Activity Feed */}
                <Card className="xl:col-span-8 overflow-hidden min-h-[500px]">
                    <div className="p-6 pb-4">
                        <h3 className="font-semibold text-lg text-slate-900 leading-none tracking-tight">Recent Activity</h3>
                        <p className="text-sm text-slate-500 pt-1.5">Latest system events and triggers.</p>
                    </div>
                    <div className="p-2 flex-1">
                        <RecentActivityList />
                    </div>
                </Card>

                {/* Right Column - Actions & Status */}
                <div className="xl:col-span-4 flex flex-col gap-5">
                    {/* Quick Actions */}
                    <Card className="overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-lg text-slate-900">Quick Actions</CardTitle>
                            <p className="text-sm text-slate-500">Common tasks</p>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 grid gap-3">
                            <Link href="/playground" className="w-full">
                                <Button className="w-full justify-start h-11 px-5" variant="outline">
                                    <HugeiconsIcon icon={PlayCircleIcon} className="mr-3 h-5 w-5 text-blue-500" />
                                    <span className="font-medium">Playground</span>
                                </Button>
                            </Link>
                            <Link href="/settings" className="w-full">
                                <Button className="w-full justify-start h-11 px-5" variant="outline">
                                    <HugeiconsIcon icon={ComputerIcon} className="mr-3 h-5 w-5 text-amber-500" />
                                    <span className="font-medium">Settings</span>
                                </Button>
                            </Link>
                            <Link href="/logs" className="w-full">
                                <Button className="w-full justify-start h-11 px-5" variant="outline">
                                    <HugeiconsIcon icon={File01Icon} className="mr-3 h-5 w-5 text-slate-500" />
                                    <span className="font-medium">View Logs</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* System Status - Fills remaining space */}
                    <Card className="overflow-hidden flex-1">
                        <CardHeader className="p-6 pb-4">
                            <CardTitle className="text-lg text-slate-900 flex items-center justify-between">
                                System Status
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </CardTitle>
                            <p className="text-sm text-slate-500">Real-time health monitor</p>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-slate-600">
                                    <span>Browser Usage</span>
                                    <span className="text-slate-900">{stats?.runningBrowsers || 0} / {stats?.maxConcurrency || 0}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${browserUsage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-slate-600">
                                    <span>Global Proxy</span>
                                    <span className="text-slate-900">{stats?.proxyEnabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                    {stats?.proxyEnabled
                                        ? 'Every browser session now routes through the configured global proxy.'
                                        : 'Requests are running directly unless you enable a proxy in Settings.'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-slate-600">
                                    <span>Estimated Success Rate</span>
                                    <span className="text-slate-900">{Math.max(0, 100 - failedRate).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(0, 100 - failedRate)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <HugeiconsIcon icon={Activity02Icon} size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">System Healthy</div>
                                        <div className="text-xs text-slate-500">All services operational</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
