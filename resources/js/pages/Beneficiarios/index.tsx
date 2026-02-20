import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Filter, HandCoins, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
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

type BeneficiarioRow = { id: string; policy_id: string; name: string; birthday: string | null; rfc: string | null; relationship: number | null; benefit_percentage: string | null; occupation: string | null; company_name: string | null; policy?: { product: string | null; status: string } | null };
type PolizaOption = { id: string; product: string | null; status: string };
type BeneficiarioForm = { id: string | null; policy_id: string; name: string; birthday: string; rfc: string; relationship: string; benefit_percentage: string; occupation: string; company_name: string };

export default function BeneficiariosIndex({ beneficiarios, polizas, filters }: { beneficiarios: BeneficiarioRow[]; polizas: PolizaOption[]; filters: { search: string; policy_id: string | null } }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [policyId, setPolicyId] = useState(filters.policy_id ?? '');
    const [beneficiarioToDelete, setBeneficiarioToDelete] = useState<BeneficiarioRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm<BeneficiarioForm>({ id: null, policy_id: '', name: '', birthday: '', rfc: '', relationship: '', benefit_percentage: '', occupation: '', company_name: '' });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [{ title: 'Beneficiarios', href: route('beneficiarios.index') }], []);

    const applyFilters = () => {
        router.get(route('beneficiarios.index'), { search, policy_id: policyId || undefined }, { preserveState: true, preserveScroll: true });
    };

    const openCreateDialog = () => {
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (beneficiario: BeneficiarioRow) => {
        form.clearErrors();
        form.setData({ id: beneficiario.id, policy_id: beneficiario.policy_id, name: beneficiario.name, birthday: beneficiario.birthday ?? '', rfc: beneficiario.rfc ?? '', relationship: beneficiario.relationship?.toString() ?? '', benefit_percentage: beneficiario.benefit_percentage ?? '', occupation: beneficiario.occupation ?? '', company_name: beneficiario.company_name ?? '' });
        setFormMode('edit');
    };

    const columns: DataTableColumn<BeneficiarioRow>[] = [
        { key: 'name', header: 'Nombre', cell: (row) => row.name },
        { key: 'policy', header: 'Póliza', cell: (row) => row.policy?.product || row.policy?.status || '—', accessor: (row) => row.policy?.product || row.policy?.status || '' },
        { key: 'rfc', header: 'RFC', cell: (row) => row.rfc ?? '—' },
        { key: 'relationship', header: 'Parentesco', cell: (row) => row.relationship ?? '—' },
        { key: 'benefit_percentage', header: '% Beneficio', cell: (row) => row.benefit_percentage ?? '—' },
        {
            key: 'actions', header: '', className: 'w-12', cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setBeneficiarioToDelete(row)}><Trash2 className="mr-2 size-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Beneficiarios" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3"><HandCoins className="size-5 text-primary" /><div className="space-y-1"><h1 className="text-xl font-semibold">Beneficiarios</h1><p className="text-sm text-muted-foreground">Gestiona beneficiarios y porcentajes por póliza.</p></div></div>
                        <Button onClick={openCreateDialog}><Plus className="mr-2 size-4" /> Nuevo beneficiario</Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4"><div className="space-y-3"><div className="grid gap-3 md:grid-cols-3"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, RFC u ocupación..." /><select value={policyId} onChange={(event) => setPolicyId(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Todas las pólizas</option>{polizas.map((option) => <option key={option.id} value={option.id}>{option.product || option.status}</option>)}</select><Button onClick={applyFilters}><Filter className="mr-2 size-4" /> Aplicar filtros</Button></div></div></div>

                <DataTable columns={columns} data={beneficiarios} emptyMessage="No hay beneficiarios registrados." />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                                        form.clearErrors();
                    }
                }}
                title={formMode === 'edit' ? 'Editar beneficiario' : 'Nuevo beneficiario'}
                description="Asigna beneficiarios por póliza con su porcentaje."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar beneficiario'}
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({ ...data, id: data.id || null, relationship: data.relationship || null, benefit_percentage: data.benefit_percentage || null, birthday: data.birthday || null }));
                    form.post(route('beneficiarios.store'), {
                        onSuccess: () => {
                            setFormMode(null);
                                                form.reset();
                        },
                        onError: () => toast.error('Verifica los campos marcados.'),
                    });
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Póliza</Label><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.policy_id} onChange={(event) => form.setData('policy_id', event.target.value)}><option value="">Selecciona póliza</option>{polizas.map((item) => <option key={item.id} value={item.id}>{item.product || item.status}</option>)}</select>{form.errors.policy_id && <FieldError>{form.errors.policy_id}</FieldError>}</Field>
                    <Field><Label>Nombre</Label><Input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />{form.errors.name && <FieldError>{form.errors.name}</FieldError>}</Field>
                    <Field><Label>RFC</Label><Input value={form.data.rfc} onChange={(event) => form.setData('rfc', event.target.value)} /></Field>
                    <Field><Label>% Beneficio</Label><Input type="number" step="0.01" value={form.data.benefit_percentage} onChange={(event) => form.setData('benefit_percentage', event.target.value)} /></Field>
                </div>
            </CrudFormDialog>

            <AlertDialog open={Boolean(beneficiarioToDelete)} onOpenChange={(open) => !open && setBeneficiarioToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Eliminar beneficiario</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => beneficiarioToDelete && router.delete(route('beneficiarios.destroy', beneficiarioToDelete.id), { onSuccess: () => setBeneficiarioToDelete(null) })}>Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
