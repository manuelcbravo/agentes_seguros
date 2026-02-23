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
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
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
    statusOptions,
}: {
    leads: PaginatedLeads;
    filters: { search: string; status: string | null };
    statusOptions: Array<{ value: string; label: string }>;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [activeLead, setActiveLead] = useState<LeadRow | null>(null);
    const [leadToRestore, setLeadToRestore] = useState<LeadRow | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
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
                            <h1 className="text-xl font-semibold">
                                Leads archivados
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Revisa oportunidades pausadas y restáuralas
                                cuando sea necesario.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route('leads.index'))}
                        >
                            Volver a leads
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, correo o telefono..."
                        />
                        <Combobox
                            value={status}
                            onValueChange={(value) => setStatus(value)}
                        >
                            <ComboboxInput
                                className="w-full"
                                placeholder="selecciones nombre del catalogo"
                                aria-label="Estatus"
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>No se encontraron estatus.</ComboboxEmpty>
                                    <ComboboxItem value="">Todos los estatus</ComboboxItem>
                                    {statusOptions.map((option) => (
                                        <ComboboxItem key={option.value} value={option.value}>
                                            {option.label}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
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
                    onView={(lead) =>
                        router.visit(
                            route('leads.index', { search: lead.first_name }),
                        )
                    }
                    onFiles={(lead) =>
                        router.visit(
                            route('leads.index', { search: lead.first_name }),
                        )
                    }
                    onConvert={() => undefined}
                    onDelete={(lead) => setActiveLead(lead)}
                    onUnarchive={(lead) => setLeadToRestore(lead)}
                    onTracking={() => undefined}
                />
            </div>

            <AlertDialog
                open={leadToRestore !== null}
                onOpenChange={(open) => !open && setLeadToRestore(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Restaurar lead archivado
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Este lead volverá a mostrarse en el listado
                            principal y en el tablero Kanban.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isRestoring}
                            onClick={() => {
                                if (!leadToRestore || isRestoring) return;

                                setIsRestoring(true);
                                router.post(
                                    route('leads.unarchive', leadToRestore.id),
                                    undefined,
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setLeadToRestore(null);
                                            router.reload({
                                                only: ['leads', 'flash'],
                                            });
                                        },
                                        onError: () =>
                                            toast.error(
                                                'No se pudo restaurar el lead.',
                                            ),
                                        onFinish: () => setIsRestoring(false),
                                    },
                                );
                            }}
                        >
                            <ArchiveRestore className="mr-2 size-4" />{' '}
                            {isRestoring ? 'Restaurando...' : 'Restaurar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ConfirmDeleteDialog
                open={activeLead !== null}
                onOpenChange={(open) => !open && setActiveLead(null)}
                title="Eliminar lead"
                entityLabel="el lead"
                itemName={
                    activeLead
                        ? `${activeLead.first_name} ${activeLead.last_name ?? ''}`.trim()
                        : undefined
                }
                onConfirm={() => {
                    if (!activeLead) return;

                    router.delete(route('leads.destroy', activeLead.id), {
                        onSuccess: () => setActiveLead(null),
                        onError: () =>
                            toast.error('No se pudo eliminar el lead.'),
                    });
                }}
            />
        </AppLayout>
    );
}
