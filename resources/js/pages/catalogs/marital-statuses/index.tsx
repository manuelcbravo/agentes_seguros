import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Heart, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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

type MaritalStatusRow = {
    id: string;
    code: string;
    name: string;
    created_at: string;
};

type MaritalStatusForm = {
    id: string | null;
    code: string;
    name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Catalogos', href: route('catalogs.marital-statuses.index') },
    { title: 'Estados civiles', href: route('catalogs.marital-statuses.index') },
];

export default function MaritalStatusesIndex({
    maritalStatuses,
}: {
    maritalStatuses: MaritalStatusRow[];
}) {
    const [activeMaritalStatus, setActiveMaritalStatus] = useState<MaritalStatusRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const form = useForm<MaritalStatusForm>({ id: null, code: '', name: '' });
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const openCreateDialog = () => {
        setActiveMaritalStatus(null);
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (row: MaritalStatusRow) => {
        setActiveMaritalStatus(row);
        form.clearErrors();
        form.setData({
            id: row.id,
            code: row.code,
            name: row.name,
        });
        setFormMode('edit');
    };

    const closeFormDialog = (open: boolean) => {
        if (!open) {
            setFormMode(null);
            setActiveMaritalStatus(null);
            form.clearErrors();
        }
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(route('catalogs.marital-statuses.store'), {
            onSuccess: () => {
                setFormMode(null);
                setActiveMaritalStatus(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        });
    };

    const columns: DataTableColumn<MaritalStatusRow>[] = [
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
                        <DropdownMenuItem variant="destructive" onClick={() => setActiveMaritalStatus(row)}>
                            <Trash2 className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Estados civiles" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Heart className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">Estados civiles</h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona el catalogo legal y comun para asegurados.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nuevo estado civil
                        </Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={maritalStatuses}
                    searchColumn="name"
                    searchPlaceholder="Buscar estado civil..."
                />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={closeFormDialog}
                title={formMode === 'edit' ? 'Editar estado civil' : 'Crear estado civil'}
                description="Captura el codigo y nombre para guardar en el catalogo."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar estado civil'}
                processing={form.processing}
                onSubmit={submitForm}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="marital-status-code">Codigo</Label>
                        <Input
                            id="marital-status-code"
                            value={form.data.code}
                            onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                            placeholder="CASADO"
                            aria-invalid={Boolean(form.errors.code)}
                        />
                        {form.errors.code && <FieldError>{form.errors.code}</FieldError>}
                    </Field>
                    <Field>
                        <Label htmlFor="marital-status-name">Nombre</Label>
                        <Input
                            id="marital-status-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="Casado(a)"
                            aria-invalid={Boolean(form.errors.name)}
                        />
                        {form.errors.name && <FieldError>{form.errors.name}</FieldError>}
                    </Field>
                </div>
            </CrudFormDialog>

            <ConfirmDeleteDialog
                open={formMode === null && activeMaritalStatus !== null}
                onOpenChange={(open) => !open && setActiveMaritalStatus(null)}
                title="Eliminar estado civil"
                entityLabel="el estado civil"
                itemName={activeMaritalStatus?.name}
                onConfirm={() => {
                    if (!activeMaritalStatus) return;
                    router.delete(route('catalogs.marital-statuses.destroy', activeMaritalStatus.id), {
                        onSuccess: () => setActiveMaritalStatus(null),
                        onError: () => toast.error('No se pudo eliminar el estado civil.'),
                    });
                }}
            />
        </AppLayout>
    );
}
