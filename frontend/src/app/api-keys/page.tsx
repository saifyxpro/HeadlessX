'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiKeysSkeleton } from "@/components/api-keys/ApiKeysSkeleton";
import { ApiKeysList, ApiKey } from "@/components/api-keys/ApiKeysList";
import { CreateKeyDialog } from "@/components/api-keys/CreateKeyDialog";
import { DeleteKeyDialog } from "@/components/api-keys/DeleteKeyDialog";

const fetchKeys = async () => {
    const res = await fetch('/api/keys');
    return res.json();
};

const createKey = async (name: string) => {
    const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    return res.json();
};

const revokeKey = async (id: string) => {
    await fetch(`/api/keys/${id}/revoke`, { method: 'PATCH' });
};

const deleteKey = async (id: string) => {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
};

export default function ApiKeysPage() {
    const queryClient = useQueryClient();

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Confirm Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [targetKeyForDelete, setTargetKeyForDelete] = useState<ApiKey | null>(null);

    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const { data, isLoading } = useQuery({ queryKey: ['api-keys'], queryFn: fetchKeys });

    const createMutation = useMutation({
        mutationFn: createKey,
        onMutate: () => setCreateStatus('loading'),
        onSuccess: (data) => {
            setCreateStatus('success');
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['api-keys'] });
                setCreatedKey(data.key);
                setNewKeyName(''); // Reset name but keep createdKey to show it
                setCreateStatus('idle');
            }, 1500);
        },
        onError: () => setCreateStatus('idle')
    });

    const revokeMutation = useMutation({
        mutationFn: revokeKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setIsConfirmOpen(false);
            setTargetKeyForDelete(null);
        }
    });

    const handleCloseCreateModal = () => {
        setCreatedKey(null);
        setNewKeyName('');
        setIsCreateOpen(false);
    };

    if (isLoading) {
        return <ApiKeysSkeleton />;
    }

    return (
        <div className="min-h-screen space-y-8">
            <PageHeader
                title="API Keys"
                description="Manage access tokens and authentication for your applications."
                action={
                    <Button onClick={() => setIsCreateOpen(true)} className="h-11 px-6 bg-primary text-white font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Plus className="mr-2 h-5 w-5" />
                        New Key
                    </Button>
                }
            />

            <div className="max-w-5xl mx-auto px-6">
                <ApiKeysList
                    keys={data?.keys || []}
                    revokeMutation={revokeMutation}
                    onDeleteClick={(key) => {
                        setTargetKeyForDelete(key);
                        setIsConfirmOpen(true);
                    }}
                />
            </div>

            <CreateKeyDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={(name) => createMutation.mutate(name)}
                createdKey={createdKey}
                newKeyName={newKeyName}
                setNewKeyName={setNewKeyName}
                status={createStatus}
                onClose={handleCloseCreateModal}
            />

            <DeleteKeyDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={() => {
                    if (targetKeyForDelete) deleteMutation.mutate(targetKeyForDelete.id);
                }}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
}
