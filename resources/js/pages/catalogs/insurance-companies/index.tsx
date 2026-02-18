import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Building2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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

type InsuranceCompanyRow = {
    id: string;
    code: string;
    name: string;
    created_at: string;
};

type InsuranceCompanyForm = {
    id: string | null;
    code: string;
    name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Catalogos', href: route('catalogs.insurance-companies.index') },
    { title: 'Aseguradoras', href: route('catalogs.insurance-companies.index') },
];

export default function InsuranceCompaniesIndex({
    insuranceCompanies,
}: {
    insuranceCompanies: InsuranceCompanyRow[];
}) {
    const [activeCompany, setActiveCompany] = useState<InsuranceCompanyRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const form = useForm<InsuranceCompanyForm>({ id: null, code: '', name: '' });
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const openCreateDialog = () => {
        setActiveCompany(null);
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (row: InsuranceCompanyRow) => {
        setActiveCompany(row);
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
            setActiveCompany(null);
            form.clearErrors();
        }
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(route('catalogs.insurance-companies.store'), {
            onSuccess: () => {
                setFormMode(null);
                setActiveCompany(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        });
    };

    const columns: DataTableColumn<InsuranceCompanyRow>[] = [
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
                        <DropdownMenuItem variant="destructive" onClick={() => setActiveCompany(row)}>
                            <Trash2 className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aseguradoras" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Building2 className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">Aseguradoras</h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona el catalogo de companias aseguradoras.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nueva aseguradora
                        </Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={insuranceCompanies}
                    searchColumn="name"
                    searchPlaceholder="Buscar aseguradora..."
                />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={closeFormDialog}
                title={formMode === 'edit' ? 'Editar aseguradora' : 'Crear aseguradora'}
                description="Captura el codigo y nombre para guardar en el catalogo."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar aseguradora'}
                processing={form.processing}
                onSubmit={submitForm}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="insurance-company-code">Codigo</Label>
                        <Input
                            id="insurance-company-code"
                            value={form.data.code}
                            onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                            placeholder="GNP"
                            aria-invalid={Boolean(form.errors.code)}
                        />
                        {form.errors.code && <FieldError>{form.errors.code}</FieldError>}
                    </Field>
                    <Field>
                        <Label htmlFor="insurance-company-name">Nombre</Label>
                        <Input
                            id="insurance-company-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="GNP"
                            aria-invalid={Boolean(form.errors.name)}
                        />
                        {form.errors.name && <FieldError>{form.errors.name}</FieldError>}
                    </Field>
                </div>
            </CrudFormDialog>

            <ConfirmDeleteDialog
                open={formMode === null && activeCompany !== null}
                onOpenChange={(open) => !open && setActiveCompany(null)}
                title="Eliminar aseguradora"
                entityLabel="la aseguradora"
                itemName={activeCompany?.name}
                onConfirm={() => {
                    if (!activeCompany) return;
                    router.delete(route('catalogs.insurance-companies.destroy', activeCompany.id), {
                        onSuccess: () => setActiveCompany(null),
                        onError: () => toast.error('No se pudo eliminar la aseguradora.'),
                    });
                }}
            />
        </AppLayout>
    );
}
