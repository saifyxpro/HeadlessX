"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ComputerIcon,
    Shield01Icon,
    FloppyDiskIcon,
    Loading03Icon,
    CheckmarkCircle02Icon,
    Database01Icon as Server01Icon,
    Cancel01Icon,
    CpuIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import ProxiesTab from "@/components/dashboard/ProxiesTab";

// --- API Functions ---
const fetchConfig = async () => {
    const res = await fetch('/api/config');
    return res.json();
};

const updateConfig = async (data: any) => {
    const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save settings');
    return json;
};

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['config'], queryFn: fetchConfig });
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: updateConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['config'] });
            setSaved(true);
            setError(null);
            setTimeout(() => setSaved(false), 2000);
        },
        onError: (err: Error) => {
            setError(err.message);
            setTimeout(() => setError(null), 5000);
        }
    });

    const [formData, setFormData] = useState<any>({ browserHeadless: true });
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        if (data?.config) {
            setFormData(data.config);
        }
    }, [data]);

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        mutation.mutate(formData);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: ComputerIcon },
        { id: 'camoufox', label: 'Browser Engine', icon: CpuIcon },

        { id: 'proxies', label: 'Proxies', icon: Server01Icon },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-96 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Configure your scraping engine and behavior."
                action={
                    <Button
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className={cn(saved ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                    >
                        {mutation.isPending ? (
                            <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" />
                        ) : saved ? (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-2" />
                        ) : (
                            <HugeiconsIcon icon={FloppyDiskIcon} className="mr-2" />
                        )}
                        {saved ? 'Saved!' : 'Save Changes'}
                    </Button>
                }
            />

            <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] items-start">
                {/* Sidebar */}
                <div className="space-y-2">
                    <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium",
                                    activeTab === tab.id
                                        ? "border-primary/15 bg-primary/8 text-primary"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <HugeiconsIcon icon={tab.icon} size={20} className={activeTab === tab.id ? "text-primary" : "text-slate-400"} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                            <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            {error}
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <Card>
                            <CardHeader className="border-b border-slate-200 pb-4">
                                <CardTitle className="text-lg text-slate-900">General Configuration</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Control basic application behavior</p>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                                            Headless Mode
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">FAST</span>
                                        </div>
                                        <div className="text-sm text-slate-500">Run browser without UI (faster execution)</div>
                                    </div>
                                    <Switch checked={formData.browserHeadless ?? true} onCheckedChange={(c) => handleChange('browserHeadless', c)} />
                                </div>
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                    <label className="text-sm font-semibold text-slate-900">Browser Timeout (ms)</label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={formData.browserTimeout || 60000}
                                            onChange={(e) => handleChange('browserTimeout', parseInt(e.target.value))}
                                            className="max-w-[120px] bg-white"
                                        />
                                        <p className="text-xs text-slate-400">Max execution time per job</p>
                                    </div>
                                </div>
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                    <label className="text-sm font-semibold text-slate-900">Max Concurrent Jobs</label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={formData.maxConcurrency || 5}
                                            onChange={(e) => handleChange('maxConcurrency', parseInt(e.target.value))}
                                            className="max-w-[120px] bg-white"
                                        />
                                        <p className="text-xs text-slate-400">Recommended: 3-8 depending on system resources</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'proxies' && <ProxiesTab />}

                    {activeTab === 'camoufox' && (
                        <Card>
                            <CardHeader className="border-b border-slate-200 pb-4">
                                <CardTitle className="text-lg text-slate-900">Camoufox Engine</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Advanced anti-detect browser configuration</p>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-slate-900">Block WebRTC</div>
                                        <div className="text-sm text-slate-500">Prevent IP leaks via WebRTC</div>
                                    </div>
                                    <Switch checked={formData.camoufoxBlockWebrtc} onCheckedChange={(c) => handleChange('camoufoxBlockWebrtc', c)} />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-slate-900">Camoufox GeoIP</div>
                                        <div className="text-sm text-slate-500">Spoof location based on IP</div>
                                    </div>
                                    <Switch checked={formData.camoufoxGeoip} onCheckedChange={(c) => handleChange('camoufoxGeoip', c)} />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-slate-900">Enable Cache</div>
                                        <div className="text-sm text-slate-500">Cache resources for speed</div>
                                    </div>
                                    <Switch checked={formData.camoufoxEnableCache} onCheckedChange={(c) => handleChange('camoufoxEnableCache', c)} />
                                </div>
                            </CardContent>
                        </Card>
                    )}


                </div>
            </div>
        </div>
    );
}
