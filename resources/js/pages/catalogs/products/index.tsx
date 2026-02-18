import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MoreHorizontal, Package, Pencil, Plus, Trash2 } from 'lucide-react';
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

type Option = {
    id: string;
    name: string;
};

type ProductRow = {
    id: string;
    insurance_company_id: string;
    product_type_id: string;
    code: string;
    name: string;
    created_at: string;
    insurance_company: Option | null;
    product_type: Option | null;
};

type ProductForm = {
    id: string | null;
    insurance_company_id: string;
    product_type_id: string;
    code: string;
    name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Catalogos', href: route('catalogs.products.index') },
    { title: 'Productos', href: route('catalogs.products.index') },
];

export default function ProductsIndex({
    products,
    insuranceCompanies,
    productTypes,
}: {
    products: ProductRow[];
    insuranceCompanies: Option[];
    productTypes: Option[];
}) {
    const [activeProduct, setActiveProduct] = useState<ProductRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const form = useForm<ProductForm>({
        id: null,
        insurance_company_id: '',
        product_type_id: '',
        code: '',
        name: '',
    });
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const openCreateDialog = () => {
        setActiveProduct(null);
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (row: ProductRow) => {
        setActiveProduct(row);
        form.clearErrors();
        form.setData({
            id: row.id,
            insurance_company_id: row.insurance_company_id,
            product_type_id: row.product_type_id,
            code: row.code,
            name: row.name,
        });
        setFormMode('edit');
    };

    const closeFormDialog = (open: boolean) => {
        if (!open) {
            setFormMode(null);
            setActiveProduct(null);
            form.clearErrors();
        }
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(route('catalogs.products.store'), {
            onSuccess: () => {
                setFormMode(null);
                setActiveProduct(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        });
    };

    const columns: DataTableColumn<ProductRow>[] = [
        {
            key: 'code',
            header: 'Codigo',
            accessor: (row) => row.code,
            cell: (row) => row.code,
        },
        {
            key: 'name',
            header: 'Producto',
            accessor: (row) => row.name,
            cell: (row) => row.name,
        },
        {
            key: 'insurance_company',
            header: 'Aseguradora',
            cell: (row) => row.insurance_company?.name ?? '-',
        },
        {
            key: 'product_type',
            header: 'Tipo',
            cell: (row) => row.product_type?.name ?? '-',
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
                        <DropdownMenuItem variant="destructive" onClick={() => setActiveProduct(row)}>
                            <Trash2 className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Productos" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Package className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">Productos</h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona productos por aseguradora y tipo de producto.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nuevo producto
                        </Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={products}
                    searchColumn="name"
                    searchPlaceholder="Buscar producto..."
                />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={closeFormDialog}
                title={formMode === 'edit' ? 'Editar producto' : 'Crear producto'}
                description="Captura tipo, aseguradora, codigo y nombre del producto."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar producto'}
                processing={form.processing}
                onSubmit={submitForm}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="product-insurance-company">Aseguradora</Label>
                        <select
                            id="product-insurance-company"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={form.data.insurance_company_id}
                            onChange={(event) => form.setData('insurance_company_id', event.target.value)}
                        >
                            <option value="">Selecciona una aseguradora</option>
                            {insuranceCompanies.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        {form.errors.insurance_company_id && <FieldError>{form.errors.insurance_company_id}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="product-product-type">Tipo de producto</Label>
                        <select
                            id="product-product-type"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={form.data.product_type_id}
                            onChange={(event) => form.setData('product_type_id', event.target.value)}
                        >
                            <option value="">Selecciona un tipo</option>
                            {productTypes.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        {form.errors.product_type_id && <FieldError>{form.errors.product_type_id}</FieldError>}
                    </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="product-code">Codigo</Label>
                        <Input
                            id="product-code"
                            value={form.data.code}
                            onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                            placeholder="GNP_AUTO"
                            aria-invalid={Boolean(form.errors.code)}
                        />
                        {form.errors.code && <FieldError>{form.errors.code}</FieldError>}
                    </Field>
                    <Field>
                        <Label htmlFor="product-name">Nombre</Label>
                        <Input
                            id="product-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="GNP Auto Tradicional"
                            aria-invalid={Boolean(form.errors.name)}
                        />
                        {form.errors.name && <FieldError>{form.errors.name}</FieldError>}
                    </Field>
                </div>
            </CrudFormDialog>

            <ConfirmDeleteDialog
                open={formMode === null && activeProduct !== null}
                onOpenChange={(open) => !open && setActiveProduct(null)}
                title="Eliminar producto"
                entityLabel="el producto"
                itemName={activeProduct?.name}
                onConfirm={() => {
                    if (!activeProduct) return;
                    router.delete(route('catalogs.products.destroy', activeProduct.id), {
                        onSuccess: () => setActiveProduct(null),
                        onError: () => toast.error('No se pudo eliminar el producto.'),
                    });
                }}
            />
        </AppLayout>
    );
}
