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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

const testProxyConfig = async (data: { proxyUrl: string; proxyProtocol: string }) => {
    const res = await fetch('/api/config/proxy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!res.ok && !json.result) {
        throw new Error(json.error || 'Failed to test proxy');
    }

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
        description: 'Saved proxy for new Camoufox sessions',
        icon: Server01Icon,
    },
] as const;

type SettingsTabId = typeof TABS[number]['id'];

type ProxyDraft = {
    proxyEnabled: boolean;
    proxyProtocol: string;
    proxyUrl: string;
};

type ProxyTestResult = {
    success: boolean;
    latency?: number;
    ip?: string;
    country?: string;
    city?: string;
    isp?: string;
    error?: string;
};

type ProxyFeedbackDialogState = {
    open: boolean;
    title: string;
    description: string;
    success: boolean;
};

type SaveProxyOutcome =
    | { kind: 'validated'; result: ProxyTestResult | null }
    | { kind: 'saved-direct' };

const PROXY_PROTOCOLS = ['http', 'https', 'socks4', 'socks5'] as const;

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
    const iconTreatment =
        label === 'Browser Mode'
            ? 'bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_58%),linear-gradient(135deg,rgba(255,255,255,1),rgba(239,246,255,1))] border-sky-100 text-sky-700'
            : label === 'Concurrency'
                ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_58%),linear-gradient(135deg,rgba(255,255,255,1),rgba(245,243,255,1))] border-violet-100 text-violet-700'
                : 'bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.14),_transparent_58%),linear-gradient(135deg,rgba(255,255,255,1),rgba(236,253,245,1))] border-emerald-100 text-emerald-700';

    return (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                    <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">{detail}</div>
                </div>
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border", iconTreatment)}>
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
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <Card className="rounded-[1.75rem] p-6">
            <div className="space-y-5">
                <div className="space-y-2">
                    <div className="text-lg font-semibold tracking-tight text-slate-900">{title}</div>
                    <div className="text-sm leading-6 text-slate-500">{description}</div>
                </div>
                <div className="h-px w-full bg-slate-200" />
                <div className="space-y-5">
                {children}
                </div>
            </div>
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
    const [proxyDraft, setProxyDraft] = useState<ProxyDraft>({
        proxyEnabled: false,
        proxyProtocol: 'http',
        proxyUrl: '',
    });
    const [proxyTestResult, setProxyTestResult] = useState<ProxyTestResult | null>(null);
    const [proxyFeedbackDialog, setProxyFeedbackDialog] = useState<ProxyFeedbackDialogState>({
        open: false,
        title: '',
        description: '',
        success: false,
    });

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
    const proxyTestMutation = useMutation({
        mutationFn: testProxyConfig,
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
            const nextFormData = {
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
            };

            setFormData(nextFormData);
            setProxyDraft((prev) => ({
                proxyEnabled: Boolean(nextFormData.proxyEnabled),
                proxyProtocol: nextFormData.proxyProtocol || 'http',
                proxyUrl: nextFormData.proxyUrl || '',
            }));
        }
    }, [data]);

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const validateSettingsData = (settings: any) => {
        if (settings.proxyEnabled && !String(settings.proxyUrl || '').trim()) {
            throw new Error('Enter a proxy endpoint or turn proxy routing off.');
        }
    };

    const buildConfigWithProxyDraft = () => ({
        ...formData,
        proxyEnabled: proxyDraft.proxyEnabled,
        proxyProtocol: proxyDraft.proxyProtocol,
        proxyUrl: proxyDraft.proxyUrl,
    });

    const showProxyPopup = (result: ProxyTestResult, mode: 'test' | 'save') => {
        const title = result.success
            ? mode === 'save'
                ? 'Proxy saved and test passed'
                : 'Proxy test passed'
            : mode === 'save'
                ? 'Proxy saved but test failed'
                : 'Proxy test failed';

        const details = result.success
            ? [
                result.ip ? `Exit IP: ${result.ip}` : null,
                result.country ? `Country: ${result.country}` : null,
                typeof result.latency === 'number' ? `Latency: ${result.latency} ms` : null,
            ].filter(Boolean).join('\n')
            : result.error || 'The proxy endpoint could not be reached with the current settings.';

        setProxyFeedbackDialog({
            open: true,
            title,
            description: details,
            success: result.success,
        });
    };

    const runProxyTest = async (draft = proxyDraft, options?: { notify?: boolean; mode?: 'test' | 'save' }) => {
        if (!String(draft.proxyUrl || '').trim()) {
            const result = {
                success: false,
                error: 'Enter a proxy endpoint before testing.',
            };
            setProxyTestResult(result);
            if (options?.notify) {
                showProxyPopup(result, options.mode ?? 'test');
            }
            return null;
        }

        try {
            const response = await proxyTestMutation.mutateAsync({
                proxyUrl: String(draft.proxyUrl || '').trim(),
                proxyProtocol: draft.proxyProtocol || 'http',
            });

            const result = response.result ?? null;
            setProxyTestResult(result);
            if (result && options?.notify) {
                showProxyPopup(result, options.mode ?? 'test');
            }
            return result;
        } catch (err) {
            const result = {
                success: false,
                error: (err as Error).message || 'Failed to test proxy',
            };
            setProxyTestResult(result);
            if (options?.notify) {
                showProxyPopup(result, options.mode ?? 'test');
            }
            return null;
        }
    };

    const handleSave = async () => {
        try {
            validateSettingsData(formData);
            await mutation.mutateAsync(formData);
        } catch (err) {
            setError((err as Error).message);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleSaveProxy = async (): Promise<SaveProxyOutcome | null> => {
        const nextFormData = buildConfigWithProxyDraft();

        try {
            validateSettingsData(nextFormData);
            await mutation.mutateAsync(nextFormData);
            setFormData(nextFormData);

            if (proxyDraft.proxyEnabled && String(proxyDraft.proxyUrl || '').trim()) {
                const result = await runProxyTest(proxyDraft, { notify: true, mode: 'save' });
                return { kind: 'validated', result };
            } else {
                setProxyTestResult(null);
                setProxyFeedbackDialog({
                    open: true,
                    title: 'Proxy settings saved',
                    description: 'Direct connection is saved for new Camoufox sessions.',
                    success: true,
                });
                return { kind: 'saved-direct' };
            }
        } catch (err) {
            setError((err as Error).message);
            setTimeout(() => setError(null), 5000);
            return null;
        }
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
            label: 'Browser Proxy',
            value: formData.proxyEnabled ? 'Enabled' : 'Disabled',
            detail: formData.proxyEnabled
                ? 'Saved into the Camoufox launch config for every new browser session.'
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
                description="Tune runtime defaults, browser behavior, and the saved proxy used for new Camoufox sessions."
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
                            <div className="text-sm leading-6 text-slate-500">
                                Choose a settings area.
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
                            title="Execution Defaults"
                            description="Control browser mode, timeout, and concurrency."
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
                        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold tracking-tight text-slate-900">Proxy Settings</div>
                                    <div className="text-sm leading-6 text-slate-500">
                                        Save one proxy endpoint for future Camoufox browser sessions.
                                    </div>
                                </div>

                                <div className="h-px w-full bg-slate-200" />

                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                                    <div className="space-y-1 pr-4">
                                        <div className="font-semibold text-slate-900">Enable Proxy Routing</div>
                                        <div className="text-sm leading-6 text-slate-500">
                                            Save one proxy endpoint for new Camoufox sessions, or keep traffic direct when disabled.
                                        </div>
                                    </div>
                                    <Switch
                                        checked={proxyDraft.proxyEnabled}
                                        onCheckedChange={(checked) => setProxyDraft((prev) => ({ ...prev, proxyEnabled: checked }))}
                                    />
                                </div>

                                <FieldCard
                                    label="Protocol"
                                    hint="Choose the protocol used with the saved endpoint."
                                >
                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                        {PROXY_PROTOCOLS.map((protocol) => (
                                            <Button
                                                key={protocol}
                                                type="button"
                                                variant={proxyDraft.proxyProtocol === protocol ? "default" : "outline"}
                                                onClick={() => setProxyDraft((prev) => ({ ...prev, proxyProtocol: protocol }))}
                                                className="h-11 rounded-2xl uppercase text-xs"
                                            >
                                                {protocol}
                                            </Button>
                                        ))}
                                    </div>
                                </FieldCard>

                                <FieldCard
                                    label="Proxy Endpoint"
                                    hint="Paste `host:port` or `username:password@host:port`."
                                >
                                    <Input
                                        value={proxyDraft.proxyUrl}
                                        onChange={(event) => setProxyDraft((prev) => ({ ...prev, proxyUrl: event.target.value }))}
                                        placeholder="host:port or username:password@host:port"
                                        className="h-12 bg-white font-mono text-sm"
                                    />
                                </FieldCard>

                                {proxyTestResult ? (
                                    <div
                                        className={cn(
                                            "flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm",
                                            proxyTestResult.success
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-red-200 bg-red-50 text-red-600"
                                        )}
                                    >
                                        <HugeiconsIcon
                                            icon={proxyTestResult.success ? CheckmarkCircle02Icon : Cancel01Icon}
                                            size={16}
                                        />
                                        <div className="min-w-0">
                                            <div className="font-semibold">
                                                {proxyTestResult.success
                                                    ? `Proxy test passed${typeof proxyTestResult.latency === 'number' ? ` in ${proxyTestResult.latency} ms` : ''}.`
                                                    : 'Proxy test failed.'}
                                            </div>
                                            <div className="mt-1 leading-6">
                                                {proxyTestResult.success
                                                    ? `Exit IP ${proxyTestResult.ip || 'Unknown'}${proxyTestResult.country ? ` · ${proxyTestResult.country}` : ''}${proxyTestResult.isp ? ` · ${proxyTestResult.isp}` : ''}`
                                                    : proxyTestResult.error || 'The proxy endpoint could not be reached with the current settings.'}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            void runProxyTest(proxyDraft, { notify: true, mode: 'test' });
                                        }}
                                        disabled={proxyTestMutation.isPending || mutation.isPending}
                                        className="h-11 rounded-2xl px-5"
                                    >
                                        {proxyTestMutation.isPending ? (
                                            <HugeiconsIcon icon={Loading03Icon} className="mr-2 animate-spin" />
                                        ) : (
                                            <HugeiconsIcon icon={Shield01Icon} className="mr-2" />
                                        )}
                                        Test Proxy
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            void handleSaveProxy();
                                        }}
                                        disabled={mutation.isPending || proxyTestMutation.isPending}
                                        className="h-11 rounded-2xl px-5"
                                    >
                                        {mutation.isPending ? (
                                            <HugeiconsIcon icon={Loading03Icon} className="mr-2 animate-spin" />
                                        ) : (
                                            <HugeiconsIcon icon={FloppyDiskIcon} className="mr-2" />
                                        )}
                                        Save Proxy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'camoufox' && (
                        <SettingsSection
                            title="Camoufox Engine Controls"
                            description="Adjust the default anti-detect browser behavior."
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

            <Dialog
                open={proxyFeedbackDialog.open}
                onOpenChange={(open) => setProxyFeedbackDialog((current) => ({ ...current, open }))}
            >
                <DialogContent className="max-w-md border-slate-200 p-0">
                    <div className="p-6">
                        <DialogHeader className="mb-0 space-y-3 pr-10 text-left">
                            <div
                                className={cn(
                                    "flex h-11 w-11 items-center justify-center rounded-2xl border",
                                    proxyFeedbackDialog.success
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                        : "border-red-200 bg-red-50 text-red-500"
                                )}
                            >
                                <HugeiconsIcon
                                    icon={proxyFeedbackDialog.success ? CheckmarkCircle02Icon : Cancel01Icon}
                                    size={18}
                                />
                            </div>
                            <DialogTitle className="text-xl">{proxyFeedbackDialog.title}</DialogTitle>
                            <DialogDescription className="whitespace-pre-line text-sm leading-6 text-slate-500">
                                {proxyFeedbackDialog.description}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="mt-6 border-t border-slate-100 pt-4">
                            <Button
                                type="button"
                                onClick={() => setProxyFeedbackDialog((current) => ({ ...current, open: false }))}
                                className="h-11 rounded-2xl px-5"
                            >
                                OK
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
