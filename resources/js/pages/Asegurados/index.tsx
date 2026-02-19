import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Filter, MoreHorizontal, Plus, Shield, Trash2 } from 'lucide-react';
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

type AseguradoRow = { id: string; birthday: string; age_current: number | null; phone: string | null; email: string | null; occupation: string | null; company_name: string | null; approx_income: string | null; address: string | null; smokes: boolean; drinks: boolean };

type AseguradoForm = { id: string | null; birthday: string; age_current: string; phone: string; email: string; occupation: string; company_name: string; approx_income: string; address: string; smokes: boolean; drinks: boolean };

export default function AseguradosIndex({ asegurados, filters }: { asegurados: AseguradoRow[]; filters: { search: string; smokes: string } }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [smokes, setSmokes] = useState(filters.smokes ?? '');
    const [aseguradoToDelete, setAseguradoToDelete] = useState<AseguradoRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm<AseguradoForm>({ id: null, birthday: '', age_current: '', phone: '', email: '', occupation: '', company_name: '', approx_income: '', address: '', smokes: false, drinks: false });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [{ title: 'Asegurados', href: route('asegurados.index') }], []);

    const applyFilters = () => {
        router.get(route('asegurados.index'), { search, smokes: smokes || undefined }, { preserveState: true, preserveScroll: true });
    };

    const openCreateDialog = () => {
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (asegurado: AseguradoRow) => {
        form.clearErrors();
        form.setData({ id: asegurado.id, birthday: asegurado.birthday ?? '', age_current: asegurado.age_current?.toString() ?? '', phone: asegurado.phone ?? '', email: asegurado.email ?? '', occupation: asegurado.occupation ?? '', company_name: asegurado.company_name ?? '', approx_income: asegurado.approx_income ?? '', address: asegurado.address ?? '', smokes: Boolean(asegurado.smokes), drinks: Boolean(asegurado.drinks) });
        setFormMode('edit');
    };

    const columns: DataTableColumn<AseguradoRow>[] = [
        { key: 'email', header: 'Correo', cell: (row) => row.email ?? '—' },
        { key: 'phone', header: 'Teléfono', cell: (row) => row.phone ?? '—' },
        { key: 'occupation', header: 'Ocupación', cell: (row) => row.occupation ?? '—' },
        { key: 'company_name', header: 'Empresa', cell: (row) => row.company_name ?? '—' },
        { key: 'smokes', header: 'Fuma', cell: (row) => (row.smokes ? 'Sí' : 'No'), accessor: (row) => (row.smokes ? 'si' : 'no') },
        {
            key: 'actions', header: '', className: 'w-12', cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setAseguradoToDelete(row)}><Trash2 className="mr-2 size-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asegurados" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3"><Shield className="size-5 text-primary" /><div className="space-y-1"><h1 className="text-xl font-semibold">Asegurados</h1><p className="text-sm text-muted-foreground">Gestiona perfiles asegurables con filtros y acciones rápidas.</p></div></div>
                        <Button onClick={openCreateDialog}><Plus className="mr-2 size-4" /> Nuevo asegurado</Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4"><div className="space-y-3"><div className="grid gap-3 md:grid-cols-3"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por correo, teléfono u ocupación..." /><select value={smokes} onChange={(event) => setSmokes(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Todos</option><option value="1">Fumadores</option><option value="0">No fumadores</option></select><Button onClick={applyFilters}><Filter className="mr-2 size-4" /> Aplicar filtros</Button></div></div></div>

                <DataTable columns={columns} data={asegurados} emptyMessage="No hay asegurados registrados." />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                                        form.clearErrors();
                    }
                }}
                title={formMode === 'edit' ? 'Editar asegurado' : 'Nuevo asegurado'}
                description="Captura datos personales y de perfil asegurable."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar asegurado'}
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({ ...data, id: data.id || null, age_current: data.age_current || null, approx_income: data.approx_income || null }));
                    form.post(route('asegurados.upsert'), {
                        onSuccess: () => {
                            setFormMode(null);
                                                form.reset();
                        },
                        onError: () => toast.error('Verifica los campos marcados.'),
                    });
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Fecha de nacimiento</Label><Input type="date" value={form.data.birthday} onChange={(event) => form.setData('birthday', event.target.value)} />{form.errors.birthday && <FieldError>{form.errors.birthday}</FieldError>}</Field>
                    <Field><Label>Edad</Label><Input type="number" value={form.data.age_current} onChange={(event) => form.setData('age_current', event.target.value)} /></Field>
                    <Field><Label>Correo</Label><Input value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />{form.errors.email && <FieldError>{form.errors.email}</FieldError>}</Field>
                    <Field><Label>Teléfono</Label><Input value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} /></Field>
                </div>
            </CrudFormDialog>

            <AlertDialog open={Boolean(aseguradoToDelete)} onOpenChange={(open) => !open && setAseguradoToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Eliminar asegurado</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => aseguradoToDelete && router.delete(route('asegurados.destroy', aseguradoToDelete.id), { onSuccess: () => setAseguradoToDelete(null) })}>Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
