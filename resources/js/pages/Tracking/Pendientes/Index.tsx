import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Head, router, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    CheckCircle2,
    Clock3,
    LayoutList,
    Plus,
    Timer,
    TriangleAlert,
} from 'lucide-react';
import {
    type ComponentType,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import {
    TrackingUpsertDialog,
    type TrackingActivityItem,
} from '@/components/tracking/TrackingUpsertDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type CatalogItem = { id: number; key: string; name: string };

type Item = TrackingActivityItem & {
    trackable_type: string;
    trackable_id: string;
    status: CatalogItem;
    activity_type: CatalogItem;
    priority: CatalogItem | null;
};

export default function TrackingPendientesIndex({
    items,
    events,
    catalogs,
    metrics,
    filters,
}: {
    items: Item[];
    events: Item[];
    metrics: Record<string, number>;
    filters: Record<string, string | null>;
    catalogs: {
        statuses: CatalogItem[];
        activityTypes: CatalogItem[];
        priorities: CatalogItem[];
        channels: CatalogItem[];
        outcomes: CatalogItem[];
    };
}) {
    const [currentTab, setCurrentTab] = useState<'table' | 'calendar'>('table');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [deletingItem, setDeletingItem] = useState<Item | null>(null);
    const [statusId, setStatusId] = useState(filters.status_id ?? '');
    const [typeId, setTypeId] = useState(filters.activity_type_id ?? '');
    const [priorityId, setPriorityId] = useState(filters.priority_id ?? '');
    const [period, setPeriod] = useState(filters.period ?? '');
    const calendarRef = useRef<HTMLDivElement | null>(null);
    const calendarInstanceRef = useRef<Calendar | null>(null);
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Pendientes', href: route('tracking.pendientes') }],
        [],
    );
    const doneStatus = catalogs.statuses.find((item) => item.key === 'done');

    useEffect(() => {
        if (!calendarRef.current || currentTab !== 'calendar') return;
        if (!calendarInstanceRef.current) {
            calendarInstanceRef.current = new Calendar(calendarRef.current, {
                plugins: [dayGridPlugin],
                initialView: 'dayGridMonth',
                locale: 'es',
                height: 'auto',
                eventClick: ({ event }) => {
                    const selected = items.find(
                        (item) => item.id === String(event.id),
                    );
                    if (!selected) return;
                    setEditingItem(selected);
                    setDialogOpen(true);
                },
            });
            calendarInstanceRef.current.render();
        }

        calendarInstanceRef.current.removeAllEvents();
        events.forEach((item) =>
            calendarInstanceRef.current?.addEvent({
                id: item.id,
                title: `${item.activity_type?.name ?? 'Seguimiento'} · ${item.trackable_type.split('\\').pop()} · ${(item.body ?? '').slice(0, 30)}`,
                start: item.next_action_at ?? item.occurred_at,
            }),
        );
    }, [currentTab, events, items]);

    const columns: DataTableColumn<Item>[] = [
        {
            key: 'next_action_at',
            header: 'Próxima acción',
            accessor: (row) => row.next_action_at,
            cell: (row) =>
                row.next_action_at
                    ? new Date(row.next_action_at).toLocaleString('es-MX')
                    : '—',
        },
        {
            key: 'type',
            header: 'Tipo',
            accessor: (row) => row.activity_type?.name,
            cell: (row) => row.activity_type?.name ?? '—',
        },
        {
            key: 'priority',
            header: 'Prioridad',
            accessor: (row) => row.priority?.name,
            cell: (row) => row.priority?.name ?? '—',
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
            header: 'Nota',
            accessor: (row) => row.body,
            cell: (row) => <p className="max-w-sm truncate">{row.body}</p>,
        },
        {
            key: 'status',
            header: 'Estatus',
            accessor: (row) => row.status?.name,
            cell: (row) => (
                <Badge variant="outline">{row.status?.name ?? '—'}</Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                            Acciones
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => {
                                setEditingItem(row);
                                setDialogOpen(true);
                            }}
                        >
                            Ver seguimiento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                setEditingItem(row);
                                setDialogOpen(true);
                            }}
                        >
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                if (!doneStatus) return;
                                router.post(
                                    route('tracking.upsert'),
                                    {
                                        id: row.id,
                                        trackable_type: row.trackable_type,
                                        trackable_id: row.trackable_id,
                                        activity_type_id: row.activity_type_id,
                                        channel_id: row.channel_id,
                                        status_id: doneStatus.id,
                                        priority_id: row.priority_id,
                                        outcome_id: row.outcome_id,
                                        title: row.title,
                                        body: row.body,
                                        occurred_at: row.occurred_at,
                                        next_action_at: row.next_action_at,
                                        completed_at: new Date().toISOString(),
                                    },
                                    { preserveScroll: true },
                                );
                            }}
                        >
                            <CheckCircle2 className="mr-2 size-4" /> Marcar como
                            completado
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
            <Head title="Pendientes" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">
                                Pendientes
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Visualiza tus pendientes por lista o calendario.
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingItem(null);
                                setDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-2 size-4" /> Nuevo seguimiento
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                    <MetricCard
                        label="Total pendientes"
                        value={metrics.total_pending}
                        icon={LayoutList}
                    />
                    <MetricCard
                        label="Vencidos"
                        value={metrics.overdue}
                        icon={TriangleAlert}
                    />
                    <MetricCard
                        label="Hoy"
                        value={metrics.today}
                        icon={Clock3}
                    />
                    <MetricCard
                        label="Esta semana"
                        value={metrics.week}
                        icon={CalendarClock}
                    />
                    <MetricCard
                        label="Completados 7 días"
                        value={metrics.completed_last_7_days}
                        icon={Timer}
                    />
                </div>

                <div className="space-y-3 rounded-xl border p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="">Periodo</option>
                            <option value="today">Hoy</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mes</option>
                        </select>
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={typeId}
                            onChange={(e) => setTypeId(e.target.value)}
                        >
                            <option value="">Tipo</option>
                            {catalogs.activityTypes.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={priorityId}
                            onChange={(e) => setPriorityId(e.target.value)}
                        >
                            <option value="">Prioridad</option>
                            {catalogs.priorities.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <Button
                            onClick={() =>
                                router.get(
                                    route('tracking.pendientes'),
                                    {
                                        period: period || undefined,
                                        activity_type_id: typeId || undefined,
                                        priority_id: priorityId || undefined,
                                        status_id: statusId || undefined,
                                    },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                        >
                            Aplicar filtros
                        </Button>
                    </div>
                    <div className="inline-flex rounded-lg border p-1">
                        <Button
                            size="sm"
                            variant={
                                currentTab === 'table' ? 'default' : 'ghost'
                            }
                            onClick={() => setCurrentTab('table')}
                        >
                            Tabla
                        </Button>
                        <Button
                            size="sm"
                            variant={
                                currentTab === 'calendar' ? 'default' : 'ghost'
                            }
                            onClick={() => setCurrentTab('calendar')}
                        >
                            Calendario
                        </Button>
                    </div>
                    {currentTab === 'table' ? (
                        <DataTable
                            columns={columns}
                            data={items}
                            emptyMessage="No tienes pendientes por ahora."
                        />
                    ) : (
                        <div
                            ref={calendarRef}
                            className="rounded-xl border p-3"
                        />
                    )}
                </div>
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

function MetricCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <Icon className="size-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{value ?? 0}</p>
            </CardContent>
        </Card>
    );
}
