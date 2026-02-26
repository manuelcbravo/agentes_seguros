import { Head, router } from '@inertiajs/react';
import { Download, Edit, FileText, MoreHorizontal, Paperclip } from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Person = {
    id: string;
    full_name?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    second_last_name?: string;
    rfc?: string | null;
    phone?: string | null;
    email?: string | null;
    street?: string | null;
    ext_number?: string | null;
    int_number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    birthday?: string | null;
    address?: string | null;
};

type Beneficiary = {
    id: string;
    full_name: string;
    rfc?: string | null;
    relationship?: string | null;
    percentage: number;
};

type PolicyFile = {
    id: string;
    uuid: string;
    original_name: string;
    size: number;
    created_at: string;
    url: string;
};

type PolicySheetProps = {
    policy: {
        id: string;
        policy_number?: string | null;
        status?: string | null;
        coverage_start?: string | null;
        product?: string | null;
        payment_channel?: string | null;
        periodicity?: string | null;
        currency?: string | null;
        risk_premium?: string | number | null;
        fractional_premium?: string | number | null;
    };
    contractor?: Person | null;
    insured?: Person | null;
    insuranceCompany?: { name?: string | null } | null;
    productCatalog?: { name?: string | null } | null;
    beneficiaries: Beneficiary[];
    beneficiariesTotal: number;
    files: PolicyFile[];
};

