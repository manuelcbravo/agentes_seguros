import {
    Activity,
    Archive,
    ArrowRightLeft,
    Eye,
    FolderKanban,
    MoreHorizontal,
    Pencil,
    RotateCcw,
    Trash2,
    UserPlus,
} from 'lucide-react';
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
import { useLeadActions } from '@/hooks/use-lead-actions';

export type LeadRow = {
    id: string;
    agent_id: string;
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
    onFiles: (lead: LeadRow) => void;
    onConvert: (lead: LeadRow) => void;
    onTracking: (lead: LeadRow) => void;
    onArchive?: (lead: LeadRow) => void;
    onUnarchive?: (lead: LeadRow) => void;
    mode?: 'default' | 'archived';
    onStatusUpdated?: () => void;
};

const sourceLabel: Record<string, string> = {
    facebook: 'Facebook',
    google: 'Google',
    whatsapp: 'WhatsApp',
    referral: 'Referido',
    landing: 'Landing',
    other: 'Otro',
};

export function LeadsTable({
    data,
    statusOptions,
    onEdit,
    onDelete,
    onView,
    onFiles,
    onConvert,
    onTracking,
    onArchive,
    onUnarchive,
    mode = 'default',
    onStatusUpdated,
}: Props) {
    const getLeadActions = useLeadActions({
        statusOptions,
        onView,
        onEdit,
        onDelete,
        onFiles,
        onConvert,
        onArchive,
        onUnarchive,
        onStatusUpdated,
    });

    const columns: DataTableColumn<LeadRow>[] = [
        {
            key: 'full_name',
            header: 'Lead',
            accessor: (row) =>
                `${row.first_name} ${row.last_name ?? ''}`.trim(),
            cell: (row) => (
                <div>
                    <p className="font-medium">
                        {`${row.first_name} ${row.last_name ?? ''}`.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Alta{' '}
                        {new Date(row.created_at).toLocaleDateString('es-MX')}
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                        {row.email ?? 'Sin correo'}
                    </p>
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
            cell: (row) => {
                const actions = getLeadActions(row);

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    actions.onView();
                                }}
                            >
                                <Eye className="mr-2 size-4" /> Ver
                            </DropdownMenuItem>
                            {mode !== 'archived' && (
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        actions.onEdit();
                                    }}
                                >
                                    <Pencil className="mr-2 size-4" /> Editar
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    actions.onFiles();
                                }}
                            >
                                <FolderKanban className="mr-2 size-4" />{' '}
                                Archivos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    onTracking(row);
                                }}
                            >
                                <Activity className="mr-2 size-4" /> Seguimiento
                            </DropdownMenuItem>
                            {mode !== 'archived' && actions.canConvert && (
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        actions.onConvert();
                                    }}
                                >
                                    <UserPlus className="mr-2 size-4" />{' '}
                                    Convertir a cliente
                                </DropdownMenuItem>
                            )}
                            {mode !== 'archived' && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <ArrowRightLeft className="mr-2 size-4" />{' '}
                                        Cambiar estatus
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {actions.statusOptions.map((status) => (
                                            <DropdownMenuItem
                                                key={status.value}
                                                disabled={
                                                    status.value === row.status
                                                }
                                                onSelect={(event) => {
                                                    event.preventDefault();
                                                    actions.moveToStatus(
                                                        status.value,
                                                    );
                                                }}
                                            >
                                                {status.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}
                            <DropdownMenuSeparator />
                            {mode === 'archived' ? (
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        actions.onUnarchive();
                                    }}
                                >
                                    <RotateCcw className="mr-2 size-4" />{' '}
                                    Restaurar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        actions.onArchive();
                                    }}
                                >
                                    <Archive className="mr-2 size-4" /> Archivar
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={(event) => {
                                    event.preventDefault();
                                    actions.onDelete();
                                }}
                            >
                                <Trash2 className="mr-2 size-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return <DataTable columns={columns} data={data} />;
}
