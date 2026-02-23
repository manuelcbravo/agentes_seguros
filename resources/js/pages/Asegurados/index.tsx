import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    Filter,
    MoreHorizontal,
    Plus,
    Shield,
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

type AseguradoRow = {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    second_last_name: string | null;
    full_name: string;
    birthday: string;
    age_current: number | null;
    phone: string | null;
    email: string | null;
    occupation: string | null;
    company_name: string | null;
    approx_income: string | null;
    address: string | null;
    smokes: boolean;
    drinks: boolean;
};

type AseguradoForm = {
    id: string | null;
    first_name: string;
    middle_name: string;
    last_name: string;
    second_last_name: string;
    birthday: string;
    age_current: string;
    phone: string;
    email: string;
    occupation: string;
    company_name: string;
    approx_income: string;
    address: string;
    smokes: boolean;
    drinks: boolean;
};

export default function AseguradosIndex({
    asegurados,
    filters,
    trackingCatalogs,
}: {
    asegurados: AseguradoRow[];
    filters: { search: string; smokes: string };
    trackingCatalogs: {
        activityTypes: Array<{ id: number; key: string; name: string }>;
        channels: Array<{ id: number; key: string; name: string }>;
        statuses: Array<{ id: number; key: string; name: string }>;
        priorities: Array<{ id: number; key: string; name: string }>;
        outcomes: Array<{ id: number; key: string; name: string }>;
    };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [smokes, setSmokes] = useState(filters.smokes ?? '');
    const [aseguradoToDelete, setAseguradoToDelete] =
        useState<AseguradoRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const [trackingRow, setTrackingRow] = useState<AseguradoRow | null>(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm<AseguradoForm>({
        id: null,
        first_name: '',
        middle_name: '',
        last_name: '',
        second_last_name: '',
        birthday: '',
        age_current: '',
        phone: '',
        email: '',
        occupation: '',
        company_name: '',
        approx_income: '',
        address: '',
        smokes: false,
        drinks: false,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Asegurados', href: route('asegurados.index') }],
        [],
    );

    const applyFilters = () => {
        router.get(
            route('asegurados.index'),
            { search, smokes: smokes || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openCreateDialog = () => {
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (asegurado: AseguradoRow) => {
        form.clearErrors();
        form.setData({
            id: asegurado.id,
            first_name: asegurado.first_name ?? '',
            middle_name: asegurado.middle_name ?? '',
            last_name: asegurado.last_name ?? '',
            second_last_name: asegurado.second_last_name ?? '',
            birthday: asegurado.birthday ?? '',
            age_current: asegurado.age_current?.toString() ?? '',
            phone: asegurado.phone ?? '',
            email: asegurado.email ?? '',
            occupation: asegurado.occupation ?? '',
            company_name: asegurado.company_name ?? '',
            approx_income: asegurado.approx_income ?? '',
            address: asegurado.address ?? '',
            smokes: Boolean(asegurado.smokes),
            drinks: Boolean(asegurado.drinks),
        });
        setFormMode('edit');
    };

    const columns: DataTableColumn<AseguradoRow>[] = [
        { key: 'full_name', header: 'Nombre completo', cell: (row) => row.full_name },
        { key: 'email', header: 'Correo', cell: (row) => row.email ?? '—' },
        { key: 'phone', header: 'Teléfono', cell: (row) => row.phone ?? '—' },
        {
            key: 'occupation',
            header: 'Ocupación',
            cell: (row) => row.occupation ?? '—',
        },
        {
            key: 'company_name',
            header: 'Empresa',
            cell: (row) => row.company_name ?? '—',
        },
        {
            key: 'smokes',
            header: 'Fuma',
            cell: (row) => (row.smokes ? 'Sí' : 'No'),
            accessor: (row) => (row.smokes ? 'si' : 'no'),
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
                            onClick={() => setAseguradoToDelete(row)}
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
            <Head title="Asegurados" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Shield className="size-5 text-primary" />
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold">
                                    Asegurados
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona perfiles asegurables con filtros y
                                    acciones rápidas.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nuevo asegurado
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
                                placeholder="Buscar por nombre, correo, teléfono u ocupación..."
                            />
                            <Combobox
                                itemToStringLabel={(value) => ({'': 'Todos', '1': 'Fumadores', '0': 'No fumadores'})[value] ?? ''}
                                value={smokes}
                                onValueChange={(value) => setSmokes(value ?? '')}
                            >
                                <ComboboxInput
                                    className="w-full"
                                    placeholder="Seleccione hábito de fumar"
                                    aria-label="Filtro de fumadores"
                                />
                                <ComboboxContent>
                                    <ComboboxList>
                                        <ComboboxEmpty>No se encontraron opciones.</ComboboxEmpty>
                                        <ComboboxItem value="">Todos</ComboboxItem>
                                        <ComboboxItem value="1">Fumadores</ComboboxItem>
                                        <ComboboxItem value="0">No fumadores</ComboboxItem>
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
                    data={asegurados}
                    emptyMessage="No hay asegurados registrados."
                />
            </div>

            <TrackingDrawer
                open={Boolean(trackingRow)}
                onOpenChange={(open) => !open && setTrackingRow(null)}
                trackableType="Insured"
                trackableId={trackingRow?.id ?? ''}
                trackableLabel={
                    trackingRow ? trackingRow.full_name : 'Registro'
                }
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
                    formMode === 'edit' ? 'Editar asegurado' : 'Nuevo asegurado'
                }
                description="Captura datos personales y de perfil asegurable."
                submitLabel={
                    formMode === 'edit'
                        ? 'Guardar cambios'
                        : 'Guardar asegurado'
                }
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({
                        ...data,
                        id: data.id || null,
                        age_current: data.age_current || null,
                        approx_income: data.approx_income || null,
                    }));
                    form.post(route('asegurados.store'), {
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
                        <Label>Fecha de nacimiento</Label>
                        <Input
                            type="date"
                            value={form.data.birthday}
                            onChange={(event) =>
                                form.setData('birthday', event.target.value)
                            }
                        />
                        {form.errors.birthday && (
                            <FieldError>{form.errors.birthday}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>Edad</Label>
                        <Input
                            type="number"
                            value={form.data.age_current}
                            onChange={(event) =>
                                form.setData('age_current', event.target.value)
                            }
                        />
                    </Field>
                    <Field>
                        <Label>Correo</Label>
                        <Input
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                        />
                        {form.errors.email && (
                            <FieldError>{form.errors.email}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>Teléfono</Label>
                        <Input
                            value={form.data.phone}
                            onChange={(event) =>
                                form.setData('phone', event.target.value)
                            }
                        />
                    </Field>
                </div>
            </CrudFormDialog>

            <AlertDialog
                open={Boolean(aseguradoToDelete)}
                onOpenChange={(open) => !open && setAseguradoToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar asegurado</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                aseguradoToDelete &&
                                router.delete(
                                    route(
                                        'asegurados.destroy',
                                        aseguradoToDelete.id,
                                    ),
                                    {
                                        onSuccess: () =>
                                            setAseguradoToDelete(null),
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
