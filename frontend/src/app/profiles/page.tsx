"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    UserGroupIcon,
    PlusSignIcon as Plus,
    PlayIcon as Play,
    StopIcon as Square,
    Delete02Icon as Trash2,
    PencilEdit02Icon as Edit3,
    ComputerIcon as Monitor,
    Globe02Icon as Globe,
    CookieIcon as Cookie,
    HardDriveIcon as HardDrive,
    Time01Icon as Clock,
    Loading03Icon as Loader2,
    Cancel01Icon as X,
    FloppyDiskIcon as Save,
    CpuIcon as Cpu,
    FlashIcon as MemoryStick,
    InformationCircleIcon as Info,
    ArrowDown01Icon as ChevronDown,
    ArrowUp01Icon as ChevronUp,
    Database01Icon as Server01Icon,
    StarIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import DeleteButton from "@/components/ui/delete-button";
import { StatusButton } from "@/components/ui/status-button";
import { PageHeader } from "@/components/ui/PageHeader";

import { CustomDropdown } from "@/components/ui/CustomDropdown";

// Dashboard API key from environment
const DASHBOARD_API_KEY = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || 'dashboard-internal';

// Helper to fetch proxies
const fetchProxies = async () => {
    const res = await fetch('/api/proxies', {
        headers: { 'x-api-key': DASHBOARD_API_KEY }
    });
    if (!res.ok) throw new Error('Failed to fetch proxies');
    return res.json();
};

// Transform backend snake_case to frontend camelCase
const transformProfile = (p: any) => ({
    ...p,
    id: p.id,
    name: p.name,
    storageType: p.storage_type,
    proxyMode: p.proxy_mode,
    proxyId: p.proxy_id,
    proxyUrl: p.proxy_url,
    proxyUsername: p.proxy_username,
    proxyPassword: p.proxy_password,
    screenWidth: p.screen_width,
    screenHeight: p.screen_height,
    isActive: p.is_active,
    isRunning: p.is_running,
    status: p.is_running ? 'running' : 'stopped', // Derive status
    cookiesCount: p.cookies_count,
    cacheSize: `${p.storage_size_mb || 0} MB`,
    lastActive: p.last_used_at
});

const fetchProfiles = async () => {
    const res = await fetch('/api/profiles', {
        headers: { 'x-api-key': DASHBOARD_API_KEY }
    });
    if (!res.ok) throw new Error('Failed to fetch profiles');
    const data = await res.json();
    return data.profiles.map(transformProfile);
};

const createProfile = async (data: any) => {
    const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': DASHBOARD_API_KEY
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Failed to create profile');
    }
    const json = await res.json();
    // Backend returns { success: true, profile: ... }
    return transformProfile(json.profile);
};

const updateProfile = async ({ id, ...data }: any) => {
    const res = await fetch(`/api/profiles/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': DASHBOARD_API_KEY
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Failed to update profile');
    }
    const json = await res.json();
    return transformProfile(json.profile);
};

const deleteProfile = async (id: string) => {
    const res = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': DASHBOARD_API_KEY }
    });
    if (!res.ok) throw new Error('Failed to delete profile');
    return res.json();
};

const toggleProfile = async ({ id, action }: { id: string; action: 'start' | 'stop' }) => {
    // Backend expects 'launch' for start
    const endpointAction = action === 'start' ? 'launch' : 'stop';
    const res = await fetch(`/api/profiles/${id}/${endpointAction}`, {
        method: 'POST',
        headers: { 'x-api-key': DASHBOARD_API_KEY }
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Failed to ${action} profile`);
    }
    const json = await res.json();
    return transformProfile(json.profile);
};

// Simplified Badge Component if not present
const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        running: "bg-emerald-100 text-emerald-700 border-emerald-200",
        stopped: "bg-slate-100 text-slate-700 border-slate-200",
        error: "bg-red-100 text-red-700 border-red-200",
        starting: "bg-blue-100 text-blue-700 border-blue-200"
    };
    const style = styles[status as keyof typeof styles] || styles.stopped;

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 uppercase tracking-wide", style)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status === 'running' ? "bg-emerald-500 animate-pulse" : "bg-current")} />
            {status}
        </span>
    );
};

