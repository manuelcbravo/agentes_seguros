import { Head, router, usePage } from '@inertiajs/react';
import { ArchiveRestore, Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { LeadsTable, type LeadRow } from '@/components/leads/leads-table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type PaginatedLeads = {
    data: LeadRow[];
    current_page: number;
    last_page: number;
    total: number;
};

export default function ArchivedLeadsIndex({
    leads,
    filters,
    agents,
    statusOptions,
}: {
    leads: PaginatedLeads;
    filters: { search: string; status: string | null; agent_id: string | null };
    agents: Array<{ id: string; name: string }>;
    statusOptions: Array<{ value: string; label: string }>;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [agentId, setAgentId] = useState(filters.agent_id ?? '');
    const [activeLead, setActiveLead] = useState<LeadRow | null>(null);
    const [leadToRestore, setLeadToRestore] = useState<LeadRow | null>(null);
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Leads', href: route('leads.index') },
            { title: 'Archivados', href: route('leads.archived.index') },
        ],
        [],
    );

    const applyFilters = (page = 1) => {
        router.get(
            route('leads.archived.index'),
            {
                search,
                status: status || undefined,
                agent_id: agentId || undefined,
                page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leads archivados" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold">Leads archivados</h1>
                            <p className="text-sm text-muted-foreground">Revisa oportunidades pausadas y restáuralas cuando sea necesario.</p>
                        </div>
                        <Button variant="outline" onClick={() => router.visit(route('leads.index'))}>
                            Volver a leads
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o telefono..." />
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                            <option value="">Todos los estatus</option>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select value={agentId} onChange={(event) => setAgentId(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                            <option value="">Todos los agentes</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                        </select>
                        <Button onClick={() => applyFilters()}>
                            <Filter className="mr-2 size-4" /> Aplicar filtros
                        </Button>
                    </div>
                </div>

                <LeadsTable
                    mode="archived"
                    data={leads.data}
                    statusOptions={statusOptions}
                    onEdit={() => undefined}
                    onView={(lead) => router.visit(route('leads.index', { search: lead.first_name }))}
                    onFiles={(lead) => router.visit(route('leads.index', { search: lead.first_name }))}
                    onConvert={() => undefined}
                    onDelete={(lead) => setActiveLead(lead)}
                    onUnarchive={(lead) => setLeadToRestore(lead)}
                />
            </div>

            <AlertDialog open={leadToRestore !== null} onOpenChange={(open) => !open && setLeadToRestore(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar lead archivado</AlertDialogTitle>
                        <AlertDialogDescription>Este lead volverá a mostrarse en el listado principal y en el tablero Kanban.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (!leadToRestore) return;

                                router.post(route('leads.unarchive', leadToRestore.id), undefined, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        toast.success('Lead restaurado correctamente.');
                                        setLeadToRestore(null);
                                        router.reload({ only: ['leads', 'flash'] });
                                    },
                                    onError: () => toast.error('No se pudo restaurar el lead.'),
                                });
                            }}
                        >
                            <ArchiveRestore className="mr-2 size-4" /> Restaurar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ConfirmDeleteDialog
                open={activeLead !== null}
                onOpenChange={(open) => !open && setActiveLead(null)}
                title="Eliminar lead"
                entityLabel="el lead"
                itemName={activeLead ? `${activeLead.first_name} ${activeLead.last_name ?? ''}`.trim() : undefined}
                onConfirm={() => {
                    if (!activeLead) return;

                    router.delete(route('leads.destroy', activeLead.id), {
                        onSuccess: () => setActiveLead(null),
                        onError: () => toast.error('No se pudo eliminar el lead.'),
                    });
                }}
            />
        </AppLayout>
    );
}
