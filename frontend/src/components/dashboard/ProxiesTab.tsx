"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Loading03Icon,
    Database01Icon as Server01Icon,
    Wifi01Icon,
    Location01Icon,
    SignalIcon,
    PlusSignIcon,
    Delete02Icon,
    PencilEdit02Icon,
    CheckmarkCircle02Icon,
    Cancel01Icon,
    AlertCircleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// API Functions
const DASHBOARD_API_KEY = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || 'dashboard-internal';

const fetchProxies = async () => {
    const res = await fetch('/api/proxies', { headers: { 'x-api-key': DASHBOARD_API_KEY } });
    if (!res.ok) throw new Error('Failed to fetch proxies');
    return res.json();
};

const createProxy = async (data: any) => {
    const res = await fetch('/api/proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': DASHBOARD_API_KEY },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Failed to create proxy');
    }
    return res.json();
};

const updateProxy = async ({ id, ...data }: any) => {
    const res = await fetch(`/api/proxies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-api-key': DASHBOARD_API_KEY },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Failed to update proxy');
    }
    return res.json();
};

const deleteProxy = async (id: string) => {
    const res = await fetch(`/api/proxies/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': DASHBOARD_API_KEY },
    });
    if (!res.ok) throw new Error('Failed to delete proxy');
    return res.json();
};

