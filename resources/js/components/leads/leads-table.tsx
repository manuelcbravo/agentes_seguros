import { ArrowRightLeft, Eye, FolderKanban, MoreHorizontal, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { LeadStatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type LeadRow = {
    id: number;
    uuid: string;
    agent_id: string;
    client_id?: string | null;
    first_name: string;
    last_name: string | null;
    phone: string;
    email: string | null;
    source: string;
    status: string;
    created_at: string;
    agent?: { id: string; name: string } | null;
};

type Props = {
    data: LeadRow[];
    statusOptions: Array<{ value: string; label: string }>;
    onEdit: (lead: LeadRow) => void;
    onDelete: (lead: LeadRow) => void;
    onView: (lead: LeadRow) => void;
    onOpenFiles: (lead: LeadRow) => void;
    onConvertToClient: (lead: LeadRow) => void;
    onMoveLead: (leadId: number, status: string) => void;
};

const sourceLabel: Record<string, string> = {
    facebook: 'Facebook',
    google: 'Google',
    whatsapp: 'WhatsApp',
    referral: 'Referido',
    landing: 'Landing',
    other: 'Otro',
};

export function LeadsTable({ data, statusOptions, onEdit, onDelete, onView, onOpenFiles, onConvertToClient, onMoveLead }: Props) {
    const columns: DataTableColumn<LeadRow>[] = [
        {
            key: 'full_name',
            header: 'Lead',
            accessor: (row) => `${row.first_name} ${row.last_name ?? ''}`.trim(),
            cell: (row) => (
                <div>
                    <p className="font-medium">{`${row.first_name} ${row.last_name ?? ''}`.trim()}</p>
                    <p className="text-xs text-muted-foreground">Alta {new Date(row.created_at).toLocaleDateString('es-MX')}</p>
                </div>
            ),
        },
        {
            key: 'phone',
            header: 'Contacto',
            accessor: (row) => row.phone,
            cell: (row) => (
                <div>
                    <p>{row.phone}</p>
                    <p className="text-xs text-muted-foreground">{row.email ?? 'Sin correo'}</p>
                </div>
            ),
        },
        {
            key: 'source',
            header: 'Fuente',
            accessor: (row) => row.source,
            cell: (row) => sourceLabel[row.source] ?? row.source,
        },
        {
            key: 'status',
            header: 'Estatus',
            accessor: (row) => row.status,
            cell: (row) => <LeadStatusBadge status={row.status} />,
        },
        {
            key: 'agent',
            header: 'Agente',
            accessor: (row) => row.agent?.name ?? '',
            cell: (row) => row.agent?.name ?? '—',
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
                        <DropdownMenuItem onClick={() => onView(row)}>
                            <Eye className="mr-2 size-4" /> Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(row)}>
                            <Pencil className="mr-2 size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenFiles(row)}>
                            <FolderKanban className="mr-2 size-4" /> Archivos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onConvertToClient(row)} disabled={row.status === 'ganado'}>
                            <RefreshCw className="mr-2 size-4" /> Convertir a cliente
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <ArrowRightLeft className="mr-2 size-4" /> Cambiar estatus
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {statusOptions.map((status) => (
                                    <DropdownMenuItem
                                        key={status.value}
                                        disabled={status.value === row.status}
                                        onClick={() => onMoveLead(row.id, status.value)}
                                    >
                                        {status.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
                            <Trash2 className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return <DataTable columns={columns} data={data} searchColumn="full_name" searchPlaceholder="Filtrar resultados de la página..." />;
}
