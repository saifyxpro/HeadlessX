"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { StatusButton } from "@/components/ui/status-button";
import { SwipeButton } from "@/components/ui/swipe-button";
import { useState } from "react";

interface CreateKeyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string) => void;
    createdKey: string | null;
    newKeyName: string;
    setNewKeyName: (name: string) => void;
    status: 'idle' | 'loading' | 'success';
    onClose: () => void;
}

export function CreateKeyDialog({
    open,
    onOpenChange,
    onCreate,
    createdKey,
    newKeyName,
    setNewKeyName,
    status,
    onClose
}: CreateKeyDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (createdKey) {
            navigator.clipboard.writeText(createdKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate New API Key</DialogTitle>
                    <DialogDescription>Create a new key to authenticate API requests</DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    {!createdKey ? (
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">Key Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Production Scraper"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newKeyName.trim()) {
                                        onCreate(newKeyName);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
                                <div className="bg-white rounded-[10px] p-4 flex items-center justify-between gap-3">
                                    <code className="text-blue-600 font-mono text-sm font-bold break-all">{createdKey}</code>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-lg hover:bg-slate-50 transition-colors shrink-0 group relative"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-800">Save this key now!</p>
                                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">This key will only be shown once. If you lose it, you'll need to generate a new one.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {!createdKey ? (
                        <div className="flex gap-3 w-full justify-end">
                            <Button
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <StatusButton
                                status={status}
                                onClick={() => onCreate(newKeyName)}
                                disabled={!newKeyName.trim()}
                                textMap={{ idle: "Create Key", loading: "Creating...", success: "Created!" }}
                                className="min-w-[120px]"
                            />
                        </div>
                    ) : (
                        <SwipeButton
                            text="Swipe to Finish"
                            onSwipeComplete={() => {
                                setTimeout(() => {
                                    onClose();
                                }, 1000);
                            }}
                            className="w-full border-slate-200 shadow-sm"
                        />
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