export default function ProfilesPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<any>(null);
    const [profileToEdit, setProfileToEdit] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        storageType: 'local', // Default to local (persistent)
        proxyMode: 'none', // none, saved, custom
        proxyId: '',
        proxyUrl: '', // For custom: host:port
        proxyUsername: '',
        proxyPassword: '',
        screenWidth: 1920,
        screenHeight: 1080
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ['profiles'],
        queryFn: fetchProfiles,
        refetchInterval: 5000
    });

    const { data: proxiesData } = useQuery({
        queryKey: ['proxies-list'],
        queryFn: fetchProxies,
        enabled: isCreateOpen // Only fetch when modal is open
    });

    const savedProxies = proxiesData?.proxies || [];

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-8 transition-all duration-300">
                <PageHeader
                    title="Browser Profiles"
                    description="Manage persistent browser contexts and sessions."
                    action={
                        <Button disabled className="opacity-50 cursor-not-allowed h-11 px-6 bg-primary text-white font-medium shadow-lg shadow-primary/20 rounded-xl">
                            <HugeiconsIcon icon={Plus} className="mr-2" size={20} />
                            New Profile
                        </Button>
                    }
                />
                <div className="mt-8 p-12 rounded-[32px] border border-red-100 bg-red-50/50 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <HugeiconsIcon icon={Server01Icon} className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-red-900 mb-2">Backend Connection Failed</h3>
                    <p className="max-w-md text-slate-600 mb-8 leading-relaxed">
                        Unable to connect to the HeadlessX backend API. Please ensure the backend server is running and accessible.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => window.location.reload()}
                        className="bg-white border-2 border-red-100 hover:bg-red-50 text-red-700 hover:border-red-200 shadow-sm rounded-xl px-8"
                    >
                        Retry Connection
                    </Button>
                </div>
            </div>
        );
    }

    const rawProfiles = Array.isArray(data?.profiles) ? data.profiles : Array.isArray(data) ? data : [];
    const profiles = rawProfiles.filter((p: any) => p.name !== 'Default Profile');

    const createMutation = useMutation({
        mutationFn: createProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setIsCreateOpen(false);
            setProfileToEdit(null);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setIsCreateOpen(false);
            setProfileToEdit(null);
            resetForm();
        },
        onError: (err: any) => {
            alert(`Failed to update profile: ${err.message}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setProfileToDelete(null);
        }
    });

    const toggleMutation = useMutation({
        mutationFn: toggleProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            storageType: 'local',
            proxyMode: 'none',
            proxyId: '',
            proxyUrl: '',
            proxyUsername: '',
            proxyPassword: '',
            screenWidth: 1920,
            screenHeight: 1080
        });
    };

    const handleSubmit = () => {
        if (!formData.name) return;

        // Construct payload
        const payload: any = {
            name: formData.name,
            storageType: formData.storageType,
            screenWidth: formData.screenWidth,
            screenHeight: formData.screenHeight,
            proxyMode: formData.proxyMode // Backend now accepts 'saved' and 'custom'
        };

        if (formData.proxyMode === 'saved' && formData.proxyId) {
            payload.proxyId = formData.proxyId;
        } else if (formData.proxyMode === 'custom') {
            let url = formData.proxyUrl;
            if (url && !url.includes('://')) {
                url = `http://${url}`;
            }
            payload.proxyUrl = url;
            payload.proxyUsername = formData.proxyUsername;
            payload.proxyPassword = formData.proxyPassword;
        } else {
            payload.proxyMode = 'none';
            payload.proxyId = null;
            payload.proxyUrl = null;
        }

        if (profileToEdit) {
            updateMutation.mutate({ id: profileToEdit.id, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const openCreateModal = () => {
        setProfileToEdit(null);
        resetForm();
        setIsCreateOpen(true);
    };

    const openEditModal = (profile: any) => {
        setProfileToEdit(profile);

        setFormData({
            name: profile.name,
            storageType: profile.storageType || 'local',
            proxyMode: profile.proxyMode || 'none',
            proxyId: profile.proxyId || '',
            proxyUrl: profile.proxyUrl || '',
            proxyUsername: profile.proxyUsername || '',
            proxyPassword: profile.proxyPassword || '',
            screenWidth: profile.screenWidth || 1920,
            screenHeight: profile.screenHeight || 1080
        });
        setIsCreateOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 transition-all duration-300">
            {/* Header */}
            <PageHeader
                title="Browser Profiles"
                description="Manage persistent browser contexts and sessions."
                action={
                    <Button onClick={openCreateModal} className="h-11 px-6 bg-primary text-white font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <HugeiconsIcon icon={Plus} className="mr-2" size={20} />
                        New Profile
                    </Button>
                }
            />

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-[240px] border-border/50 shadow-sm bg-white/50">
                            <CardHeader>
                                <Skeleton className="h-6 w-1/2 mb-2" />
                                <Skeleton className="h-4 w-1/3" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full rounded-xl" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : profiles?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-dashed border-slate-200 text-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <HugeiconsIcon icon={UserGroupIcon} size={48} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Profiles Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                        Create your first browser profile to start scraping with persistent context, cookies, and cache.
                    </p>
                    <Button onClick={openCreateModal} size="lg" className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        Create Profile
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles?.map((profile: any) => (
                        <Card key={profile.id} className="group hover:-translate-y-1 transition-all duration-300 border-border/60 bg-white hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-4 border-b border-border/30 bg-slate-50/30">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2.5 bg-white rounded-xl text-primary ring-1 ring-border/50 shadow-sm">
                                        <HugeiconsIcon icon={Server01Icon} size={22} className="text-primary" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg"
                                            onClick={() => openEditModal(profile)}
                                        >
                                            <HugeiconsIcon icon={Edit3} size={16} />
                                        </Button>
                                        <StatusBadge status={profile.status} />
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-900">{profile.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
                                    <HugeiconsIcon icon={Clock} size={14} />
                                    {profile.lastActive ? `Active ${formatDistanceToNow(new Date(profile.lastActive))} ago` : 'Never active'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="py-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-primary/10 transition-colors">
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                                            <HugeiconsIcon icon={HardDrive} size={12} /> Storage
                                        </div>
                                        <div className="font-semibold text-sm text-slate-700 capitalize">{profile.storageType || 'Local'}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-primary/10 transition-colors">
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                                            <HugeiconsIcon icon={Globe} size={12} /> Proxy
                                        </div>
                                        <div className="font-semibold text-sm text-slate-700 capitalize">
                                            {profile.proxy_id ? 'Saved Proxy' : profile.proxy_url ? 'Custom' : 'None'}
                                        </div>
                                    </div>
                                </div>
                                {/* Technical Stats */}
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 px-1 pt-1">
                                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100/50">
                                        <HugeiconsIcon icon={Cookie} size={14} className="text-amber-500" />
                                        <span>{profile.cookiesCount || 0} cookies</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100/50">
                                        <HugeiconsIcon icon={MemoryStick} size={14} className="text-blue-500" />
                                        <span>{profile.cacheSize || '0 MB'}</span>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-4 pb-5 px-6 flex gap-3 border-t border-dashed border-border/60 bg-slate-50/20">
                                <Button
                                    variant={profile.status === 'running' ? "destructive" : "default"}
                                    size="sm"
                                    className={cn(
                                        "flex-1 font-semibold rounded-lg shadow-sm transition-all",
                                        profile.status === 'running' ? "shadow-red-500/20 hover:shadow-red-500/30" : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10"
                                    )}
                                    onClick={() => toggleMutation.mutate({
                                        id: profile.id,
                                        action: profile.status === 'running' ? 'stop' : 'start'
                                    })}
                                    disabled={toggleMutation.isPending}
                                >
                                    {toggleMutation.isPending ? (
                                        <HugeiconsIcon icon={Loader2} className="animate-spin mr-2" size={16} />
                                    ) : profile.status === 'running' ? (
                                        <>
                                            <HugeiconsIcon icon={Square} className="mr-2" size={16} /> Stop
                                        </>
                                    ) : (
                                        <>
                                            <HugeiconsIcon icon={Play} className="mr-2" size={16} /> Start Session
                                        </>
                                    )}
                                </Button>



                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 rounded-lg w-10 h-10 transition-colors"
                                    onClick={() => setProfileToDelete(profile)}
                                >
                                    <HugeiconsIcon icon={Trash2} size={18} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{profileToEdit ? 'Edit Profile' : 'New Browser Profile'}</DialogTitle>
                        <DialogDescription>
                            {profileToEdit ? 'Modify the profile settings.' : 'Create a managed browser environment with isolated cookies and storage.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Profile Name</label>
                            <Input
                                placeholder="e.g. Scraper-01"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Proxy Configuration</label>
                            <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
                                {['none', 'saved', 'custom'].map((mode) => (
                                    <button
                                        key={mode}
                                        className={cn(
                                            "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all",
                                            formData.proxyMode === mode
                                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                        )}
                                        onClick={() => setFormData({ ...formData, proxyMode: mode })}
                                    >
                                        {mode === 'none' ? 'No Proxy' : mode === 'saved' ? 'Saved Proxy' : 'Custom'}
                                    </button>
                                ))}
                            </div>

                            {formData.proxyMode === 'saved' && (
                                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                    <select
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData.proxyId}
                                        onChange={(e) => setFormData({ ...formData, proxyId: e.target.value })}
                                    >
                                        <option value="">Select a saved proxy...</option>
                                        {savedProxies.map((p: any) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.host}:{p.port})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.proxyMode === 'custom' && (
                                <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <Input
                                        placeholder="Proxy URL (e.g. http://host:port)"
                                        value={formData.proxyUrl}
                                        onChange={(e) => setFormData({ ...formData, proxyUrl: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Username (Optional)"
                                            value={formData.proxyUsername}
                                            onChange={(e) => setFormData({ ...formData, proxyUsername: e.target.value })}
                                        />
                                        <Input
                                            type="password"
                                            placeholder="Password (Optional)"
                                            value={formData.proxyPassword}
                                            onChange={(e) => setFormData({ ...formData, proxyPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Screen Resolution</label>
                            <CustomDropdown
                                value={`${formData.screenWidth}x${formData.screenHeight}`}
                                onChange={(val) => {
                                    const [w, h] = val.split('x').map(Number);
                                    setFormData({ ...formData, screenWidth: w, screenHeight: h });
                                }}
                                options={[
                                    { value: '1920x1080', label: '1920 x 1080', suffix: 'FHD' },
                                    { value: '1366x768', label: '1366 x 768', suffix: 'HD' },
                                    { value: '1440x900', label: '1440 x 900', suffix: 'laptop' },
                                    { value: '2560x1440', label: '2560 x 1440', suffix: '2K' },
                                    { value: '3840x2160', label: '3840 x 2160', suffix: '4K' },
                                ]}
                                icon={Monitor}
                            />
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <StatusButton
                            status={
                                (profileToEdit ? updateMutation.status : createMutation.status) === 'pending' ? 'loading'
                                    : (profileToEdit ? updateMutation.status : createMutation.status) === 'success' ? 'success'
                                        : 'idle'
                            }
                            onClick={handleSubmit}
                            textMap={{
                                idle: profileToEdit ? "Update Profile" : "Create Profile",
                                loading: "Saving...",
                                success: "Saved!"
                            }}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <HugeiconsIcon icon={Trash2} /> Delete Profile
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{profileToDelete?.name}</strong>?
                            This action cannot be undone and will remove all local data, cookies, and cache for this profile.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                        <DeleteButton
                            deleteText="Yes, Delete Profile"
                            cancelText="Cancel"
                            onDelete={() => {
                                if (profileToDelete) deleteMutation.mutate(profileToDelete.id);
                            }}
                            onCancel={() => setProfileToDelete(null)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
