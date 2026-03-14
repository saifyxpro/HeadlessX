"use client";

import { useState, useEffect, type ReactNode } from 'react';
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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

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

const TABS = [
    {
        id: 'general',
        label: 'General',
        description: 'Runtime defaults and capacity',
        icon: ComputerIcon,
    },
    {
        id: 'camoufox',
        label: 'Browser Engine',
        description: 'Anti-detect browser controls',
        icon: CpuIcon,
    },
    {
        id: 'proxy',
        label: 'Proxy',
        description: 'Single global proxy routing',
        icon: Server01Icon,
    },
] as const;

type SettingsTabId = typeof TABS[number]['id'];

function SettingsSummaryCard({
    icon,
    label,
    value,
    detail,
}: {
    icon: typeof ComputerIcon;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                    <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">{detail}</div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                    <HugeiconsIcon icon={icon} size={20} />
                </div>
            </div>
        </div>
    );
}

function SettingsTabButton({
    active,
    icon,
    label,
    description,
    onClick,
}: {
    active: boolean;
    icon: typeof ComputerIcon;
    label: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-active={active}
            className={cn(
                "ui-tab w-full rounded-2xl border border-transparent px-4 py-4 text-left",
                active ? "text-primary" : "text-slate-500"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                    active
                        ? "border-primary/15 bg-primary/8 text-primary"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                )}>
                    <HugeiconsIcon icon={icon} size={18} />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
                </div>
            </div>
        </button>
    );
}

function SettingsSection({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <Card className="rounded-[1.75rem]">
            <CardHeader className="border-b border-slate-200 pb-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
                <CardTitle className="mt-2 text-xl text-slate-900">{title}</CardTitle>
                <CardDescription className="mt-1 max-w-2xl leading-6">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
                {children}
            </CardContent>
        </Card>
    );
}

function ToggleSetting({
    title,
    description,
    badge,
    checked,
    onCheckedChange,
}: {
    title: string;
    description: string;
    badge?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="ui-panel-soft flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                    {title}
                    {badge ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            {badge}
                        </span>
                    ) : null}
                </div>
                <div className="text-sm leading-6 text-slate-500">{description}</div>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}

