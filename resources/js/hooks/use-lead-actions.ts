import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

export type LeadActionRow = {
    id: number;
    uuid: string;
    status: string;
    first_name: string;
    last_name: string | null;
};

export function useLeadActions(onStatusUpdated?: () => void) {
    const [filesLead, setFilesLead] = useState<LeadActionRow | null>(null);
    const [convertLead, setConvertLead] = useState<LeadActionRow | null>(null);

    const moveLead = (leadId: number, status: string) => {
        router.patch(
            route('leads.update-status', leadId),
            { status },
            {
                preserveScroll: true,
                onSuccess: () => onStatusUpdated?.(),
            },
        );
    };

    const convertToClient = () => {
        if (!convertLead) return;

        router.post(route('leads.convert-to-client', convertLead.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Lead convertido a cliente correctamente.');
                setConvertLead(null);
            },
            onError: () => toast.error('No se pudo convertir el lead.'),
        });
    };

    return {
        filesLead,
        setFilesLead,
        convertLead,
        setConvertLead,
        moveLead,
        convertToClient,
    };
}
