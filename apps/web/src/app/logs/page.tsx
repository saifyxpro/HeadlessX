'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Eye,
    FileText,
    Loader2,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface LogEntry {
    id: string;
    url: string;
    method: string;
    status_code?: number | null;
    duration_ms?: number | null;
    error_message?: string | null;
    created_at: string;
    api_key?: {
        name?: string | null;
    } | null;
}

interface LogsResponse {
    success: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
    logs: LogEntry[];
}

interface StatsResponse {
    success: boolean;
    stats: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        successRate: string;
        avgLatency: string;
    };
}

const STATUS_FILTER_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'success', label: 'Success only' },
    { value: 'error', label: 'Errors only' },
    { value: 'pending', label: 'Pending only' },
    { value: 'system', label: 'System only' },
];

const PAGE_SIZE_OPTIONS = [
    { value: '25', label: '25 rows' },
    { value: '50', label: '50 rows' },
    { value: '100', label: '100 rows' },
];

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function formatRelativeTime(value: string) {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function getStatusMeta(statusCode?: number | null) {
    if (statusCode === 0 || statusCode === undefined || statusCode === null) {
        return {
            label: 'Pending',
            tone: 'pending' as const,
            icon: Clock3,
            className: 'border-amber-200 bg-amber-50 text-amber-700',
        };
    }

    if (statusCode >= 200 && statusCode < 300) {
        return {
            label: 'Success',
            tone: 'success' as const,
            icon: CheckCircle2,
            className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        };
    }

    if (statusCode >= 400) {
        return {
            label: 'Error',
            tone: 'error' as const,
            icon: XCircle,
            className: 'border-rose-200 bg-rose-50 text-rose-700',
        };
    }

    return {
        label: 'System',
        tone: 'system' as const,
        icon: AlertCircle,
        className: 'border-slate-200 bg-slate-100 text-slate-700',
    };
}

function formatLatency(durationMs?: number | null) {
    if (durationMs === undefined || durationMs === null) {
        return 'N/A';
    }

    if (durationMs < 1000) {
        return `${durationMs} ms`;
    }

    return `${(durationMs / 1000).toFixed(2)} s`;
}

async function fetchLogs(page: number, limit: number): Promise<LogsResponse> {
    const res = await fetch(`/api/logs?page=${page}&limit=${limit}`);
    if (!res.ok) {
        throw new Error('Failed to fetch request logs');
    }
    return res.json();
}

async function fetchStats(): Promise<StatsResponse> {
    const res = await fetch('/api/logs/stats');
    if (!res.ok) {
        throw new Error('Failed to fetch log statistics');
    }
    return res.json();
}

function DetailField({ label, value, subtle = false }: { label: string; value: ReactNode; subtle?: boolean }) {
    return (
        <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</div>
            <div className={cn(
                'rounded-xl border px-4 py-3 text-sm text-slate-700',
                subtle ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
            )}>
                {value}
            </div>
        </div>
    );
}

function LogDetailsDialog({ log, open, onOpenChange }: { log: LogEntry | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!log) {
        return null;
    }

    const status = getStatusMeta(log.status_code);
    const StatusIcon = status.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-3xl gap-0 overflow-hidden border-slate-200 p-0 sm:rounded-2xl">
                <div className="border-b border-slate-100 bg-white px-6 py-5">
                    <DialogHeader className="mb-0 space-y-3 pr-10 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className="rounded-lg border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] uppercase text-slate-600"
                            >
                                {log.method}
                            </Badge>
                            <Badge className={cn('gap-1 rounded-full border px-2.5 py-1 font-medium', status.className)}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {log.status_code ?? 'N/A'} · {status.label}
                            </Badge>
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                                {formatRelativeTime(log.created_at)}
                            </Badge>
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold tracking-tight">Log Details</DialogTitle>
                            <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">
                                Inspect the selected request without leaving the logs workspace.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                </div>

                <div className="max-h-[calc(85vh-108px)] space-y-6 overflow-y-auto px-6 py-6">
                    <div className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Request URL</div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm break-all text-slate-700">
                            {log.url}
                        </div>
                        {(log.url.startsWith('http://') || log.url.startsWith('https://')) && (
                            <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                            >
                                Open target <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <DetailField label="Method" value={log.method} />
                        <DetailField label="Status" value={`${log.status_code ?? 'N/A'} · ${status.label}`} />
                        <DetailField label="Latency" value={formatLatency(log.duration_ms)} />
                        <DetailField label="API Key" value={log.api_key?.name || 'Dashboard / Internal'} />
                        <DetailField label="Requested At" value={formatTimestamp(log.created_at)} />
                        <DetailField label="Request ID" value={<span className="font-mono text-[13px] text-slate-600">{log.id}</span>} />
                    </div>

                    <DetailField
                        label="Error Message"
                        subtle
                        value={
                            <div className="min-h-[120px] whitespace-pre-wrap break-words leading-6 text-slate-700">
                                {log.error_message || 'No error recorded for this request.'}
                            </div>
                        }
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LogsPageSkeleton() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Request Logs"
                description="Inspect request history, response health, and latency trends."
                icon={<FileText className="h-5 w-5" />}
            />

            <div className="space-y-7 pb-4">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-28" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0 md:px-6">
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-7 w-20 rounded-full" />
                                <Skeleton className="h-7 w-20 rounded-full" />
                                <Skeleton className="h-7 w-24 rounded-full" />
                            </div>
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_220px_180px]">
                                <Skeleton className="h-11 w-full rounded-xl" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-4">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0 md:px-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <div className="space-y-3 p-4">
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <Skeleton key={index} className="h-16 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function LogsPage() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

    const {
        data: logsData,
        isLoading: logsLoading,
        isFetching: logsFetching,
        refetch: refetchLogs,
    } = useQuery({
        queryKey: ['request-logs', page, pageSize],
        queryFn: () => fetchLogs(page, pageSize),
        refetchInterval: 10000,
    });

    const {
        data: statsData,
        isLoading: statsLoading,
        isFetching: statsFetching,
        refetch: refetchStats,
    } = useQuery({
        queryKey: ['request-logs-stats'],
        queryFn: fetchStats,
        refetchInterval: 15000,
    });

    const logs = logsData?.logs ?? [];
    const totalPages = Math.max(1, Math.ceil((logsData?.pagination?.total ?? 0) / pageSize));
    const isRefreshing = logsFetching || statsFetching;
    const hasActiveFilters = Boolean(search.trim()) || statusFilter !== 'all' || pageSize !== 25;

    const filteredLogs = useMemo(() => {
        const query = search.trim().toLowerCase();

        return logs.filter((log) => {
            const status = getStatusMeta(log.status_code);
            const matchesStatus = statusFilter === 'all' || status.tone === statusFilter;

            const haystack = [
                log.url,
                log.method,
                log.api_key?.name || '',
                log.error_message || '',
                String(log.status_code ?? ''),
            ]
                .join(' ')
                .toLowerCase();

            const matchesSearch = !query || haystack.includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [logs, search, statusFilter]);

    useEffect(() => {
        if (filteredLogs.length === 0) {
            setSelectedLogId(null);
            return;
        }

        if (selectedLogId && !filteredLogs.some((log) => log.id === selectedLogId)) {
            setSelectedLogId(null);
        }
    }, [filteredLogs, selectedLogId]);

    const selectedLog = filteredLogs.find((log) => log.id === selectedLogId) ?? null;

    const handleRefresh = async () => {
        await Promise.all([refetchStats(), refetchLogs()]);
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPageSize(25);
        setPage(1);
    };

    if (logsLoading && statsLoading) {
        return <LogsPageSkeleton />;
    }

    const statCards = [
        {
            title: 'Total Requests',
            value: statsData?.stats.totalRequests ?? 0,
            hint: 'Across dashboard and API traffic',
            accent: 'bg-blue-50 text-blue-700 border-blue-100',
            icon: FileText,
        },
        {
            title: 'Success Rate',
            value: `${statsData?.stats.successRate ?? '0.0'}%`,
            hint: `${statsData?.stats.successfulRequests ?? 0} successful requests`,
            accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            icon: CheckCircle2,
        },
        {
            title: 'Failed Requests',
            value: statsData?.stats.failedRequests ?? 0,
            hint: '4xx and 5xx responses',
            accent: 'bg-rose-50 text-rose-700 border-rose-100',
            icon: XCircle,
        },
        {
            title: 'Avg Latency',
            value: `${statsData?.stats.avgLatency ?? '0.00'} s`,
            hint: 'Average request duration',
            accent: 'bg-amber-50 text-amber-700 border-amber-100',
            icon: Clock3,
        },
    ];

    return (
        <>
            <div className="space-y-6">
                <PageHeader
                    title="Request Logs"
                    description="Inspect request history, response health, and latency trends from the dashboard and API layer."
                    icon={<FileText className="h-5 w-5" />}
                    action={
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                                <span className={cn('h-2 w-2 rounded-full', isRefreshing ? 'bg-amber-500' : 'bg-emerald-500')} />
                                {isRefreshing ? 'Refreshing' : 'Auto-refreshing'}
                            </div>
                            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="h-10">
                                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Refresh
                            </Button>
                        </div>
                    }
                />

                <div className="space-y-7 pb-4">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {statCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.title}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <CardDescription className="font-medium uppercase tracking-[0.14em] text-[11px] text-slate-400">
                                                    {card.title}
                                                </CardDescription>
                                                <CardTitle className="mt-2 text-[1.65rem] font-bold tracking-tight">{card.value}</CardTitle>
                                            </div>
                                            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', card.accent)}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-500">{card.hint}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                    <CardTitle className="text-lg">Log Filters</CardTitle>
                                    <CardDescription className="mt-1 text-sm leading-6 text-slate-500">
                                        Search the current result window, narrow response states, and keep the table dense enough for real inspection work.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0 md:px-6">
                            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600">
                                        {filteredLogs.length} visible
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600">
                                        {logsData?.pagination?.total ?? 0} total
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600">
                                        Page {page} / {totalPages}
                                    </Badge>
                                    {hasActiveFilters && (
                                        <Button variant="outline" onClick={handleResetFilters} className="h-9 rounded-full px-4">
                                            Reset filters
                                        </Button>
                                    )}
                                </div>

                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_220px_180px] lg:items-end">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Search</label>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={search}
                                                onChange={(event) => setSearch(event.target.value)}
                                                placeholder="Search URL, method, API key, status, or error"
                                                className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Status</label>
                                        <CustomDropdown
                                            value={statusFilter}
                                            onChange={setStatusFilter}
                                            options={STATUS_FILTER_OPTIONS}
                                            placeholder="All statuses"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Rows per Page</label>
                                        <CustomDropdown
                                            value={String(pageSize)}
                                            onChange={(value) => {
                                                setPageSize(Number(value));
                                                setPage(1);
                                            }}
                                            options={PAGE_SIZE_OPTIONS}
                                            placeholder="25 rows"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-slate-500">
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Client-side filters on loaded rows</span>
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Click any row to inspect full details</span>
                                    {search.trim() && (
                                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                            Search: <span className="font-semibold text-slate-700">{search.trim()}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="text-lg">Request Stream</CardTitle>
                                    <CardDescription className="mt-1 text-sm leading-6 text-slate-500">
                                        Live request activity for the current page window. Open any row in an overlay to inspect URL, timing, and failure metadata.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0 md:px-6">
                            {filteredLogs.length === 0 ? (
                                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">No logs matched this filter set</h3>
                                        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                                            Try widening the search term or changing the status filter. The backend still returns the current page correctly.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200">
                                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                        <div className="text-sm text-slate-600">
                                            Showing <span className="font-medium text-slate-800">{filteredLogs.length}</span> rows on page <span className="font-medium text-slate-800">{page}</span> of <span className="font-medium text-slate-800">{totalPages}</span>
                                        </div>
                                        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                                            Table stays dense. Details open in overlay.
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-white text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                <tr>
                                                    <th className="px-5 py-3.5">Request</th>
                                                    <th className="px-5 py-3.5">Status</th>
                                                    <th className="px-5 py-3.5">Latency</th>
                                                    <th className="px-5 py-3.5">API Key</th>
                                                    <th className="px-5 py-3.5">Time</th>
                                                    <th className="px-5 py-3.5 text-right">Inspect</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredLogs.map((log) => {
                                                    const status = getStatusMeta(log.status_code);
                                                    const StatusIcon = status.icon;
                                                    const isSelected = log.id === selectedLogId;

                                                    return (
                                                        <tr
                                                            key={log.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={`Open log details for ${log.url}`}
                                                            className={cn(
                                                                'border-t border-slate-100 align-top transition-colors',
                                                                isSelected ? 'bg-primary/5' : 'hover:bg-slate-50/70 focus-within:bg-slate-50/70'
                                                            )}
                                                            onClick={() => setSelectedLogId(log.id)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                    event.preventDefault();
                                                                    setSelectedLogId(log.id);
                                                                }
                                                            }}
                                                        >
                                                            <td className="px-5 py-4 align-top">
                                                                <div className="min-w-0 space-y-1.5">
                                                                    <div className="flex items-start gap-3">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="rounded-lg border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] uppercase text-slate-600"
                                                                        >
                                                                            {log.method}
                                                                        </Badge>
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="truncate font-medium text-slate-900">{log.url}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="truncate text-xs leading-5 text-slate-500">
                                                                        {log.error_message || 'No error recorded'}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 align-top">
                                                                <Badge className={cn('gap-1 rounded-full border px-2.5 py-1 font-medium', status.className)}>
                                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                                    {log.status_code ?? 'N/A'} · {status.label}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-5 py-4 align-top font-medium text-slate-700">{formatLatency(log.duration_ms)}</td>
                                                            <td className="px-5 py-4 align-top text-slate-600">{log.api_key?.name || 'Dashboard / Internal'}</td>
                                                            <td className="px-5 py-4 align-top text-slate-500">{formatRelativeTime(log.created_at)}</td>
                                                            <td className="px-5 py-4 align-top text-right">
                                                                <Button
                                                                    variant="outline"
                                                                    className="h-8 rounded-lg px-3 text-xs"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setSelectedLogId(log.id);
                                                                    }}
                                                                >
                                                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-sm text-slate-500">
                                            Showing <span className="font-medium text-slate-700">{filteredLogs.length}</span> rows on page <span className="font-medium text-slate-700">{page}</span> of <span className="font-medium text-slate-700">{totalPages}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="h-10">
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                                disabled={page >= totalPages}
                                                className="h-10"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <LogDetailsDialog
                log={selectedLog}
                open={Boolean(selectedLog)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedLogId(null);
                    }
                }}
            />
        </>
    );
}
