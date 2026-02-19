import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';

export type LeadActionLead = {
    id: string;
    status: string;
};

type Params<TLead extends LeadActionLead> = {
    statusOptions: Array<{ value: string; label: string }>;
    onView: (lead: TLead) => void;
    onEdit: (lead: TLead) => void;
    onDelete: (lead: TLead) => void;
    onFiles: (lead: TLead) => void;
    onConvert: (lead: TLead) => void;
    onArchive?: (lead: TLead) => void;
    onUnarchive?: (lead: TLead) => void;
    onStatusUpdated?: () => void;
};

export function useLeadActions<TLead extends LeadActionLead>({
    statusOptions,
    onView,
    onEdit,
    onDelete,
    onFiles,
    onConvert,
    onArchive,
    onUnarchive,
    onStatusUpdated,
}: Params<TLead>) {
    return (lead: TLead) => ({
        canConvert: lead.status !== 'ganado',
        canArchive: Boolean(onArchive),
        canUnarchive: Boolean(onUnarchive),
        statusOptions,
        onView: () => onView(lead),
        onEdit: () => onEdit(lead),
        onDelete: () => onDelete(lead),
        onFiles: () => onFiles(lead),
        onConvert: () => onConvert(lead),
        onArchive: () => onArchive?.(lead),
        onUnarchive: () => onUnarchive?.(lead),
        moveToStatus: (status: string) => {
            router.patch(
                route('leads.update-status', lead.id),
                { status },
                {
                    preserveScroll: true,
                    onSuccess: () => onStatusUpdated?.(),
                },
            );
        },
    });
}
