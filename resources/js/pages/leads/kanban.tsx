import { Head, router, usePage } from '@inertiajs/react';
import { Columns3, GripVertical, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { LeadStatusBadge, statusLabel } from '@/components/leads/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type LeadItem = {
    id: number;
    agent_id: string;
    first_name: string;
    last_name: string | null;
    phone: string;
    email: string | null;
    source: string;
    status: string;
    created_at: string;
};

export default function LeadsKanban({
    leads,
    boardStatuses,
}: {
    leads: LeadItem[];
    boardStatuses: string[];
}) {
    const [boardLeads, setBoardLeads] = useState<LeadItem[]>(leads);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const grouped = useMemo(
        () =>
            boardStatuses.map((status) => ({
                status,
                leads: boardLeads.filter((lead) => lead.status === status),
            })),
        [boardLeads, boardStatuses],
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: route('leads.index') },
        { title: 'Kanban', href: route('leads.kanban') },
    ];

    const onDropLead = (status: string) => {
        if (!draggedId) return;

        const previous = boardLeads;
        const draggedLead = boardLeads.find((lead) => lead.id === draggedId);

        if (!draggedLead || draggedLead.status === status) {
            setDraggedId(null);
            return;
        }

        setBoardLeads((current) => current.map((lead) => (lead.id === draggedId ? { ...lead, status } : lead)));
        setDraggedId(null);

        router.patch(
            route('leads.update-status', draggedId),
            { status },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Lead movido correctamente.'),
                onError: () => {
                    setBoardLeads(previous);
                    toast.error('No se pudo mover el lead.');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leads · Kanban" />

            <div className="space-y-4 rounded-xl p-4">
                <Card className="border-sidebar-border/70 bg-sidebar-accent/20">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <Columns3 className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">Kanban de Leads</h1>
                                <p className="text-sm text-muted-foreground">Pipeline comercial con arrastrar y soltar para mover cada oportunidad.</p>
                            </div>
                        </div>
                        <Button onClick={() => router.visit(route('leads.index'))}>Ir a listado</Button>
                    </CardContent>
                </Card>

                <div className="overflow-x-auto pb-3">
                    <div className="flex min-w-max gap-4">
                        {grouped.map((column) => (
                            <Card
                                key={column.status}
                                className="w-80 border-sidebar-border/70 bg-muted/20"
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => onDropLead(column.status)}
                            >
                                <CardHeader className="border-b pb-3">
                                    <CardTitle className="flex items-center justify-between text-sm">
                                        <span>{statusLabel(column.status)}</span>
                                        <Badge variant="outline">{column.leads.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-3">
                                    {column.leads.map((lead) => (
                                        <article
                                            key={lead.id}
                                            draggable
                                            onDragStart={() => setDraggedId(lead.id)}
                                            className="cursor-grab rounded-lg border bg-card p-3 shadow-sm transition hover:shadow"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-sm font-semibold">{`${lead.first_name} ${lead.last_name ?? ''}`.trim()}</p>
                                                <GripVertical className="size-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                            <p className="text-xs text-muted-foreground">{lead.email ?? 'Sin correo'}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <LeadStatusBadge status={lead.status} />
                                                <span className="text-[11px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString('es-MX')}</span>
                                            </div>
                                        </article>
                                    ))}
                                    {column.leads.length === 0 && (
                                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                                            Arrastra leads aquí para continuar el flujo.
                                        </div>
                                    )}
                                    <Button variant="ghost" className="w-full justify-start" onClick={() => router.visit(route('leads.index'))}>
                                        <Plus className="mr-2 size-4" /> Crear lead en esta etapa
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
