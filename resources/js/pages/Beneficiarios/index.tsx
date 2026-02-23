import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    Filter,
    HandCoins,
    MoreHorizontal,
    Plus,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { TrackingDrawer } from '@/components/tracking/TrackingDrawer';
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
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
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

type BeneficiarioRow = {
    id: string;
    policy_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    second_last_name: string;
    full_name: string;
    birthday: string | null;
    rfc: string | null;
    relationship: number | null;
    benefit_percentage: string | null;
    occupation: string | null;
    company_name: string | null;
    policy?: { product: string | null; status: string } | null;
};
type PolizaOption = { id: string; product: string | null; status: string };
type BeneficiarioForm = {
    id: string | null;
    policy_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    second_last_name: string;
    birthday: string;
    rfc: string;
    relationship: string;
    benefit_percentage: string;
    occupation: string;
    company_name: string;
};

export default function BeneficiariosIndex({
    beneficiarios,
    polizas,
    filters,
    trackingCatalogs,
}: {
    beneficiarios: BeneficiarioRow[];
    polizas: PolizaOption[];
    filters: { search: string; policy_id: string | null };
    trackingCatalogs: {
        activityTypes: Array<{ id: number; key: string; name: string }>;
        channels: Array<{ id: number; key: string; name: string }>;
        statuses: Array<{ id: number; key: string; name: string }>;
        priorities: Array<{ id: number; key: string; name: string }>;
        outcomes: Array<{ id: number; key: string; name: string }>;
    };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [policyId, setPolicyId] = useState(filters.policy_id ?? '');
    const [beneficiarioToDelete, setBeneficiarioToDelete] =
        useState<BeneficiarioRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const [trackingRow, setTrackingRow] = useState<BeneficiarioRow | null>(
        null,
    );
    const { flash } = usePage<SharedData>().props;

    const form = useForm<BeneficiarioForm>({
        id: null,
        policy_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        second_last_name: '',
        birthday: '',
        rfc: '',
        relationship: '',
        benefit_percentage: '',
        occupation: '',
        company_name: '',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Beneficiarios', href: route('beneficiarios.index') }],
        [],
    );

    const applyFilters = () => {
        router.get(
            route('beneficiarios.index'),
            { search, policy_id: policyId || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openCreateDialog = () => {
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (beneficiario: BeneficiarioRow) => {
        form.clearErrors();
        form.setData({
            id: beneficiario.id,
            policy_id: beneficiario.policy_id,
            first_name: beneficiario.first_name,
            middle_name: beneficiario.middle_name ?? '',
            last_name: beneficiario.last_name,
            second_last_name: beneficiario.second_last_name ?? '',
            birthday: beneficiario.birthday ?? '',
            rfc: beneficiario.rfc ?? '',
            relationship: beneficiario.relationship?.toString() ?? '',
            benefit_percentage: beneficiario.benefit_percentage ?? '',
            occupation: beneficiario.occupation ?? '',
            company_name: beneficiario.company_name ?? '',
        });
        setFormMode('edit');
    };

    const columns: DataTableColumn<BeneficiarioRow>[] = [
        { key: 'full_name', header: 'Nombre completo', cell: (row) => row.full_name },
        {
            key: 'policy',
            header: 'Póliza',
            cell: (row) => row.policy?.product || row.policy?.status || '—',
            accessor: (row) => row.policy?.product || row.policy?.status || '',
        },
        { key: 'rfc', header: 'RFC', cell: (row) => row.rfc ?? '—' },
        {
            key: 'relationship',
            header: 'Parentesco',
            cell: (row) => row.relationship ?? '—',
        },
        {
            key: 'benefit_percentage',
            header: '% Beneficio',
            cell: (row) => row.benefit_percentage ?? '—',
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
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTrackingRow(row)}>
                            <Activity className="mr-2 size-4" /> Seguimiento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setBeneficiarioToDelete(row)}
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
            <Head title="Beneficiarios" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <HandCoins className="size-5 text-primary" />
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold">
                                    Beneficiarios
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona beneficiarios y porcentajes por
                                    póliza.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nuevo beneficiario
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar por nombre, RFC, ocupación o empresa..."
                            />
                            <Combobox
                                value={policyId}
                                onValueChange={(value) => setPolicyId(value)}
                            >
                                <ComboboxInput
                                    className="w-full"
                                    placeholder="selecciones nombre del catalogo"
                                    aria-label="Filtrar por póliza"
                                />
                                <ComboboxContent>
                                    <ComboboxList>
                                        <ComboboxEmpty>No se encontraron pólizas.</ComboboxEmpty>
                                        <ComboboxItem value="">Todas las pólizas</ComboboxItem>
                                        {polizas.map((option) => (
                                            <ComboboxItem key={option.id} value={option.id}>
                                                {option.product || option.status}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <Button onClick={applyFilters}>
                                <Filter className="mr-2 size-4" /> Aplicar
                                filtros
                            </Button>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={beneficiarios}
                    emptyMessage="No hay beneficiarios registrados."
                />
            </div>

            <TrackingDrawer
                open={Boolean(trackingRow)}
                onOpenChange={(open) => !open && setTrackingRow(null)}
                trackableType="Beneficiary"
                trackableId={trackingRow?.id ?? ''}
                trackableLabel={trackingRow ? trackingRow.full_name : 'Registro'}
                catalogs={trackingCatalogs}
            />

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                        form.clearErrors();
                    }
                }}
                title={
                    formMode === 'edit'
                        ? 'Editar beneficiario'
                        : 'Nuevo beneficiario'
                }
                description="Asigna beneficiarios por póliza con su porcentaje."
                submitLabel={
                    formMode === 'edit'
                        ? 'Guardar cambios'
                        : 'Guardar beneficiario'
                }
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({
                        ...data,
                        id: data.id || null,
                        relationship: data.relationship || null,
                        benefit_percentage: data.benefit_percentage || null,
                        birthday: data.birthday || null,
                    }));
                    form.post(route('beneficiarios.store'), {
                        onSuccess: () => {
                            setFormMode(null);
                            form.reset();
                        },
                        onError: () =>
                            toast.error('Verifica los campos marcados.'),
                    });
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label>Póliza</Label>
                        <Combobox
                            value={form.data.policy_id}
                            onValueChange={(value) => form.setData('policy_id', value)}
                        >
                            <ComboboxInput
                                className="w-full"
                                placeholder="selecciones nombre del catalogo"
                                aria-label="Póliza"
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>No se encontraron pólizas.</ComboboxEmpty>
                                    <ComboboxItem value="">Selecciona póliza</ComboboxItem>
                                    {polizas.map((item) => (
                                        <ComboboxItem key={item.id} value={item.id}>
                                            {item.product || item.status}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        {form.errors.policy_id && (
                            <FieldError>{form.errors.policy_id}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>Nombre(s)</Label>
                        <Input value={form.data.first_name} onChange={(event) => form.setData('first_name', event.target.value)} />
                        {form.errors.first_name && <FieldError>{form.errors.first_name}</FieldError>}
                    </Field>
                    <Field>
                        <Label>Segundo nombre</Label>
                        <Input value={form.data.middle_name} onChange={(event) => form.setData('middle_name', event.target.value)} />
                        {form.errors.middle_name && <FieldError>{form.errors.middle_name}</FieldError>}
                    </Field>
                    <Field>
                        <Label>Apellido paterno</Label>
                        <Input value={form.data.last_name} onChange={(event) => form.setData('last_name', event.target.value)} />
                        {form.errors.last_name && <FieldError>{form.errors.last_name}</FieldError>}
                    </Field>
                    <Field>
                        <Label>Apellido materno</Label>
                        <Input value={form.data.second_last_name} onChange={(event) => form.setData('second_last_name', event.target.value)} />
                        {form.errors.second_last_name && <FieldError>{form.errors.second_last_name}</FieldError>}
                    </Field>
                    <Field>
                        <Label>RFC</Label>
                        <Input
                            value={form.data.rfc}
                            onChange={(event) =>
                                form.setData('rfc', event.target.value)
                            }
                        />
                    </Field>
                    <Field>
                        <Label>% Beneficio</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={form.data.benefit_percentage}
                            onChange={(event) =>
                                form.setData(
                                    'benefit_percentage',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                </div>
            </CrudFormDialog>

            <AlertDialog
                open={Boolean(beneficiarioToDelete)}
                onOpenChange={(open) => !open && setBeneficiarioToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Eliminar beneficiario
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                beneficiarioToDelete &&
                                router.delete(
                                    route(
                                        'beneficiarios.destroy',
                                        beneficiarioToDelete.id,
                                    ),
                                    {
                                        onSuccess: () =>
                                            setBeneficiarioToDelete(null),
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
