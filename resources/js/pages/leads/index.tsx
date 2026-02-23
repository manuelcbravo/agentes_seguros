import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Archive,
    Columns,
    Filter,
    Plus,
    Trophy,
    UserRoundX,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { LeadsTable, type LeadRow } from '@/components/leads/leads-table';
import { LeadStatusBadge } from '@/components/leads/status-badge';
import { TrackingDrawer } from '@/components/tracking/TrackingDrawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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
    middle_name: string;
    last_name: string;
    second_last_name: string;
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
    trackingCatalogs,
}: {
    leads: PaginatedLeads;
    filters: { search: string; status: string | null };
    statusOptions: Array<{ value: string; label: string }>;
    sourceOptions: Array<{ value: string; label: string }>;
    title: string;
    fixedStatus: string | null;
    files: LeadFile[];
    trackingCatalogs: {
        activityTypes: Array<{ id: number; key: string; name: string }>;
        channels: Array<{ id: number; key: string; name: string }>;
        statuses: Array<{ id: number; key: string; name: string }>;
        priorities: Array<{ id: number; key: string; name: string }>;
        outcomes: Array<{ id: number; key: string; name: string }>;
    };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [activeLead, setActiveLead] = useState<LeadRow | null>(null);
    const [leadForFiles, setLeadForFiles] = useState<LeadRow | null>(null);
    const [leadToConvert, setLeadToConvert] = useState<LeadRow | null>(null);
    const [leadToArchive, setLeadToArchive] = useState<LeadRow | null>(null);
    const [leadForTracking, setLeadForTracking] = useState<LeadRow | null>(
        null,
    );
    const [isArchiving, setIsArchiving] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view' | null>(
        null,
    );
    const { flash } = usePage<SharedData>().props;

    const form = useForm<LeadForm>({
        id: null,
        first_name: '',
        middle_name: '',
        last_name: '',
        second_last_name: '',
        phone: '',
        email: '',
        source: 'facebook',
        status: fixedStatus ?? 'nuevo',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title, href: route('leads.index') }],
        [title],
    );
    const CurrentIcon = iconByTitle[title] ?? Users;

    const contextualFiles = useMemo(() => {
        if (!leadForFiles) return [];

        return files.filter(
            (file) =>
                file.related_table === FILES_TABLE_ID &&
                file.related_uuid === leadForFiles.id,
        );
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
            middle_name: lead.middle_name ?? '',
            last_name: lead.last_name ?? '',
            second_last_name: lead.second_last_name ?? '',
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
                                    <h1 className="text-xl font-semibold">
                                        {title}
                                    </h1>
                                    {fixedStatus && (
                                        <LeadStatusBadge status={fixedStatus} />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona tu pipeline con filtros y acciones
                                    rapidas.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.visit(route('leads.kanban'))
                                }
                            >
                                <Columns className="mr-2 size-4" /> Kanban
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.visit(route('leads.archived.index'))
                                }
                            >
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
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar por nombre, correo o telefono..."
                            />
                            <Combobox
                                itemToStringLabel={(value) => !value ? 'Todos los estatus' : (statusOptions.find((option) => option.value === value)?.label ?? '')}
                                value={fixedStatus ?? status}
                                onValueChange={(value) => setStatus(value ?? '')}
                                disabled={Boolean(fixedStatus)}
                            >
                                <ComboboxInput
                                    className="w-full"
                                    placeholder="Seleccione estatus"
                                    aria-label="Estatus"
                                    disabled={Boolean(fixedStatus)}
                                />
                                <ComboboxContent>
                                    <ComboboxList>
                                        <ComboboxEmpty>No se encontraron estatus.</ComboboxEmpty>
                                        <ComboboxItem value="">Todos los estatus</ComboboxItem>
                                        {statusOptions.map((option) => (
                                            <ComboboxItem key={option.value} value={option.value}>
                                                {option.label}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <Button onClick={() => applyFilters()}>
                                <Filter className="mr-2 size-4" /> Aplicar
                                filtros
                            </Button>
                        </div>
                    </div>
                </div>

                <LeadsTable
                    data={leads.data}
                    statusOptions={statusOptions}
                    onEdit={(lead) => {
                        openEditDialog(lead, 'edit');
                        setLeadForTracking(lead);
                    }}
                    onView={(lead) => {
                        router.get(route('leads.profile.show', lead.id));
                    }}
                    onFiles={setLeadForFiles}
                    onConvert={setLeadToConvert}
                    onDelete={(lead) => setActiveLead(lead)}
                    onArchive={(lead) => setLeadToArchive(lead)}
                    onStatusUpdated={() =>
                        toast.success('Estatus actualizado correctamente.')
                    }
                    onTracking={setLeadForTracking}
                />
            </div>

            <TrackingDrawer
                open={leadForTracking !== null}
                onOpenChange={(open) => !open && setLeadForTracking(null)}
                trackableType="Lead"
                trackableId={leadForTracking?.id ?? ''}
                trackableLabel={
                    leadForTracking
                        ? leadForTracking.full_name
                        : 'Lead'
                }
                catalogs={trackingCatalogs}
            />

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                        form.clearErrors();
                        setActiveLead(null);
                    }
                }}
                title={
                    formMode === 'edit'
                        ? 'Editar lead'
                        : formMode === 'view'
                            ? 'Detalle de lead'
                            : 'Nuevo lead'
                }
                description="Manten actualizado el pipeline con informacion precisa y accionable."
                submitLabel={
                    formMode === 'edit' ? 'Guardar cambios' : 'Guardar lead'
                }
                hideFooter={formMode === 'view'}
                processing={form.processing}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => {
                        if (formMode === 'create') {
                            return {
                                id: data.id,
                                first_name: data.first_name,
                                middle_name: data.middle_name,
                                last_name: data.last_name,
                                second_last_name: data.second_last_name,
                                phone: data.phone,
                                email: data.email,
                                source: data.source,
                            };
                        }

                        return data;
                    });
                    form.post(route('leads.store'), {
                        onSuccess: () => {
                            setFormMode(null);
                            setActiveLead(null);
                            form.reset();
                        },
                        onError: () =>
                            toast.error('Verifica los campos marcados.'),
                    });
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="lead-first-name">Nombre(s)</Label>
                        <Input
                            id="lead-first-name"
                            value={form.data.first_name}
                            disabled={formMode === 'view'}
                            onChange={(event) =>
                                form.setData('first_name', event.target.value)
                            }
                        />
                        {form.errors.first_name && (
                            <FieldError>{form.errors.first_name}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-middle-name">Segundo nombre</Label>
                        <Input
                            id="lead-middle-name"
                            value={form.data.middle_name}
                            disabled={formMode === 'view'}
                            onChange={(event) =>
                                form.setData('middle_name', event.target.value)
                            }
                        />
                        {form.errors.middle_name && (
                            <FieldError>{form.errors.middle_name}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-last-name">Apellido paterno</Label>
                        <Input
                            id="lead-last-name"
                            value={form.data.last_name}
                            disabled={formMode === 'view'}
                            onChange={(event) =>
                                form.setData('last_name', event.target.value)
                            }
                        />
                        {form.errors.last_name && (
                            <FieldError>{form.errors.last_name}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-second-last-name">Apellido materno</Label>
                        <Input
                            id="lead-second-last-name"
                            value={form.data.second_last_name}
                            disabled={formMode === 'view'}
                            onChange={(event) =>
                                form.setData('second_last_name', event.target.value)
                            }
                        />
                        {form.errors.second_last_name && (
                            <FieldError>{form.errors.second_last_name}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-phone">Telefono</Label>
                        <Input
                            id="lead-phone"
                            value={form.data.phone}
                            disabled={formMode === 'view'}
                            onChange={(event) =>
                                form.setData('phone', event.target.value)
                            }
                        />
                        {form.errors.phone && (
                            <FieldError>{form.errors.phone}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-email">Correo</Label>
                        <Input
                            id="lead-email"
                            value={form.data.email}
                            disabled={formMode === 'view'}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                        />
                        {form.errors.email && (
                            <FieldError>{form.errors.email}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label htmlFor="lead-source">Fuente</Label>

                        {(() => {
                            const selected =
                                sourceOptions.find((o) => o.value === form.data.source) ?? null;

                            return (
                                <Combobox
                                    items={sourceOptions}
                                    value={selected}
                                    onValueChange={(item) => form.setData("source", item?.value ?? "")}
                                    itemToStringValue={(item) => item?.label ?? ""}
                                    disabled={formMode === "view"}
                                >
                                    <ComboboxInput
                                        placeholder="Seleccione fuente"
                                        disabled={formMode === "view"}
                                    />

                                    {/* 👇 clave en Dialog: fuerza captura de clicks y evita clipping */}
                                    <ComboboxContent className="pointer-events-auto z-[100] overflow-visible">
                                        <ComboboxEmpty>No se encontraron fuentes.</ComboboxEmpty>

                                        <ComboboxList>
                                            {(item) => (
                                                <ComboboxItem
                                                    key={item.value}
                                                    value={item}
                                                    className="pointer-events-auto"
                                                >
                                                    {item.label}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            );
                        })()}

                        {form.errors.source && <FieldError>{form.errors.source}</FieldError>}
                    </Field>
                    {formMode !== 'create' && (
                        <>
                            <Field>
                                <Label htmlFor="lead-status">Estatus</Label>
                                <Combobox
                                    itemToStringLabel={(value) => statusOptions.find((option) => option.value === value)?.label ?? ''}
                                    value={form.data.status}
                                    onValueChange={(value) => form.setData('status', value ?? '')}
                                    disabled={formMode === 'view'}
                                >
                                    <ComboboxInput
                                        className="w-full"
                                        placeholder="Seleccione estatus"
                                        aria-label="Estatus"
                                        disabled={formMode === 'view'}
                                    />
                                    <ComboboxContent>
                                        <ComboboxList>
                                            <ComboboxEmpty>No se encontraron estatus.</ComboboxEmpty>
                                            {statusOptions.map((option) => (
                                                <ComboboxItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </ComboboxItem>
                                            ))}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                                {form.errors.status && (
                                    <FieldError>
                                        {form.errors.status}
                                    </FieldError>
                                )}
                            </Field>
                        </>
                    )}
                </div>
            </CrudFormDialog>

            <FilePickerDialog
                key={leadForFiles?.id ?? 'lead-files'}
                open={leadForFiles !== null}
                onOpenChange={(open) => !open && setLeadForFiles(null)}
                title={
                    leadForFiles
                        ? `Archivos · ${leadForFiles.full_name}`
                        : 'Archivos'
                }
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
                        onError: () =>
                            toast.error('No se pudo eliminar el archivo.'),
                    });
                }}
                onDownloadStoredFile={(file) => {
                    window.open(file.url, '_blank', 'noopener,noreferrer');
                }}
                accept="*/*"
                maxSizeHint="Cualquier formato · máximo 10MB"
            />

            <Dialog
                open={leadToArchive !== null}
                onOpenChange={(open) => !open && setLeadToArchive(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Archivar lead</DialogTitle>
                        <DialogDescription>
                            ¿Archivar este lead? Ya no aparecerá en Leads ni en Kanban.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLeadToArchive(null)}
                            disabled={isArchiving}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
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
                            disabled={isArchiving}
                        >
                            {isArchiving ? 'Archivando' : 'Archivar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={leadToConvert !== null}
                onOpenChange={(open) => {
                    if (!open && !isConverting) setLeadToConvert(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convertir lead a cliente</DialogTitle>
                        <DialogDescription>
                            Esto creará un cliente y marcará el lead como Ganado.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLeadToConvert(null)}
                            disabled={isConverting}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                if (!leadToConvert || isConverting) return;

                                setIsConverting(true);
                                router.post(route('leads.convertToClient', leadToConvert.id), undefined, {
                                    preserveScroll: true,
                                    onSuccess: () => setLeadToConvert(null),
                                    onError: () => toast.error('No se pudo convertir el lead.'),
                                    onFinish: () => setIsConverting(false),
                                });
                            }}
                            disabled={isConverting}
                        >
                            {isConverting && <Spinner className="mr-2" />}
                            {isConverting ? 'Convirtiendo' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={formMode === null && activeLead !== null}
                onOpenChange={(open) => !open && setActiveLead(null)}
                title="Eliminar lead"
                entityLabel="el lead"
                itemName={
                    activeLead
                        ? `${activeLead.first_name} ${activeLead.last_name ?? ''}`.trim()
                        : undefined
                }
                onConfirm={() => {
                    if (!activeLead) return;

                    router.delete(route('leads.destroy', activeLead.id), {
                        onSuccess: () => setActiveLead(null),
                        onError: () =>
                            toast.error('No se pudo eliminar el lead.'),
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