const testProxy = async (id: string) => {
    const res = await fetch(`/api/proxies/${id}/test`, {
        method: 'POST',
        headers: { 'x-api-key': DASHBOARD_API_KEY },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Failed to test proxy');
    }
    return res.json();
};

export default function ProxiesTab() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['proxies'], queryFn: fetchProxies });
    const [showModal, setShowModal] = useState(false);
    const [editingProxy, setEditingProxy] = useState<any>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<any>(null);
    const [showTestModal, setShowTestModal] = useState(false);
    const [formError, setFormError] = useState<string | null>(null); // For modal errors

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        protocol: 'http',
        host: '',
        port: '',
        username: '',
        password: '',
        country: '',
        is_rotating: false,
    });

    const createMutation = useMutation({
        mutationFn: createProxy,
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['proxies'] });
            setShowModal(false);
            resetForm();
            // Automatically test the new proxy
            if (data?.proxy?.id) {
                handleTest(data.proxy.id);
            }
        },
        onError: (err: any) => setFormError(err.message)
    });

    const updateMutation = useMutation({
        mutationFn: updateProxy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proxies'] });
            setShowModal(false);
            setEditingProxy(null);
            resetForm();
        },
        onError: (err: any) => setFormError(err.message)
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProxy,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proxies'] }),
        onError: (err: any) => alert(`Failed to delete: ${err.message}`)
    });

    const testMutation = useMutation({
        mutationFn: testProxy,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['proxies'] }); // Refresh for Active status
            setTestResult(data);
            setShowTestModal(true);
            setTestingId(null);
        },
        onError: (error: any) => {
            queryClient.invalidateQueries({ queryKey: ['proxies'] }); // Refresh for Failed status
            setTestResult({ success: false, error: error.message || 'Test failed' });
            setShowTestModal(true);
            setTestingId(null);
        },
    });

    const resetForm = () => {
        setFormError(null);
        setFormData({
            name: '',
            protocol: 'http',
            host: '',
            port: '',
            username: '',
            password: '',
            country: '',
            is_rotating: false,
        });
    };

    const handleEdit = (proxy: any) => {
        setEditingProxy(proxy);
        setFormError(null);
        setFormData({
            name: proxy.name,
            protocol: proxy.protocol,
            host: proxy.host,
            port: proxy.port.toString(),
            username: proxy.username || '',
            password: proxy.password || '',
            country: proxy.country || '',
            is_rotating: proxy.is_rotating,
        });
        setShowModal(true);
    };

    const handleSubmit = () => {
        setFormError(null);
        if (!formData.name || !formData.host || !formData.port) {
            setFormError("Name, Host, and Port are required.");
            return;
        }

        const portNum = parseInt(formData.port, 10);
        if (isNaN(portNum)) {
            setFormError("Port must be a number.");
            return;
        }

        const payload = { ...formData, port: portNum };

        if (editingProxy) {
            updateMutation.mutate({ id: editingProxy.id, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleTest = (id: string) => {
        setTestingId(id);
        testMutation.mutate(id);
    };

    const proxies = data?.proxies || [];

    const getStatusBadge = (proxy: any) => {
        if (testingId === proxy.id) {
            return <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1"><HugeiconsIcon icon={Loading03Icon} className="animate-spin w-3 h-3" /> Testing</span>;
        }
        if (proxy.is_active) {
            return <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-emerald-50 text-emerald-700 border-emerald-100">Active</span>;
        }
        if (proxy.is_working === false) {
            return <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-red-50 text-red-600 border-red-100">Failed</span>;
        }
        return <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-slate-50 text-slate-600 border-slate-200">Inactive</span>;
    };

    return (
        <div className="space-y-6">
            <Card className="border-white/50 bg-white/60 backdrop-blur-xl shadow-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100/50">
                    <div>
                        <CardTitle className="text-xl text-slate-900">Saved Proxies</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Manage your proxy servers for use across profiles</p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setEditingProxy(null); setShowModal(true); }}
                        className="shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-xl"
                    >
                        <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" /> Add Proxy
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <HugeiconsIcon icon={Loading03Icon} className="animate-spin h-8 w-8 text-primary" />
                        </div>
                    ) : proxies.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <HugeiconsIcon icon={Server01Icon} className="mx-auto h-12 w-12 opacity-50 mb-4" />
                            <p>No proxies saved yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {proxies.map((proxy: any) => (
                                <div key={proxy.id} className="p-4 rounded-xl border border-slate-200 bg-white/50 hover:bg-white/90 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                                            proxy.is_working
                                                ? "bg-emerald-100 text-emerald-600"
                                                : (proxy.is_working === false ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400")
                                        )}>
                                            <HugeiconsIcon icon={Server01Icon} size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-slate-900">{proxy.name}</span>
                                                {getStatusBadge(proxy)}
                                                {proxy.is_rotating && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">Rotating</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 font-mono tracking-tight">
                                                {proxy.protocol}://{proxy.host}:{proxy.port}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                {proxy.country && (
                                                    <span className="flex items-center gap-1">
                                                        <HugeiconsIcon icon={Location01Icon} size={12} /> {proxy.country}
                                                    </span>
                                                )}
                                                {proxy.avg_latency && (
                                                    <span className="flex items-center gap-1">
                                                        <HugeiconsIcon icon={SignalIcon} size={12} /> {proxy.avg_latency}ms
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant={testingId === proxy.id ? "secondary" : "default"}
                                            onClick={() => handleTest(proxy.id)}
                                            disabled={!!testingId}
                                            className="rounded-lg h-9 shadow-sm"
                                        >
                                            {testingId === proxy.id ? (
                                                <HugeiconsIcon icon={Loading03Icon} className="animate-spin h-4 w-4 mr-2" />
                                            ) : (
                                                <HugeiconsIcon icon={Wifi01Icon} className="h-4 w-4 mr-2" />
                                            )}
                                            Test
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(proxy)} className="rounded-lg text-slate-500 hover:text-slate-900">
                                            <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => deleteMutation.mutate(proxy.id)}>
                                            <HugeiconsIcon icon={Delete02Icon} size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Test Result Modal */}
            <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {testResult?.success ? (
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-emerald-500" />
                            ) : (
                                <HugeiconsIcon icon={Cancel01Icon} className="text-red-500" />
                            )}
                            {testResult?.success ? 'Proxy Test Passed' : 'Proxy Test Failed'}
                        </DialogTitle>
                    </DialogHeader>
                    {testResult?.success ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">IP Address</div>
                                    <div className="font-mono font-medium text-slate-900">{testResult.ip || 'N/A'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">Latency</div>
                                    <div className="font-mono font-medium text-slate-900">{testResult.latency ? `${testResult.latency}ms` : 'N/A'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">Country</div>
                                    <div className="font-medium text-slate-900">{testResult.country || 'N/A'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">City</div>
                                    <div className="font-medium text-slate-900">{testResult.city || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                            {testResult?.error || 'Connection failed'}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add/Edit Proxy Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProxy ? 'Edit Proxy' : 'Add New Proxy'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                                <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                                {formError}
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium mb-1.5 block text-slate-700">Name</label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="My Proxy" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block text-slate-700">Protocol</label>
                            <div className="flex gap-2">
                                {['http', 'https', 'socks4', 'socks5'].map(p => (
                                    <Button
                                        key={p}
                                        type="button"
                                        size="sm"
                                        variant={formData.protocol === p ? 'default' : 'outline'}
                                        onClick={() => setFormData({ ...formData, protocol: p })}
                                        className="uppercase text-xs rounded-lg"
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-1.5 block text-slate-700">Host</label>
                                <Input value={formData.host} onChange={e => setFormData({ ...formData, host: e.target.value })} placeholder="proxy.example.com" className="font-mono" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-slate-700">Port</label>
                                <Input value={formData.port} onChange={e => setFormData({ ...formData, port: e.target.value })} placeholder="8080" className="font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-slate-700">Username</label>
                                <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Optional" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-slate-700">Password</label>
                                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Optional" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                            <div>
                                <div className="font-medium text-sm text-slate-900">Rotating Proxy</div>
                                <div className="text-xs text-slate-500">IP rotates on every request</div>
                            </div>
                            <Switch checked={formData.is_rotating} onCheckedChange={(c) => setFormData({ ...formData, is_rotating: c })} />
                        </div>
                    </div>
                    <DialogFooter className="flex flex-row justify-between sm:justify-between items-center gap-2">
                        {editingProxy ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleTest(editingProxy.id)}
                                disabled={!!testingId}
                                className="text-slate-500 hover:text-primary hover:bg-primary/5"
                            >
                                {testingId === editingProxy.id ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} /> : <HugeiconsIcon icon={Wifi01Icon} className="mr-2" size={16} />}
                                Test
                            </Button>
                        ) : <div />}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl">Cancel</Button>
                            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl shadow-lg shadow-primary/20">
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingProxy ? 'Update' : 'Create')}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
