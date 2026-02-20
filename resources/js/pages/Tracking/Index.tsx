import { Head, router, usePage } from '@inertiajs/react';
import { Activity, MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import {
    TrackingUpsertDialog,
    type TrackingActivityItem,
} from '@/components/tracking/TrackingUpsertDialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type CatalogItem = { id: number; key: string; name: string };
type Item = TrackingActivityItem & {
    trackable_type: string;
    trackable_id: string;
    activity_type: CatalogItem;
    channel: CatalogItem | null;
    status: CatalogItem;
    priority: CatalogItem | null;
    outcome: CatalogItem | null;
};

export default function TrackingIndex({
    items,
    catalogs,
    filters,
}: {
    items: { data: Item[] };
    catalogs: {
        activityTypes: CatalogItem[];
        channels: CatalogItem[];
        statuses: CatalogItem[];
        priorities: CatalogItem[];
        outcomes: CatalogItem[];
    };
    filters: Record<string, string | null>;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [deletingItem, setDeletingItem] = useState<Item | null>(null);
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Seguimiento', href: route('tracking.index') }],
        [],
    );

    const columns: DataTableColumn<Item>[] = [
        {
            key: 'occurred_at',
            header: 'Fecha',
            accessor: (row) => row.occurred_at,
            cell: (row) => new Date(row.occurred_at).toLocaleString('es-MX'),
        },
        {
            key: 'type',
            header: 'Tipo',
            accessor: (row) => row.activity_type?.name,
            cell: (row) => row.activity_type?.name ?? '—',
        },
        {
            key: 'channel',
            header: 'Canal',
            accessor: (row) => row.channel?.name,
            cell: (row) => row.channel?.name ?? '—',
        },
        {
            key: 'outcome',
            header: 'Outcome',
            accessor: (row) => row.outcome?.name,
            cell: (row) => row.outcome?.name ?? '—',
        },
        {
            key: 'entity',
            header: 'Entidad',
            accessor: (row) => row.trackable_type,
            cell: (row) =>
                `${row.trackable_type.split('\\').pop()} · ${row.trackable_id.slice(0, 8)}`,
        },
        {
            key: 'body',
            header: 'Detalle',
            accessor: (row) => row.body,
            cell: (row) => <p className="max-w-sm truncate">{row.body}</p>,
        },
        {
            key: 'actions',
            header: '',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => {
                                setEditingItem(row);
                                setDialogOpen(true);
                            }}
                        >
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingItem(row)}
                            variant="destructive"
                        >
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Seguimiento" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Activity className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">
                                    Seguimiento
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Histórico completo de actividades por
                                    agente.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() =>
                                router.visit(route('tracking.pendientes'))
                            }
                        >
                            <Plus className="mr-2 size-4" /> Ir a pendientes
                        </Button>
                    </div>
                </div>
                <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-4">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar en título o nota..."
                    />
                    <Input
                        type="date"
                        defaultValue={filters.date_from ?? ''}
                        onChange={(e) =>
                            router.get(
                                route('tracking.index'),
                                {
                                    ...filters,
                                    search,
                                    date_from: e.target.value || undefined,
                                },
                                { preserveState: true, preserveScroll: true },
                            )
                        }
                    />
                    <Input
                        type="date"
                        defaultValue={filters.date_to ?? ''}
                        onChange={(e) =>
                            router.get(
                                route('tracking.index'),
                                {
                                    ...filters,
                                    search,
                                    date_to: e.target.value || undefined,
                                },
                                { preserveState: true, preserveScroll: true },
                            )
                        }
                    />
                    <Button
                        onClick={() =>
                            router.get(
                                route('tracking.index'),
                                { ...filters, search: search || undefined },
                                { preserveState: true, preserveScroll: true },
                            )
                        }
                    >
                        Aplicar filtros
                    </Button>
                </div>
                <DataTable
                    columns={columns}
                    data={items.data}
                    searchColumn="body"
                    searchPlaceholder="Buscar actividad..."
                />
            </div>

            <TrackingUpsertDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                trackableType={editingItem?.trackable_type ?? 'Lead'}
                trackableId={editingItem?.trackable_id ?? ''}
                catalogs={catalogs}
                editingItem={editingItem}
            />
            <ConfirmDeleteDialog
                open={Boolean(deletingItem)}
                onOpenChange={(open) => !open && setDeletingItem(null)}
                itemName={deletingItem?.title ?? undefined}
                entityLabel="este seguimiento"
                onConfirm={() =>
                    deletingItem &&
                    router.delete(route('tracking.destroy', deletingItem.id), {
                        preserveScroll: true,
                        onSuccess: () => setDeletingItem(null),
                    })
                }
            />
        </AppLayout>
    );
}
