import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    Filter,
    MoreHorizontal,
    Plus,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { DataTable, type DataTableColumn } from '@/components/data-table';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { TrackingDrawer } from '@/components/tracking/TrackingDrawer';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type PolizaRow = {
    id: string;
    status: string;
    payment_channel: string | null;
    product: string | null;
    risk_premium: string | null;
    insured?: { email: string | null; phone: string | null } | null;
};

export default function PolizasIndex({
    polizas,
    paymentChannels,
    filters,
    trackingCatalogs,
}: any) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [paymentChannel, setPaymentChannel] = useState(
        filters.payment_channel ?? '',
    );
    const [polizaToDelete, setPolizaToDelete] = useState<PolizaRow | null>(
        null,
    );
    const [trackingRow, setTrackingRow] = useState<PolizaRow | null>(null);
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Pólizas', href: route('polizas.index') }],
        [],
    );

    const applyFilters = () => {
        router.get(
            route('polizas.index'),
            { search, payment_channel: paymentChannel || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const paymentChannelLabel = (code: string | null) =>
        paymentChannels.find((item: any) => String(item.code) === String(code))
            ?.name ??
        code ??
        '—';

    const statusBadge = (status: PolizaRow['status']) => {
        if (status === 'activo')
            return (
                <Badge className="bg-emerald-500/10 text-emerald-700">
                    Activo
                </Badge>
            );
        if (status === 'caducada')
            return <Badge variant="destructive">Caducada</Badge>;
        return <Badge variant="secondary">Borrador</Badge>;
    };

    const columns: DataTableColumn<PolizaRow>[] = [
        {
            key: 'status',
            header: 'Estatus',
            cell: (row) => statusBadge(row.status),
        },
        {
            key: 'product',
            header: 'Producto',
            cell: (row) => row.product ?? '—',
        },
        {
            key: 'insured',
            header: 'Asegurado',
            cell: (row) => row.insured?.email ?? row.insured?.phone ?? '—',
        },
        {
            key: 'payment_channel',
            header: 'Canal de pago',
            cell: (row) => paymentChannelLabel(row.payment_channel),
        },
        {
            key: 'risk_premium',
            header: 'Prima riesgo',
            cell: (row) => row.risk_premium ?? '—',
        },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() =>
                                router.visit(
                                    route('polizas.wizard.edit', row.id),
                                )
                            }
                        >
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTrackingRow(row)}>
                            <Activity className="mr-2 size-4" /> Seguimiento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPolizaToDelete(row)}
                        >
                            <Trash2 className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pólizas" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="size-5 text-primary" />
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold">
                                    Pólizas
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona pólizas y entra al wizard de 4
                                    pasos.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() =>
                                router.visit(route('polizas.wizard.create'))
                            }
                        >
                            <Plus className="mr-2 size-4" /> Nueva póliza
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por estatus o producto..."
                        />
                        <select
                            value={paymentChannel}
                            onChange={(event) =>
                                setPaymentChannel(event.target.value)
                            }
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Todos los métodos de pago</option>
                            {paymentChannels.map((option: any) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                        <Button onClick={applyFilters}>
                            <Filter className="mr-2 size-4" /> Aplicar filtros
                        </Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={polizas}
                    emptyMessage="No hay pólizas registradas."
                />
            </div>

            <TrackingDrawer
                open={Boolean(trackingRow)}
                onOpenChange={(open) => !open && setTrackingRow(null)}
                trackableType="Policy"
                trackableId={trackingRow?.id ?? ''}
                trackableLabel={
                    trackingRow
                        ? (trackingRow.product ?? trackingRow.id)
                        : 'Registro'
                }
                catalogs={trackingCatalogs}
            />

            <AlertDialog
                open={Boolean(polizaToDelete)}
                onOpenChange={(open) => !open && setPolizaToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar póliza</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                polizaToDelete &&
                                router.delete(
                                    route('polizas.destroy', polizaToDelete.id),
                                    {
                                        onSuccess: () =>
                                            setPolizaToDelete(null),
                                    },
                                )
                            }
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