export default function PolicySheet({
    policy,
    contractor,
    insured,
    insuranceCompany,
    productCatalog,
    beneficiaries,
    beneficiariesTotal,
    files,
}: PolicySheetProps) {
    const [filesOpen, setFilesOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Pólizas', href: route('polizas.index') },
            { title: 'Ficha técnica', href: route('polizas.sheet.show', policy.id) },
        ],
        [policy.id],
    );

    const formatDate = (value?: string | null) =>
        value ? new Date(value).toLocaleDateString('es-MX') : '—';

    const formatCurrency = (value?: string | number | null) =>
        value == null
            ? '—'
            : new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: policy.currency ?? 'MXN',
              }).format(Number(value));

    const personName = (person?: Person | null) => {
        if (!person) return '—';

        return (
            person.full_name ||
            [
                person.first_name,
                person.middle_name,
                person.last_name,
                person.second_last_name,
            ]
                .filter(Boolean)
                .join(' ') ||
            '—'
        );
    };

    const contractorAddress = [
        contractor?.street,
        contractor?.ext_number,
        contractor?.int_number,
        contractor?.neighborhood,
        contractor?.city,
        contractor?.state,
        contractor?.country,
        contractor?.postal_code,
    ]
        .filter(Boolean)
        .join(', ');

    const totalPercentage = Number(Number(beneficiariesTotal ?? 0).toFixed(2));
    const isHundredPercentage = Math.abs(totalPercentage - 100) <= 0.01;

    const beneficiariesColumns: DataTableColumn<Beneficiary>[] = [
        { key: 'full_name', header: 'Beneficiario', cell: (row) => row.full_name },
        { key: 'rfc', header: 'RFC', cell: (row) => row.rfc ?? '—' },
        {
            key: 'relationship',
            header: 'Parentesco',
            cell: (row) => row.relationship ?? '—',
        },
        {
            key: 'percentage',
            header: 'Porcentaje',
            cell: (row) => `${Number(row.percentage ?? 0).toFixed(2)}%`,
        },
    ];

    const fileColumns: DataTableColumn<PolicyFile>[] = [
        {
            key: 'name',
            header: 'Nombre',
            accessor: (row) => row.original_name,
            cell: (row) => row.original_name,
        },
        {
            key: 'size',
            header: 'Tamaño',
            cell: (row) => `${Math.max(1, Math.round(row.size / 1024))} KB`,
        },
        {
            key: 'date',
            header: 'Fecha',
            cell: (row) => formatDate(row.created_at),
        },
        {
            key: 'actions',
            header: 'Acciones',
            cell: (row) => (
                <div className="flex gap-3">
                    <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                    >
                        Ver
                    </a>
                    <a href={row.url} download className="text-primary underline">
                        Descargar
                    </a>
                </div>
            ),
        },
    ];

    const subtitle = [insuranceCompany?.name, productCatalog?.name ?? policy.product]
        .filter(Boolean)
        .join(' · ');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ficha técnica — ${policy.policy_number ?? 'Sin número'}`} />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold">
                                Ficha técnica — {policy.policy_number ?? 'Sin número'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {subtitle || 'Sin aseguradora/producto'} · Vigencia desde{' '}
                                {formatDate(policy.coverage_start)}
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <MoreHorizontal className="mr-2 size-4" /> Acciones
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.visit(route('polizas.wizard.edit', policy.id))
                                    }
                                >
                                    <Edit className="mr-2 size-4" /> Editar / Abrir wizard
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Download className="mr-2 size-4" />
                                    Imprimir / Exportar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilesOpen(true)}>
                                    <Paperclip className="mr-2 size-4" /> Ver archivos
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de póliza</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                        <KeyValue label="Número de póliza" value={policy.policy_number} />
                        <KeyValue label="Aseguradora" value={insuranceCompany?.name} />
                        <KeyValue
                            label="Producto / Plan"
                            value={productCatalog?.name ?? policy.product}
                        />
                        <KeyValue label="Estatus" value={policy.status} />
                        <KeyValue label="Moneda" value={policy.currency} />
                        <KeyValue
                            label="Forma de pago / Frecuencia"
                            value={`${policy.payment_channel ?? '—'} / ${policy.periodicity ?? '—'}`}
                        />
                        <KeyValue
                            label="Vigencia desde"
                            value={formatDate(policy.coverage_start)}
                        />
                        <KeyValue label="Vigencia hasta" value="—" />
                        <KeyValue label="Prima total" value={formatCurrency(policy.fractional_premium)} />
                        <KeyValue label="Prima neta" value={formatCurrency(policy.risk_premium)} />
                        <KeyValue label="IVA" value="—" />
                        <KeyValue label="Derechos / recargos" value="—" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contratante</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                        <KeyValue label="Nombre completo" value={personName(contractor)} />
                        <KeyValue label="RFC" value={contractor?.rfc} />
                        <KeyValue label="Teléfono" value={contractor?.phone} />
                        <KeyValue label="Email" value={contractor?.email} />
                        <KeyValue
                            label="Dirección"
                            value={contractorAddress || '—'}
                            className="md:col-span-2"
                        />
                        {contractor?.id && (
                            <div className="md:col-span-2">
                                <Button
                                    variant="link"
                                    className="h-auto px-0"
                                    onClick={() =>
                                        router.visit(route('clients.profile', contractor.id))
                                    }
                                >
                                    Ver cliente
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Asegurado</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                        <KeyValue label="Nombre completo" value={personName(insured)} />
                        <KeyValue label="RFC" value={insured?.rfc} />
                        <KeyValue label="Fecha nacimiento" value={formatDate(insured?.birthday)} />
                        <KeyValue label="Teléfono" value={insured?.phone} />
                        <KeyValue label="Email" value={insured?.email} />
                        <KeyValue label="Dirección" value={insured?.address} className="md:col-span-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Beneficiarios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span>Total porcentaje: {totalPercentage.toFixed(2)}%</span>
                            <Badge variant={isHundredPercentage ? 'default' : 'destructive'}>
                                {isHundredPercentage ? '100% válido' : 'Revisar distribución'}
                            </Badge>
                        </div>
                        <DataTable
                            columns={beneficiariesColumns}
                            data={beneficiaries}
                            emptyMessage="No hay beneficiarios registrados."
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Coberturas / sumas aseguradas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coberturas (pendiente de capturar).
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Archivos de la póliza</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" onClick={() => setFilesOpen(true)}>
                            <FileText className="mr-2 size-4" /> Adjuntar archivos
                        </Button>
                        <DataTable
                            columns={fileColumns}
                            data={files}
                            emptyMessage="No hay archivos asociados."
                        />
                    </CardContent>
                </Card>
            </div>

            <FilePickerDialog
                open={filesOpen}
                onOpenChange={setFilesOpen}
                title="Archivos de póliza"
                tableId="policies"
                relatedUuid={policy.id}
                storedFiles={files}
            />
        </AppLayout>
    );
}

function KeyValue({
    label,
    value,
    className,
}: {
    label: string;
    value?: string | number | null;
    className?: string;
}) {
    return (
        <div className={className}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value || '—'}</p>
        </div>
    );
}
