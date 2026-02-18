import { DialogActionButton } from '@/components/dialog-action-button';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type ConfirmDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    itemName?: string;
    entityLabel: string;
    processing?: boolean;
    onConfirm: () => void;
};

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    title = 'Eliminar registro',
    itemName,
    entityLabel,
    processing = false,
    onConfirm,
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Esta acción eliminará {entityLabel}
                        {itemName ? (
                            <span className="font-medium"> {itemName}</span>
                        ) : null}{' '}
                        y no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <DialogActionButton
                        variant="destructive"
                        processing={processing}
                        onClick={onConfirm}
                    >
                        Eliminar
                    </DialogActionButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
