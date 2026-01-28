"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import DeleteButton from "@/components/ui/delete-button";

interface DeleteKeyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteKeyDialog({
    open,
    onOpenChange,
    onConfirm,
    onCancel
}: DeleteKeyDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete API Key</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to permanently delete this key? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center py-6">
                    <DeleteButton
                        deleteText="Confirm Delete"
                        cancelText="Cancel"
                        onDelete={onConfirm}
                        onCancel={onCancel}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
