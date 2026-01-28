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
    const res = await fetch('/api/config', { headers: { 'x-api-key': 'dashboard-internal' } });
    return res.json();
};

const updateConfig = async (data: any) => {
    const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'dashboard-internal' },
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

    const [formData, setFormData] = useState<any>({});
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
            <div className="min-h-screen p-8 bg-slate-50/50">
                <Skeleton className="h-32 w-full rounded-3xl mb-8" />
                <div className="flex gap-8">
                    <Skeleton className="h-64 w-72 rounded-3xl" />
                    <Skeleton className="h-96 flex-1 rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-8">
            <PageHeader
                title="Settings"
                description="Configure your scraping engine and behavior."
                action={
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className={cn("rounded-xl shadow-lg transition-all", saved ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "shadow-primary/20")}
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

            <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full lg:w-72 shrink-0 space-y-2">
                    <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-2 rounded-2xl shadow-premium sticky top-24">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-medium",
                                    activeTab === tab.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1"
                                        : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
                                )}
                            >
                                <HugeiconsIcon icon={tab.icon} size={20} className={activeTab === tab.id ? "text-white" : "text-slate-400"} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
                            <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            {error}
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <Card className="border-white/50 bg-white/60 backdrop-blur-xl shadow-premium">
                            <CardHeader className="border-b border-slate-100/50 pb-4">
                                <CardTitle className="text-xl text-slate-900">General Configuration</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Control basic application behavior</p>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center justify-between p-5 bg-white/50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                                            Headless Mode
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">FAST</span>
                                        </div>
                                        <div className="text-sm text-slate-500">Run browser without UI (faster execution)</div>
                                    </div>
                                    <Switch checked={formData.browserHeadless} onCheckedChange={(c) => handleChange('browserHeadless', c)} />
                                </div>
                                <div className="p-5 bg-white/50 rounded-2xl border border-slate-100 shadow-sm space-y-3 transition-all hover:shadow-md hover:border-slate-200">
                                    <label className="text-sm font-semibold text-slate-900">Browser Timeout (ms)</label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={formData.browserTimeout || 60000}
                                            onChange={(e) => handleChange('browserTimeout', parseInt(e.target.value))}
                                            className="max-w-[120px] bg-white border-slate-200"
                                        />
                                        <p className="text-xs text-slate-400">Max execution time per job</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/50 rounded-2xl border border-slate-100 shadow-sm space-y-3 transition-all hover:shadow-md hover:border-slate-200">
                                    <label className="text-sm font-semibold text-slate-900">Max Concurrent Jobs</label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={formData.maxConcurrency || 5}
                                            onChange={(e) => handleChange('maxConcurrency', parseInt(e.target.value))}
                                            className="max-w-[120px] bg-white border-slate-200"
                                        />
                                        <p className="text-xs text-slate-400">Recommended: 3-8 depending on system resources</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'proxies' && <ProxiesTab />}

                    {activeTab === 'camoufox' && (
                        <Card className="border-white/50 bg-white/60 backdrop-blur-xl shadow-premium">
                            <CardHeader className="border-b border-slate-100/50 pb-4">
                                <CardTitle className="text-xl text-slate-900">Camoufox Engine</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Advanced anti-detect browser configuration</p>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center justify-between p-5 bg-white/50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-slate-900">Block WebRTC</div>
                                        <div className="text-sm text-slate-500">Prevent IP leaks via WebRTC</div>
                                    </div>
                                    <Switch checked={formData.camoufoxBlockWebrtc} onCheckedChange={(c) => handleChange('camoufoxBlockWebrtc', c)} />
                                </div>
                                <div className="flex items-center justify-between p-5 bg-white/50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-slate-900">Camoufox GeoIP</div>
                                        <div className="text-sm text-slate-500">Spoof location based on IP</div>
                                    </div>
                                    <Switch checked={formData.camoufoxGeoip} onCheckedChange={(c) => handleChange('camoufoxGeoip', c)} />
                                </div>
                                <div className="flex items-center justify-between p-5 bg-white/50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
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
