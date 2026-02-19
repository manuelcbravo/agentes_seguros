import { Head, router, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Columns3, Eye, FolderKanban, GripVertical, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { LeadStatusBadge, statusLabel } from '@/components/leads/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useLeadActions } from '@/hooks/use-lead-actions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type MediaFile = {
    id: number;
    uuid: string;
    original_name: string;
    path: string;
    url: string;
    mime_type: string | null;
    size: number;
    related_table: string;
    related_uuid: string | null;
};

type LeadItem = {
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
};

const FILES_TABLE_ID = 'leads';

export default function LeadsKanban({
    leads,
    boardStatuses,
    statusOptions,
    files,
}: {
    leads: LeadItem[];
    boardStatuses: string[];
    statusOptions: Array<{ value: string; label: string }>;
    files: MediaFile[];
}) {
    const [boardLeads, setBoardLeads] = useState<LeadItem[]>(leads);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const { flash } = usePage<SharedData>().props;
    const { filesLead, setFilesLead, convertLead, setConvertLead, moveLead, convertToClient } = useLeadActions(() => {
        toast.success('Estatus actualizado correctamente.');
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const grouped = useMemo(
        () =>
            boardStatuses.map((status) => ({
                status,
                leads: boardLeads.filter((lead) => lead.status === status),
            })),
        [boardLeads, boardStatuses],
    );

    const contextualFiles = useMemo(() => {
        if (!filesLead) return [];

        return files.filter((file) => file.related_table === FILES_TABLE_ID && file.related_uuid === filesLead.uuid);
    }, [files, filesLead]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: route('leads.index') },
        { title: 'Kanban', href: route('leads.kanban') },
    ];

    const onDropLead = (status: string) => {
        if (!draggedId) return;

        const previous = boardLeads;
        const draggedLead = boardLeads.find((lead) => lead.id === draggedId);

        if (!draggedLead || draggedLead.status === status) {
            setDraggedId(null);
            return;
        }

        setBoardLeads((current) => current.map((lead) => (lead.id === draggedId ? { ...lead, status } : lead)));
        setDraggedId(null);

        router.patch(
            route('leads.update-status', draggedId),
            { status },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Lead movido correctamente.'),
                onError: () => {
                    setBoardLeads(previous);
                    toast.error('No se pudo mover el lead.');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leads · Kanban" />

            <div className="space-y-4 rounded-xl p-4">
                <Card className="border-sidebar-border/70 bg-sidebar-accent/20">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <Columns3 className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">Kanban de Leads</h1>
                                <p className="text-sm text-muted-foreground">Pipeline comercial con arrastrar y soltar para mover cada oportunidad.</p>
                            </div>
                        </div>
                        <Button onClick={() => router.visit(route('leads.index'))}>Ir a listado</Button>
                    </CardContent>
                </Card>

                <div className="overflow-x-auto pb-3">
                    <div className="flex min-w-max gap-4">
                        {grouped.map((column) => (
                            <Card
                                key={column.status}
                                className="w-80 border-sidebar-border/70 bg-muted/20"
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => onDropLead(column.status)}
                            >
                                <CardHeader className="border-b pb-3">
                                    <CardTitle className="flex items-center justify-between text-sm">
                                        <span>{statusLabel(column.status)}</span>
                                        <Badge variant="outline">{column.leads.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-3">
                                    {column.leads.map((lead) => (
                                        <ContextMenu key={lead.id}>
                                            <ContextMenuTrigger asChild>
                                                <article
                                                    draggable
                                                    onDragStart={() => setDraggedId(lead.id)}
                                                    className="cursor-grab rounded-lg border bg-card p-3 shadow-sm transition hover:shadow"
                                                >
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <p className="text-sm font-semibold">{`${lead.first_name} ${lead.last_name ?? ''}`.trim()}</p>
                                                        <GripVertical className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                                    <p className="text-xs text-muted-foreground">{lead.email ?? 'Sin correo'}</p>
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <LeadStatusBadge status={lead.status} />
                                                        <span className="text-[11px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString('es-MX')}</span>
                                                    </div>
                                                </article>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent className="w-56">
                                                <ContextMenuItem onClick={() => router.visit(route('leads.index'))}>
                                                    <Eye className="mr-2 size-4" /> Ver / Editar
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => setFilesLead(lead)}>
                                                    <FolderKanban className="mr-2 size-4" /> Archivos
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => setConvertLead(lead)} disabled={lead.status === 'ganado'}>
                                                    <RefreshCw className="mr-2 size-4" /> Convertir a cliente
                                                </ContextMenuItem>
                                                <ContextMenuSub>
                                                    <ContextMenuSubTrigger>
                                                        <ArrowRightLeft className="mr-2 size-4" /> Cambiar estatus
                                                    </ContextMenuSubTrigger>
                                                    <ContextMenuSubContent className="w-52">
                                                        {statusOptions.map((status) => (
                                                            <ContextMenuItem
                                                                key={status.value}
                                                                disabled={status.value === lead.status}
                                                                onClick={() => {
                                                                    setBoardLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status: status.value } : item)));
                                                                    moveLead(lead.id, status.value);
                                                                }}
                                                            >
                                                                {status.label}
                                                            </ContextMenuItem>
                                                        ))}
                                                    </ContextMenuSubContent>
                                                </ContextMenuSub>
                                                <ContextMenuItem variant="destructive" onClick={() => router.delete(route('leads.destroy', lead.id))}>
                                                    <Trash2 className="mr-2 size-4" /> Eliminar
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    ))}
                                    {column.leads.length === 0 && (
                                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                                            Arrastra leads aquí para continuar el flujo.
                                        </div>
                                    )}
                                    <Button variant="ghost" className="w-full justify-start" onClick={() => router.visit(route('leads.index'))}>
                                        <Plus className="mr-2 size-4" /> Crear lead en esta etapa
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <FilePickerDialog
                key={filesLead?.id ?? 'kanban-lead-files-manager'}
                open={filesLead !== null}
                onOpenChange={(open) => {
                    if (!open) setFilesLead(null);
                }}
                title={filesLead ? `Archivos · ${filesLead.first_name} ${filesLead.last_name ?? ''}` : 'Archivos'}
                description="Gestiona solo los archivos del lead activo para evitar cruces entre registros."
                storedFiles={contextualFiles}
                tableId={FILES_TABLE_ID}
                relatedUuid={filesLead?.uuid ?? null}
                onDeleteStoredFile={(fileId) => {
                    if (!filesLead) return;

                    router.delete(route('files.destroy', fileId), {
                        preserveScroll: true,
                        data: {
                            related_table: FILES_TABLE_ID,
                            related_uuid: filesLead.uuid,
                        },
                        onError: () => toast.error('No se pudo eliminar el archivo.'),
                    });
                }}
                onDownloadStoredFile={(file) => {
                    window.open(file.url, '_blank', 'noopener,noreferrer');
                }}
                accept="*/*"
                maxSizeHint="Cualquier formato · máximo 10MB"
            />

            <Dialog open={convertLead !== null} onOpenChange={(open) => !open && setConvertLead(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convertir a cliente</DialogTitle>
                        <DialogDescription>
                            Esto creará un cliente y marcará el lead como Ganado.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConvertLead(null)}>Cancelar</Button>
                        <Button onClick={convertToClient}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
