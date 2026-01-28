"use client";

import { Button } from "@/components/ui/button";
import { StatusButton } from "@/components/ui/status-button";
import StackedList, { StackedListItem } from "@/components/ui/stacked-list";
import { formatDistanceToNow } from 'date-fns';
import { Key01Icon, Shield01Icon, Delete02Icon as Trash2Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    is_active: boolean;
    is_system?: boolean;
    created_at: string;
    last_used_at: string;
}

interface ApiKeysListProps {
    keys: ApiKey[];
    revokeMutation: any; // Using any for React Query mutation object simplicity, or trigger fn
    onDeleteClick: (key: ApiKey) => void;
}

export function ApiKeysList({ keys, revokeMutation, onDeleteClick }: ApiKeysListProps) {
    // Default system key logic kept here or passed down? 
    // It seems the original page constructed the list including the system key.
    // Let's assume 'keys' passed in includes everything or we reconstruct it here.
    // The previous implementation added a system key manually. We should probably keep that logic 
    // where the data is fetched (page) or here. Let's do it here to keep the list presentation encapsulated.

    const SYSTEM_KEY: ApiKey = {
        id: 'system-frontend-key',
        name: 'Dashboard (System)',
        prefix: 'hx_dashboard',
        is_active: true,
        is_system: true,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString()
    };

    const allKeys = [SYSTEM_KEY, ...keys];

    const stackedItems: StackedListItem[] = allKeys.map((key) => ({
        id: key.id,
        title: key.name,
        subtitle: key.is_system ? "System Key" : `Prefix: ${key.prefix}... • ${key.last_used_at ? 'Used ' + formatDistanceToNow(new Date(key.last_used_at)) + ' ago' : 'Never used'}`,
        status: key.is_active ? 'Active' : 'Revoked',
        active: key.is_active,
        icon: key.is_system ? Shield01Icon : Key01Icon,
    }));

    return (
        <StackedList
            items={stackedItems}
            title="Your API Keys"
            renderItemActions={(item) => {
                const originalKey = allKeys.find((k) => k.id === item.id);
                if (originalKey?.is_system) return null;

                // When we map status button status, we need to check if *this specific key* is being revoked.
                // The mutation status in React Query v4/v5 is global for the mutation hook instance unless variables are tracked.
                // In the original code: status={revokeMutation.status === 'pending' ? ...} 
                // This means if ANY key is revoking, ALL buttons show loading? 
                // Ah, 'revokeMutation' was a single hook. Yes, technically deeply flawed if multiple rapid clicks, 
                // but usually acceptable for this scale. 
                // To be precise, we should check `revokeMutation.variables === item.id` if available, 
                // but standard useMutation doesn't expose variables easily in render without a wrapper or changing the logic.
                // For now, preserving original behavior.

                return (
                    <div className="flex items-center gap-2">
                        {item.active ? (
                            <StatusButton
                                textMap={{ idle: "Revoke", loading: "Revoking", success: "Revoked" }}
                                className="h-9 px-4 text-xs font-semibold bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 shadow-sm rounded-lg transition-all"
                                onClick={() => revokeMutation.mutate(item.id)}
                                status={revokeMutation.status === 'pending' && revokeMutation.variables === item.id ? 'loading' : revokeMutation.status === 'success' && revokeMutation.variables === item.id ? 'success' : 'idle'}
                                showBadge={false}
                            />
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg h-9 w-9 p-0 transition-all"
                                onClick={() => {
                                    if (originalKey) onDeleteClick(originalKey);
                                }}
                            >
                                <HugeiconsIcon icon={Trash2Icon} size={18} />
                            </Button>
                        )}
                    </div>
                );
            }}
        />
    );
}
