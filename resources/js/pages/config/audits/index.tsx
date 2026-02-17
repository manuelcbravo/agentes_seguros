import { Head } from '@inertiajs/react';
import { ClipboardList, MoreHorizontal } from 'lucide-react';
import { route } from 'ziggy-js';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AuditRow = {
    id: number;
    event: string;
    auditable_type: string;
    auditable_id: number;
    user_type: string | null;
    user_id: number | null;
    created_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Configuración', href: route('config.audits.index') },
    { title: 'Auditoría', href: route('config.audits.index') },
];

export default function AuditsIndex({ audits }: { audits: AuditRow[] }) {
    const columns: DataTableColumn<AuditRow>[] = [
        {
            key: 'event',
            header: 'Evento',
            accessor: (row) => row.event,
            cell: (row) => row.event,
        },
        {
            key: 'auditable_type',
            header: 'Modelo',
            cell: (row) => row.auditable_type.split('\\').pop(),
        },
        { key: 'auditable_id', header: 'ID Modelo', cell: (row) => row.auditable_id },
        { key: 'user_id', header: 'Usuario', cell: (row) => row.user_id ?? '-' },
        {
            key: 'created_at',
            header: 'Fecha',
            cell: (row) => new Date(row.created_at).toLocaleString('es-MX'),
        },
        {
            key: 'actions',
            header: '',
            className: 'w-14',
            cell: () => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Auditoría" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="size-5 text-primary" />
                        <div>
                            <h1 className="text-xl font-semibold">Auditoría</h1>
                            <p className="text-sm text-muted-foreground">
                                Consulta cambios críticos para trazabilidad y control.
                            </p>
                        </div>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={audits}
                    searchColumn="event"
                    searchPlaceholder="Buscar evento..."
                />
            </div>
        </AppLayout>
    );
}
