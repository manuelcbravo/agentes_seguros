import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Archive, Columns, Filter, Plus, Trophy, UserRoundX, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { LeadsTable, type LeadRow } from '@/components/leads/leads-table';
import { LeadStatusBadge } from '@/components/leads/status-badge';
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
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type PaginatedLeads = {
    data: LeadRow[];
    current_page: number;
    last_page: number;
    total: number;
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

type LeadForm = {
    id: string | null;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    source: string;
    status: string;
};

const iconByTitle: Record<string, typeof Users> = {
    Leads: Users,
    'Leads ganados': Trophy,
    'Leads no interesados': UserRoundX,
};

const FILES_TABLE_ID = 'leads';

export default function LeadsIndex({
    leads,
    filters,
    statusOptions,
    sourceOptions,
    title,
    fixedStatus,
    files,
}: {
    leads: PaginatedLeads;
    filters: { search: string; status: string | null };
    statusOptions: Array<{ value: string; label: string }>;
    sourceOptions: Array<{ value: string; label: string }>;
    title: string;
    fixedStatus: string | null;
    files: LeadFile[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [activeLead, setActiveLead] = useState<LeadRow | null>(null);
    const [leadForFiles, setLeadForFiles] = useState<LeadRow | null>(null);
    const [leadToConvert, setLeadToConvert] = useState<LeadRow | null>(null);
    const [leadToArchive, setLeadToArchive] = useState<LeadRow | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view' | null>(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm<LeadForm>({
        id: null,
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        source: 'facebook',
        status: fixedStatus ?? 'nuevo',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [{ title, href: route('leads.index') }], [title]);
    const CurrentIcon = iconByTitle[title] ?? Users;

    const contextualFiles = useMemo(() => {
        if (!leadForFiles) return [];

        return files.filter((file) => file.related_table === FILES_TABLE_ID && file.related_uuid === leadForFiles.id);
    }, [files, leadForFiles]);

    const applyFilters = (page = 1) => {
        router.get(
            routeByTitle(title),
            {
                search,
                status: fixedStatus ?? (status || undefined),
                page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openCreateDialog = () => {
        setActiveLead(null);
        form.reset();
        form.clearErrors();
        form.setData('status', fixedStatus ?? 'nuevo');
        setFormMode('create');
    };

    const openEditDialog = (lead: LeadRow, mode: 'edit' | 'view' = 'edit') => {
        setActiveLead(lead);
        form.clearErrors();
        form.setData({
            id: lead.id,
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
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <CurrentIcon className="size-5 text-primary" />
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-semibold">{title}</h1>
                                    {fixedStatus && <LeadStatusBadge status={fixedStatus} />}
                                </div>
                                <p className="text-sm text-muted-foreground">Gestiona tu pipeline con filtros y acciones rapidas.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => router.visit(route('leads.kanban'))}>
                                <Columns className="mr-2 size-4" /> Kanban
                            </Button>
                            <Button variant="outline" onClick={() => router.visit(route('leads.archived.index'))}>
                                <Archive className="mr-2 size-4" /> Archivados
                            </Button>
                            <Button onClick={openCreateDialog}>
                                <Plus className="mr-2 size-4" /> Nuevo lead
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o telefono..." />
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
                            <Button onClick={() => applyFilters()}>
                                <Filter className="mr-2 size-4" /> Aplicar filtros
                            </Button>
                        </div>
                    </div>
                </div>

                <LeadsTable
                    data={leads.data}
                    statusOptions={statusOptions}
                    onEdit={(lead) => openEditDialog(lead, 'edit')}
                    onView={(lead) => openEditDialog(lead, 'view')}
                    onFiles={setLeadForFiles}
                    onConvert={setLeadToConvert}
                    onDelete={(lead) => setActiveLead(lead)}
                    onArchive={(lead) => setLeadToArchive(lead)}
                    onStatusUpdated={() => toast.success('Estatus actualizado correctamente.')}
                />
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
                description="Manten actualizado el pipeline con informacion precisa y accionable."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar lead'}
                hideFooter={formMode === 'view'}
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => {
                        if (formMode === 'create') {
                            const { status, ...payload } = data;

                            return payload;
                        }

                        return data;
                    });
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
                        <Label htmlFor="lead-phone">Telefono</Label>
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
                        <select
                            id="lead-source"
                            value={form.data.source}
                            disabled={formMode === 'view'}
                            onChange={(event) => form.setData('source', event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {sourceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {form.errors.source && <FieldError>{form.errors.source}</FieldError>}
                    </Field>
                    {formMode !== 'create' && (
                        <>
                            <Field>
                                <Label htmlFor="lead-status">Estatus</Label>
                                <select
                                    id="lead-status"
                                    value={form.data.status}
                                    disabled={formMode === 'view'}
                                    onChange={(event) => form.setData('status', event.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.status && <FieldError>{form.errors.status}</FieldError>}
                            </Field>
                        </>
                    )}
                </div>
            </CrudFormDialog>

            <FilePickerDialog
                key={leadForFiles?.id ?? 'lead-files'}
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
                                        router.reload({ only: ['leads', 'flash'] });
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
