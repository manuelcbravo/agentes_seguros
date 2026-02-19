import { Head, router, usePage } from '@inertiajs/react';
import { Archive, ArrowRightLeft, Columns3, Eye, FolderKanban, GripVertical, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
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
    ContextMenuSeparator
} from '@/components/ui/context-menu';
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
import { useLeadActions } from '@/hooks/use-lead-actions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type LeadItem = {
    id: string;
    agent_id: string;
    first_name: string;
    last_name: string | null;
    phone: string;
    email: string | null;
    source: string;
    status: string;
    created_at: string;
};

type LeadFile = {
    id: string;
    original_name: string;
    path: string;
    url: string;
    mime_type: string | null;
    size: number;
    related_table: string;
    related_uuid: string;
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
    files: LeadFile[];
}) {
    const [boardLeads, setBoardLeads] = useState<LeadItem[]>(leads);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [activeLead, setActiveLead] = useState<LeadItem | null>(null);
    const [leadForFiles, setLeadForFiles] = useState<LeadItem | null>(null);
    const [leadToConvert, setLeadToConvert] = useState<LeadItem | null>(null);
    const [leadToArchive, setLeadToArchive] = useState<LeadItem | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const { flash } = usePage<SharedData>().props;

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
        if (!leadForFiles) return [];

        return files.filter((file) => file.related_table === FILES_TABLE_ID && file.related_uuid === leadForFiles.id);
    }, [files, leadForFiles]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: route('leads.index') },
        { title: 'Kanban', href: route('leads.kanban') },
    ];

    const getLeadActions = useLeadActions<LeadItem>({
        statusOptions,
        onView: (lead) => router.visit(route('leads.index', { search: lead.first_name })),
        onEdit: (lead) => router.visit(route('leads.index', { search: lead.first_name })),
        onDelete: (lead) => setActiveLead(lead),
        onFiles: (lead) => setLeadForFiles(lead),
        onConvert: (lead) => setLeadToConvert(lead),
        onArchive: (lead) => setLeadToArchive(lead),
        onStatusUpdated: () => toast.success('Estatus actualizado correctamente.'),
    });

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
                onSuccess: () => toast.success('Estatus actualizado correctamente.'),
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
                                    {column.leads.map((lead) => {
                                        const actions = getLeadActions(lead);

                                        return (
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
                                                <ContextMenuContent>
                                                    <ContextMenuItem onSelect={(event) => { event.preventDefault(); actions.onView(); }}>
                                                        <Eye className="mr-2 size-4" /> Ver
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onSelect={(event) => { event.preventDefault(); actions.onEdit(); }}>
                                                        <Pencil className="mr-2 size-4" /> Editar
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onSelect={(event) => { event.preventDefault(); actions.onFiles(); }}>
                                                        <FolderKanban className="mr-2 size-4" /> Archivos
                                                    </ContextMenuItem>
                                                    {actions.canConvert && (
                                                        <ContextMenuItem onSelect={(event) => { event.preventDefault(); actions.onConvert(); }}>
                                                            <UserPlus className="mr-2 size-4" /> Convertir a cliente
                                                        </ContextMenuItem>
                                                    )}
                                                    <ContextMenuSub>
                                                        <ContextMenuSubTrigger>
                                                            <ArrowRightLeft className="mr-2 size-4" /> Cambiar estatus
                                                        </ContextMenuSubTrigger>
                                                        <ContextMenuSubContent>
                                                            {actions.statusOptions.map((status) => (
                                                                <ContextMenuItem
                                                                    key={status.value}
                                                                    disabled={status.value === lead.status}
                                                                    onSelect={(event) => { event.preventDefault(); actions.moveToStatus(status.value); }}
                                                                >
                                                                    {status.label}
                                                                </ContextMenuItem>
                                                            ))}
                                                        </ContextMenuSubContent>
                                                    </ContextMenuSub>
                                                    <ContextMenuSeparator />
                                                    <ContextMenuItem onSelect={(event) => { event.preventDefault(); actions.onArchive(); }}>
                                                        <Archive className="mr-2 size-4" /> Archivar
                                                    </ContextMenuItem>
                                                    <ContextMenuItem variant="destructive" onSelect={(event) => { event.preventDefault(); actions.onDelete(); }}>
                                                        <Trash2 className="mr-2 size-4" /> Eliminar
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        );
                                    })}
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
                key={leadForFiles?.id ?? 'lead-files-kanban'}
                open={leadForFiles !== null}
                onOpenChange={(open) => !open && setLeadForFiles(null)}
                title={leadForFiles ? `Archivos · ${leadForFiles.first_name} ${leadForFiles.last_name ?? ''}` : 'Archivos'}
                description="Gestiona los archivos del lead activo (subir, descargar, renombrar o eliminar)."
                storedFiles={contextualFiles}
                tableId={FILES_TABLE_ID}
                relatedUuid={leadForFiles?.id ?? null}
                onDeleteStoredFile={(fileId) => {
                    if (!leadForFiles) return;

                    router.delete(route('files.destroy', fileId), {
                        preserveScroll: true,
                        data: {
                            related_table: FILES_TABLE_ID,
                            related_uuid: leadForFiles.id,
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


            <AlertDialog open={leadToArchive !== null} onOpenChange={(open) => !open && setLeadToArchive(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archivar lead</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Archivar este lead? Ya no aparecerá en Leads ni en Kanban.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isArchiving}
                            onClick={() => {
                                if (!leadToArchive || isArchiving) return;

                                setIsArchiving(true);
                                router.post(route('leads.archive', leadToArchive.id), undefined, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setLeadToArchive(null);
                                        setBoardLeads((current) => current.filter((lead) => lead.id !== leadToArchive.id));
                                    },
                                    onError: () => toast.error('No se pudo archivar el lead.'),
                                    onFinish: () => setIsArchiving(false),
                                });
                            }}
                        >
                            {isArchiving ? 'Archivando...' : 'Archivar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={leadToConvert !== null} onOpenChange={(open) => !open && setLeadToConvert(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Convertir lead a cliente</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto creará un cliente y marcará el lead como Ganado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (!leadToConvert) return;

                                router.post(route('leads.convertToClient', leadToConvert.id), undefined, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        toast.success('Lead convertido a cliente.');
                                        setLeadToConvert(null);
                                    },
                                    onError: () => toast.error('No se pudo convertir el lead.'),
                                });
                            }}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ConfirmDeleteDialog
                open={activeLead !== null}
                onOpenChange={(open) => !open && setActiveLead(null)}
                title="Eliminar lead"
                entityLabel="el lead"
                itemName={activeLead ? `${activeLead.first_name} ${activeLead.last_name ?? ''}`.trim() : undefined}
                onConfirm={() => {
                    if (!activeLead) return;

                    router.delete(route('leads.destroy', activeLead.id), {
                        onSuccess: () => setActiveLead(null),
                        onError: () => toast.error('No se pudo eliminar el lead.'),
                    });
                }}
            />
        </AppLayout>
    );
}
