import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Columns, Filter, Plus, Trophy, UserRoundX, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { LeadsTable, type LeadRow } from '@/components/leads/leads-table';
import { LeadStatusBadge } from '@/components/leads/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLeadActions } from '@/hooks/use-lead-actions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type PaginatedLeads = {
    data: LeadRow[];
    current_page: number;
    last_page: number;
    total: number;
};

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

type LeadForm = {
    id: number | null;
    agent_id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    source: string;
    status?: string;
};

const iconByTitle: Record<string, typeof Users> = {
    Leads: Users,
    'Leads ganados': Trophy,
    'Leads no interesados': UserRoundX,
};

const FILES_TABLE_ID = 'leads';

export default function LeadsIndex({
    leads,
    agents,
    filters,
    statusOptions,
    sourceOptions,
    title,
    fixedStatus,
    files,
}: {
    leads: PaginatedLeads;
    agents: Array<{ id: string; name: string }>;
    filters: { search: string; status: string | null; agent_id: string | null };
    statusOptions: Array<{ value: string; label: string }>;
    sourceOptions: Array<{ value: string; label: string }>;
    title: string;
    fixedStatus: string | null;
    files: MediaFile[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [agentId, setAgentId] = useState(filters.agent_id ?? '');
    const [activeLead, setActiveLead] = useState<LeadRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view' | null>(null);
    const { flash } = usePage<SharedData>().props;
    const { filesLead, setFilesLead, convertLead, setConvertLead, moveLead, convertToClient } = useLeadActions(() => toast.success('Estatus actualizado correctamente.'));

    const form = useForm<LeadForm>({
        id: null,
        agent_id: agentId,
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        source: 'facebook',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [{ title, href: route('leads.index') }], [title]);

    const CurrentIcon = iconByTitle[title] ?? Users;

    const contextualFiles = useMemo(() => {
        if (!filesLead) return [];

        return files.filter((file) => file.related_table === FILES_TABLE_ID && file.related_uuid === filesLead.uuid);
    }, [files, filesLead]);

    const applyFilters = (page = 1) => {
        router.get(
            routeByTitle(title),
            {
                search,
                status: fixedStatus ?? (status || undefined),
                agent_id: agentId || undefined,
                page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openCreateDialog = () => {
        setActiveLead(null);
        form.reset();
        form.clearErrors();
        form.setData('agent_id', agentId);
        setFormMode('create');
    };

    const openEditDialog = (lead: LeadRow, mode: 'edit' | 'view' = 'edit') => {
        setActiveLead(lead);
        form.clearErrors();
        form.setData({
            id: lead.id,
            agent_id: lead.agent_id,
            first_name: lead.first_name,
            last_name: lead.last_name ?? '',
            phone: lead.phone,
            email: lead.email ?? '',
            source: lead.source,
            status: lead.status,
        });
        setFormMode(mode);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <div className="space-y-4 rounded-xl p-4">
                <Card className="border-sidebar-border/70 bg-sidebar-accent/20">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                            <CurrentIcon className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">{title}</h1>
                                <p className="text-sm text-muted-foreground">Embudo comercial con acciones rápidas, filtros y control de estatus.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => router.visit(route('leads.kanban'))}>
                                <Columns className="mr-2 size-4" /> Kanban
                            </Button>
                            <Button onClick={openCreateDialog}>
                                <Plus className="mr-2 size-4" /> Nuevo lead
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-3 p-4">
                        <div className="grid gap-3 md:grid-cols-4">
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o teléfono..." />
                            <select
                                value={fixedStatus ?? status}
                                onChange={(event) => setStatus(event.target.value)}
                                disabled={Boolean(fixedStatus)}
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Todos los estatus</option>
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select value={agentId} onChange={(event) => setAgentId(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                                <option value="">Todos los agentes</option>
                                {agents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.name}
                                    </option>
                                ))}
                            </select>
                            <Button onClick={() => applyFilters()}>
                                <Filter className="mr-2 size-4" /> Aplicar filtros
                            </Button>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
                            <p className="text-muted-foreground">Total de registros: {leads.total}</p>
                            {fixedStatus && <LeadStatusBadge status={fixedStatus} />}
                        </div>
                    </CardContent>
                </Card>

                <LeadsTable
                    data={leads.data}
                    statusOptions={statusOptions}
                    onEdit={(lead) => openEditDialog(lead, 'edit')}
                    onView={(lead) => openEditDialog(lead, 'view')}
                    onDelete={(lead) => setActiveLead(lead)}
                    onOpenFiles={(lead) => setFilesLead(lead)}
                    onConvertToClient={(lead) => setConvertLead(lead)}
                    onMoveLead={moveLead}
                />

                <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">Página actual: {leads.current_page}</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={leads.current_page <= 1} onClick={() => applyFilters(leads.current_page - 1)}>
                            Anterior
                        </Button>
                        <Badge variant="outline">
                            {leads.current_page} / {leads.last_page}
                        </Badge>
                        <Button variant="outline" size="sm" disabled={leads.current_page >= leads.last_page} onClick={() => applyFilters(leads.current_page + 1)}>
                            Siguiente
                        </Button>
                    </div>
                </div>
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                        form.clearErrors();
                        setActiveLead(null);
                    }
                }}
                title={formMode === 'edit' ? 'Editar lead' : formMode === 'view' ? 'Detalle de lead' : 'Nuevo lead'}
                description="Mantén actualizado el pipeline con información precisa y accionable."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar lead'}
                hideFooter={formMode === 'view'}
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route('leads.store'), {
                        onSuccess: () => {
                            setFormMode(null);
                            setActiveLead(null);
                            form.reset();
                        },
                        onError: () => toast.error('Verifica los campos marcados.'),
                    });
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="lead-first-name">Nombre</Label>
                        <Input id="lead-first-name" value={form.data.first_name} disabled={formMode === 'view'} onChange={(event) => form.setData('first_name', event.target.value)} />
                        {form.errors.first_name && <FieldError>{form.errors.first_name}</FieldError>}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-last-name">Apellido</Label>
                        <Input id="lead-last-name" value={form.data.last_name} disabled={formMode === 'view'} onChange={(event) => form.setData('last_name', event.target.value)} />
                        {form.errors.last_name && <FieldError>{form.errors.last_name}</FieldError>}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-phone">Teléfono</Label>
                        <Input id="lead-phone" value={form.data.phone} disabled={formMode === 'view'} onChange={(event) => form.setData('phone', event.target.value)} />
                        {form.errors.phone && <FieldError>{form.errors.phone}</FieldError>}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-email">Correo</Label>
                        <Input id="lead-email" value={form.data.email} disabled={formMode === 'view'} onChange={(event) => form.setData('email', event.target.value)} />
                        {form.errors.email && <FieldError>{form.errors.email}</FieldError>}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-source">Fuente</Label>
                        <select id="lead-source" value={form.data.source} disabled={formMode === 'view'} onChange={(event) => form.setData('source', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                            {sourceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {form.errors.source && <FieldError>{form.errors.source}</FieldError>}
                    </Field>

                    {formMode !== 'create' && (
                        <Field>
                            <Label htmlFor="lead-status">Estatus</Label>
                            <select id="lead-status" value={form.data.status} disabled={formMode === 'view'} onChange={(event) => form.setData('status', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {form.errors.status && <FieldError>{form.errors.status}</FieldError>}
                        </Field>
                    )}

                    <Field className="md:col-span-2">
                        <Label htmlFor="lead-agent">Agente</Label>
                        <select id="lead-agent" value={form.data.agent_id} disabled={formMode === 'view'} onChange={(event) => form.setData('agent_id', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                            <option value="">Selecciona agente</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                        </select>
                        {form.errors.agent_id && <FieldError>{form.errors.agent_id}</FieldError>}
                    </Field>
                </div>
            </CrudFormDialog>

            <FilePickerDialog
                key={filesLead?.id ?? 'lead-files-manager'}
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

            <ConfirmDeleteDialog
                open={formMode === null && activeLead !== null}
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

function routeByTitle(title: string): string {
    if (title === 'Leads ganados') return route('leads.ganados');
    if (title === 'Leads no interesados') return route('leads.no-interesados');

    return route('leads.index');
}
