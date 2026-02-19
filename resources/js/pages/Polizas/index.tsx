import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Filter, MoreHorizontal, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { CrudFormDialog } from '@/components/crud-form-dialog';
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
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type PolizaRow = {
    id: string;
    insured_id: string;
    status: string;
    payment_channel: string | null;
    product: string | null;
    coverage_start: string | null;
    risk_premium: string | null;
    fractional_premium: string | null;
    periodicity: string | null;
    month: number | null;
    currency: number | null;
    insured?: { email: string | null; phone: string | null } | null;
};

type InsuredOption = { id: string; email: string | null; phone: string | null };
type PaymentChannelOption = { code: string; name: string };

type PolizaForm = {
    id: string | null;
    insured_id: string;
    status: string;
    payment_channel: string;
    product: string;
    coverage_start: string;
    risk_premium: string;
    fractional_premium: string;
    periodicity: string;
};

export default function PolizasIndex({ polizas, insureds, paymentChannels, filters }: { polizas: PolizaRow[]; insureds: InsuredOption[]; paymentChannels: PaymentChannelOption[]; filters: { search: string; payment_channel: string | null } }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [paymentChannel, setPaymentChannel] = useState(filters.payment_channel ?? '');
    const [polizaToDelete, setPolizaToDelete] = useState<PolizaRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm<PolizaForm>({
        id: null,
        insured_id: '',
        status: '',
        payment_channel: '',
        product: '',
        coverage_start: '',
        risk_premium: '',
        fractional_premium: '',
        periodicity: '',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [{ title: 'Pólizas', href: route('polizas.index') }], []);

    const applyFilters = () => {
        router.get(route('polizas.index'), { search, payment_channel: paymentChannel || undefined }, { preserveState: true, preserveScroll: true });
    };

    const openCreateDialog = () => {
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (poliza: PolizaRow) => {
        form.clearErrors();
        form.setData({
            id: poliza.id,
            insured_id: poliza.insured_id,
            status: poliza.status ?? '',
            payment_channel: poliza.payment_channel ?? '',
            product: poliza.product ?? '',
            coverage_start: poliza.coverage_start ?? '',
            risk_premium: poliza.risk_premium ?? '',
            fractional_premium: poliza.fractional_premium ?? '',
            periodicity: poliza.periodicity ?? '',
        });
        setFormMode('edit');
    };

    const paymentChannelLabel = (code: string | null) => paymentChannels.find((item) => item.code === code)?.name ?? code ?? '—';

    const columns: DataTableColumn<PolizaRow>[] = [
        { key: 'status', header: 'Estatus', cell: (row) => row.status },
        { key: 'product', header: 'Producto', cell: (row) => row.product ?? '—' },
        { key: 'insured', header: 'Asegurado', cell: (row) => row.insured?.email ?? row.insured?.phone ?? '—' },
        { key: 'payment_channel', header: 'Canal de pago', cell: (row) => paymentChannelLabel(row.payment_channel), accessor: (row) => paymentChannelLabel(row.payment_channel) },
        { key: 'risk_premium', header: 'Prima riesgo', cell: (row) => row.risk_premium ?? '—' },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setPolizaToDelete(row)}><Trash2 className="mr-2 size-4" /> Eliminar</DropdownMenuItem>
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
                                <h1 className="text-xl font-semibold">Pólizas</h1>
                                <p className="text-sm text-muted-foreground">Gestiona pólizas con filtros y acciones rápidas.</p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}><Plus className="mr-2 size-4" /> Nueva póliza</Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por estatus, producto o asegurado..." />
                            <select value={paymentChannel} onChange={(event) => setPaymentChannel(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                                <option value="">Todos los métodos de pago</option>
                                {paymentChannels.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
                            </select>
                            <Button onClick={applyFilters}><Filter className="mr-2 size-4" /> Aplicar filtros</Button>
                        </div>
                    </div>
                </div>

                <DataTable columns={columns} data={polizas} emptyMessage="No hay pólizas registradas." />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                                        form.clearErrors();
                    }
                }}
                title={formMode === 'edit' ? 'Editar póliza' : 'Nueva póliza'}
                description="Captura y actualiza la información comercial de la póliza."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar póliza'}
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({ ...data, id: data.id || null, coverage_start: data.coverage_start || null, risk_premium: data.risk_premium || null, fractional_premium: data.fractional_premium || null }));
                    form.post(route('polizas.upsert'), {
                        onSuccess: () => {
                            setFormMode(null);
                                                form.reset();
                        },
                        onError: () => toast.error('Verifica los campos marcados.'),
                    });
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label>Asegurado</Label>
                        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.insured_id} onChange={(event) => form.setData('insured_id', event.target.value)}>
                            <option value="">Selecciona asegurado</option>
                            {insureds.map((item) => <option key={item.id} value={item.id}>{item.email || item.phone || item.id}</option>)}
                        </select>
                        {form.errors.insured_id && <FieldError>{form.errors.insured_id}</FieldError>}
                    </Field>
                    <Field>
                        <Label>Estatus</Label>
                        <Input value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} />
                        {form.errors.status && <FieldError>{form.errors.status}</FieldError>}
                    </Field>
                    <Field>
                        <Label>Producto</Label>
                        <Input value={form.data.product} onChange={(event) => form.setData('product', event.target.value)} />
                    </Field>
                    <Field>
                        <Label>Canal de pago</Label>
                        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.payment_channel} onChange={(event) => form.setData('payment_channel', event.target.value)}>
                            <option value="">Selecciona método</option>
                            {paymentChannels.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                        </select>
                        {form.errors.payment_channel && <FieldError>{form.errors.payment_channel}</FieldError>}
                    </Field>
                </div>
            </CrudFormDialog>

            <AlertDialog open={Boolean(polizaToDelete)} onOpenChange={(open) => !open && setPolizaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar póliza</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => polizaToDelete && router.delete(route('polizas.destroy', polizaToDelete.id), { onSuccess: () => setPolizaToDelete(null) })}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
