import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Coins, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type CurrencyRow = {
    id: string;
    code: string;
    name: string;
    created_at: string;
};

type CurrencyForm = {
    id: string | null;
    code: string;
    name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Catalogos', href: route('catalogs.currencies.index') },
    { title: 'Monedas', href: route('catalogs.currencies.index') },
];

export default function CurrenciesIndex({
    currencies,
}: {
    currencies: CurrencyRow[];
}) {
    const [activeCurrency, setActiveCurrency] = useState<CurrencyRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const form = useForm<CurrencyForm>({ id: null, code: '', name: '' });
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const openCreateDialog = () => {
        setActiveCurrency(null);
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (currency: CurrencyRow) => {
        setActiveCurrency(currency);
        form.clearErrors();
        form.setData({
            id: currency.id,
            code: currency.code,
            name: currency.name,
        });
        setFormMode('edit');
    };

    const closeFormDialog = (open: boolean) => {
        if (!open) {
            setFormMode(null);
            setActiveCurrency(null);
            form.clearErrors();
        }
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(route('catalogs.currencies.store'), {
            onSuccess: () => {
                setFormMode(null);
                setActiveCurrency(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        });
    };

    const columns: DataTableColumn<CurrencyRow>[] = [
        {
            key: 'code',
            header: 'Codigo',
            accessor: (row) => row.code,
            cell: (row) => row.code,
        },
        {
            key: 'name',
            header: 'Nombre',
            accessor: (row) => row.name,
            cell: (row) => row.name,
        },
        {
            key: 'created_at',
            header: 'Creado',
            cell: (row) => new Date(row.created_at).toLocaleDateString('es-MX'),
        },
        {
            key: 'actions',
            header: '',
            className: 'w-14',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>
                            <Pencil className="mr-2 size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setActiveCurrency(row)}>
                            <Trash2 className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monedas" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Coins className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">Monedas</h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona el catalogo de monedas para uso en polizas.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nueva moneda
                        </Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={currencies}
                    searchColumn="name"
                    searchPlaceholder="Buscar moneda..."
                />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={closeFormDialog}
                title={formMode === 'edit' ? 'Editar moneda' : 'Crear moneda'}
                description="Captura el codigo y nombre para guardar en el catalogo."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar moneda'}
                processing={form.processing}
                onSubmit={submitForm}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="currency-code">Codigo</Label>
                        <Input
                            id="currency-code"
                            value={form.data.code}
                            onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                            placeholder="MXN"
                            aria-invalid={Boolean(form.errors.code)}
                        />
                        {form.errors.code && <FieldError>{form.errors.code}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="currency-name">Nombre</Label>
                        <Input
                            id="currency-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="Peso mexicano"
                            aria-invalid={Boolean(form.errors.name)}
                        />
                        {form.errors.name && <FieldError>{form.errors.name}</FieldError>}
                    </Field>
                </div>
            </CrudFormDialog>

            <ConfirmDeleteDialog
                open={formMode === null && activeCurrency !== null}
                onOpenChange={(open) => !open && setActiveCurrency(null)}
                title="Eliminar moneda"
                entityLabel="la moneda"
                itemName={activeCurrency?.name}
                onConfirm={() => {
                    if (!activeCurrency) return;

                    router.delete(route('catalogs.currencies.destroy', activeCurrency.id), {
                        onSuccess: () => setActiveCurrency(null),
                        onError: () => toast.error('No se pudo eliminar la moneda.'),
                    });
                }}
            />
        </AppLayout>
    );
}
