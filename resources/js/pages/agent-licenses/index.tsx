import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    CalendarClock,
    IdCard,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { AgentLicenseForm } from './form';

type AgentItem = {
    id: string;
    name: string;
    email: string | null;
};

type InsuranceCompanyItem = {
    id: string;
    name: string;
    code: string | null;
};

type StatusOption = {
    value: string;
    label: string;
};

type LicenseRow = {
    id: string;
    agent_id: string;
    aseguradora_id: string;
    num_licencia: string;
    fecha_expiracion: string;
    fecha_emision: string;
    status: string;
    observaciones: string | null;
    activo: boolean;
    created_at: string;
    agent: AgentItem;
    insurance_company: InsuranceCompanyItem;
};

type LicenseForm = {
    id: string | null;
    agent_id: string;
    aseguradora_id: string;
    num_licencia: string;
    fecha_expiracion: string;
    fecha_emision: string;
    status: string;
    observaciones: string;
    activo: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Licencias', href: route('agent-licenses.index') },
];

const statusLabelMap: Record<string, string> = {
    vigente: 'Vigente',
    por_vencer: 'Por vencer',
    vencida: 'Vencida',
    suspendida: 'Suspendida',
};

const statusVariantMap: Record<
    string,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    vigente: 'secondary',
    por_vencer: 'outline',
    vencida: 'destructive',
    suspendida: 'default',
};

const toDateInputValue = (value: string) => value?.slice(0, 10) ?? '';

export default function AgentLicensesIndex({
    licenses,
    insuranceCompanies,
    statusOptions,
}: {
    licenses: LicenseRow[];
    insuranceCompanies: InsuranceCompanyItem[];
    statusOptions: StatusOption[];
}) {
    const [activeLicense, setActiveLicense] = useState<LicenseRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm<LicenseForm>({
        id: null,
        agent_id: '',
        aseguradora_id: '',
        num_licencia: '',
        fecha_expiracion: '',
        fecha_emision: '',
        status: statusOptions[0]?.value ?? 'vigente',
        observaciones: '',
        activo: true,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const openCreateDialog = () => {
        setActiveLicense(null);
        form.reset();
        form.clearErrors();
        form.setData('status', statusOptions[0]?.value ?? 'vigente');
        form.setData('activo', true);
        setFormMode('create');
    };

    const openEditDialog = (license: LicenseRow) => {
        setActiveLicense(license);
        form.clearErrors();
        form.setData({
            id: license.id,
            agent_id: license.agent_id,
            aseguradora_id: license.aseguradora_id,
            num_licencia: license.num_licencia,
            fecha_expiracion: toDateInputValue(license.fecha_expiracion),
            fecha_emision: toDateInputValue(license.fecha_emision),
            status: license.status,
            observaciones: license.observaciones ?? '',
            activo: license.activo,
        });
        setFormMode('edit');
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(route('agent-licenses.store'), {
            onSuccess: () => {
                setFormMode(null);
                setActiveLicense(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        });
    };

    const summary = useMemo(() => {
        const activeCount = licenses.filter((license) => license.activo).length;
        const expiringCount = licenses.filter(
            (license) => license.status === 'por_vencer',
        ).length;

        return {
            total: licenses.length,
            active: activeCount,
            expiring: expiringCount,
        };
    }, [licenses]);

    const columns: DataTableColumn<LicenseRow>[] = [
        {
            key: 'num_licencia',
            header: 'Licencia',
            accessor: (row) => row.num_licencia,
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.num_licencia}</p>
                    <p className="text-xs text-muted-foreground">
                        Emisión:{' '}
                        {new Date(row.fecha_emision).toLocaleDateString(
                            'es-MX',
                        )}
                    </p>
                </div>
            ),
        },
        {
            key: 'agent',
            header: 'Agente',
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.agent.email ?? 'Sin correo'}
                    </p>
                </div>
            ),
        },
        {
            key: 'insurer',
            header: 'Aseguradora',
            cell: (row) => row.insurance_company.name,
        },
        {
            key: 'fecha_expiracion',
            header: 'Expira',
            cell: (row) =>
                new Date(row.fecha_expiracion).toLocaleDateString('es-MX'),
        },
        {
            key: 'status',
            header: 'Estado',
            cell: (row) => (
                <Badge variant={statusVariantMap[row.status] ?? 'outline'}>
                    {statusLabelMap[row.status] ?? row.status}
                </Badge>
            ),
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
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setActiveLicense(row)}
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
            <Head title="Licencias" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <IdCard className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">
                                    Licencias de agentes
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Centraliza vencimientos, estatus y
                                    aseguradora de cada licencia para reducir
                                    riesgos operativos.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nueva licencia
                        </Button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border bg-background/70 p-3">
                            <p className="text-xs text-muted-foreground">
                                Total registradas
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {summary.total}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-background/70 p-3">
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                <BadgeCheck className="size-3.5" /> Activas
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {summary.active}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-background/70 p-3">
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarClock className="size-3.5" /> Por
                                vencer
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {summary.expiring}
                            </p>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={licenses}
                    searchColumn="num_licencia"
                    searchPlaceholder="Buscar por número de licencia..."
                />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                        setActiveLicense(null);
                        form.clearErrors();
                    }
                }}
                title={
                    formMode === 'edit' ? 'Editar licencia' : 'Nueva licencia'
                }
                description="Captura los datos principales de la licencia del agente y guarda cambios en un solo flujo."
                submitLabel={
                    formMode === 'edit' ? 'Guardar cambios' : 'Guardar licencia'
                }
                processing={form.processing}
                onSubmit={submitForm}
            >
                <AgentLicenseForm
                    data={form.data}
                    errors={form.errors}
                    insuranceCompanies={insuranceCompanies}
                    statusOptions={statusOptions}
                    setData={form.setData}
                />
            </CrudFormDialog>

            <ConfirmDeleteDialog
                open={activeLicense !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setActiveLicense(null);
                    }
                }}
                entityLabel="la licencia"
                itemName={activeLicense?.num_licencia}
                processing={form.processing}
                onConfirm={() => {
                    if (!activeLicense) return;

                    router.delete(
                        route('agent-licenses.destroy', activeLicense.id),
                        {
                            onSuccess: () => setActiveLicense(null),
                            onError: () =>
                                toast.error(
                                    'No fue posible eliminar la licencia.',
                                ),
                        },
                    );
                }}
            />
        </AppLayout>
    );
}
