import type { ReactNode } from 'react';
import { DialogActionButton } from '@/components/dialog-action-button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type CrudFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    submitLabel: string;
    processing?: boolean;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    children: ReactNode;
    hideFooter?: boolean;
};

export function CrudFormDialog({
    open,
    onOpenChange,
    title,
    description,
    submitLabel,
    processing = false,
    onSubmit,
    children,
    hideFooter = false,
}: CrudFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onSubmit}>
                    {children}
                    {!hideFooter && (
                        <DialogFooter>
                            <DialogActionButton type="submit" processing={processing}>
                                {submitLabel}
                            </DialogActionButton>
                        </DialogFooter>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