function FieldCard({
    label,
    hint,
    children,
}: {
    label: string;
    hint: string;
    children: ReactNode;
}) {
    return (
        <div className="ui-panel-soft rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">{label}</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div>
            <div className="mt-4">
                {children}
            </div>
        </div>
    );
}

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

    const [formData, setFormData] = useState<any>({
        browserHeadless: true,
        browserTimeout: 60000,
        maxConcurrency: 5,
        camoufoxBlockWebrtc: true,
        camoufoxGeoip: true,
        camoufoxEnableCache: true,
        proxyEnabled: false,
        proxyProtocol: 'http',
        proxyUrl: ''
    });
    const [activeTab, setActiveTab] = useState<SettingsTabId>('general');

    useEffect(() => {
        if (data?.config) {
            setFormData({
                browserHeadless: true,
                browserTimeout: 60000,
                maxConcurrency: 5,
                camoufoxBlockWebrtc: true,
                camoufoxGeoip: true,
                camoufoxEnableCache: true,
                proxyEnabled: false,
                proxyProtocol: 'http',
                proxyUrl: '',
                ...data.config
            });
        }
    }, [data]);

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        if (formData.proxyEnabled && !String(formData.proxyUrl || '').trim()) {
            setError('Enter a proxy URL or disable Global Proxy.');
            return;
        }
        mutation.mutate(formData);
    };

    const summaryCards = [
        {
            label: 'Browser Mode',
            value: formData.browserHeadless ? 'Headless' : 'Visible',
            detail: formData.browserHeadless ? 'Optimized for faster job execution.' : 'Useful for live debugging and inspection.',
            icon: ComputerIcon,
        },
        {
            label: 'Concurrency',
            value: `${formData.maxConcurrency || 0} Jobs`,
            detail: 'Maximum simultaneous browser jobs allowed from the worker pool.',
            icon: CpuIcon,
        },
        {
            label: 'Global Proxy',
            value: formData.proxyEnabled ? 'Enabled' : 'Disabled',
            detail: formData.proxyEnabled
                ? 'Every new browser session will route through one shared proxy.'
                : 'Traffic runs direct until a proxy endpoint is configured.',
            icon: Server01Icon,
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full rounded-[1.75rem]" />
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-32 rounded-[1.75rem]" />
                    ))}
                </div>
                <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                    <Skeleton className="h-72 rounded-[1.75rem]" />
                    <Skeleton className="h-[30rem] rounded-[1.75rem]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Tune runtime defaults, browser behavior, and global proxy routing for all new jobs."
                icon={<HugeiconsIcon icon={Shield01Icon} size={22} />}
                action={
                    <Button
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className={cn("h-11 px-5", saved ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                    >
                        {mutation.isPending ? (
                            <HugeiconsIcon icon={Loading03Icon} className="mr-2 animate-spin" />
                        ) : saved ? (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-2" />
                        ) : (
                            <HugeiconsIcon icon={FloppyDiskIcon} className="mr-2" />
                        )}
                        {saved ? 'Saved!' : 'Save Changes'}
                    </Button>
                }
            />

            <div className="grid gap-4 md:grid-cols-3">
                {summaryCards.map((item) => (
                    <SettingsSummaryCard
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        value={item.value}
                        detail={item.detail}
                    />
                ))}
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3">
                        <div className="px-3 pb-3 pt-2">
                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Control Groups</div>
                            <div className="mt-2 text-sm leading-6 text-slate-500">
                                Organize runtime defaults, browser engine behavior, and global network routing.
                            </div>
                        </div>

                        <div className="space-y-2">
                            {TABS.map((tab) => (
                                <SettingsTabButton
                                    key={tab.id}
                                    active={activeTab === tab.id}
                                    icon={tab.icon}
                                    label={tab.label}
                                    description={tab.description}
                                    onClick={() => setActiveTab(tab.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                            <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            {error}
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <SettingsSection
                            eyebrow="Runtime"
                            title="Execution Defaults"
                            description="Control how HeadlessX launches browsers and how much concurrent work it allows."
                        >
                            <ToggleSetting
                                title="Headless Mode"
                                description="Run browsers without a visible window for faster execution and lower resource use."
                                badge="Fast"
                                checked={formData.browserHeadless ?? true}
                                onCheckedChange={(checked) => handleChange('browserHeadless', checked)}
                            />

                            <div className="grid gap-4 lg:grid-cols-2">
                                <FieldCard
                                    label="Browser Timeout"
                                    hint="Maximum execution time for a single scrape or workflow before it is treated as failed."
                                >
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={formData.browserTimeout || 60000}
                                            onChange={(e) => handleChange('browserTimeout', parseInt(e.target.value || '0', 10))}
                                            className="max-w-[160px] bg-white"
                                        />
                                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                                            ms
                                        </span>
                                    </div>
                                </FieldCard>

                                <FieldCard
                                    label="Max Concurrent Jobs"
                                    hint="Recommended range is 3 to 8 depending on CPU, memory, and proxy quality."
                                >
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={formData.maxConcurrency || 5}
                                            onChange={(e) => handleChange('maxConcurrency', parseInt(e.target.value || '0', 10))}
                                            className="max-w-[160px] bg-white"
                                        />
                                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                                            jobs
                                        </span>
                                    </div>
                                </FieldCard>
                            </div>
                        </SettingsSection>
                    )}

                    {activeTab === 'proxy' && (
                        <SettingsSection
                            eyebrow="Network"
                            title="Global Proxy Routing"
                            description="Use one proxy endpoint for every new browser session launched by HeadlessX."
                        >
                            <ToggleSetting
                                title="Global Proxy"
                                description="When enabled, every new session routes through the endpoint configured below."
                                badge="One Proxy"
                                checked={formData.proxyEnabled ?? false}
                                onCheckedChange={(checked) => handleChange('proxyEnabled', checked)}
                            />

                            <FieldCard
                                label="Protocol"
                                hint="Choose the transport used to normalize the configured endpoint."
                            >
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                    {['http', 'https', 'socks4', 'socks5'].map((protocol) => (
                                        <Button
                                            key={protocol}
                                            type="button"
                                            variant={(formData.proxyProtocol || 'http') === protocol ? 'default' : 'outline'}
                                            onClick={() => handleChange('proxyProtocol', protocol)}
                                            className="h-11 rounded-2xl uppercase text-xs"
                                        >
                                            {protocol}
                                        </Button>
                                    ))}
                                </div>
                            </FieldCard>

                            <FieldCard
                                label="Proxy Endpoint"
                                hint="Use `host:port` or `username:password@host:port`. The selected protocol is prepended automatically when needed."
                            >
                                <Input
                                    value={formData.proxyUrl || ''}
                                    onChange={(e) => handleChange('proxyUrl', e.target.value)}
                                    placeholder="host:port or username:password@host:port"
                                    className="bg-white font-mono"
                                />
                            </FieldCard>
                        </SettingsSection>
                    )}

                    {activeTab === 'camoufox' && (
                        <SettingsSection
                            eyebrow="Stealth"
                            title="Camoufox Engine Controls"
                            description="Fine-tune the anti-detect browser defaults used when HeadlessX launches new Camoufox sessions."
                        >
                            <ToggleSetting
                                title="Block WebRTC"
                                description="Reduce IP leakage risk by disabling WebRTC in the browser runtime."
                                checked={formData.camoufoxBlockWebrtc ?? true}
                                onCheckedChange={(checked) => handleChange('camoufoxBlockWebrtc', checked)}
                            />

                            <ToggleSetting
                                title="Camoufox GeoIP"
                                description="Align browser location signals with the current IP to reduce obvious fingerprint mismatches."
                                checked={formData.camoufoxGeoip ?? true}
                                onCheckedChange={(checked) => handleChange('camoufoxGeoip', checked)}
                            />

                            <ToggleSetting
                                title="Enable Cache"
                                description="Reuse resources between requests to improve speed when the target behavior allows it."
                                checked={formData.camoufoxEnableCache ?? true}
                                onCheckedChange={(checked) => handleChange('camoufoxEnableCache', checked)}
                            />

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                                <div className="text-sm font-semibold text-slate-900">Engine Note</div>
                                <div className="mt-2 text-sm leading-6 text-slate-500">
                                    These defaults affect new Camoufox sessions. Keep them aligned with your proxy and target-site tolerance instead of enabling every option blindly.
                                </div>
                            </div>
                        </SettingsSection>
                    )}
                </div>
            </div>
        </div>
    );
}
