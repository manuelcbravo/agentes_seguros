import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CircleCheck,
    CircleX,
    FolderKanban,
    ImagePlus,
    MoreHorizontal,
    Pencil,
    Trash2,
    UserPlus,
    Users,
    BookPlus,
    Activity,
    User
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { TrackingDrawer } from '@/components/tracking/TrackingDrawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type ClientRow = {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    avatar_url: string;
    avatar_path: string | null;
    created_at: string;
};

type MediaFile = {
    id: string;
    original_name: string;
    path: string;
    url: string;
    mime_type: string | null;
    size: number;
    related_table: string;
    related_uuid: string;
};

type ClientForm = {
    id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    avatar: File | null;
    avatar_path: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contratantes', href: route('clients.index') },
];

const FILES_TABLE_ID = 'clients';

export default function ClientsIndex({
    clients,
    files,
    trackingCatalogs,
}: {
    clients: ClientRow[];
    files: MediaFile[];
    trackingCatalogs: {
        activityTypes: Array<{ id: number; key: string; name: string }>;
        channels: Array<{ id: number; key: string; name: string }>;
        statuses: Array<{ id: number; key: string; name: string }>;
        priorities: Array<{ id: number; key: string; name: string }>;
        outcomes: Array<{ id: number; key: string; name: string }>;
    };
}) {
    const [activeClient, setActiveClient] = useState<ClientRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const [fileManagerClient, setFileManagerClient] =
        useState<ClientRow | null>(null);
    const [trackingClient, setTrackingClient] = useState<ClientRow | null>(
        null,
    );
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm<ClientForm>({
        id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        is_active: true,
        avatar: null,
        avatar_path: null,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const openCreateDialog = () => {
        setActiveClient(null);
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (client: ClientRow) => {
        setActiveClient(client);
        form.clearErrors();
        form.setData({
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            email: client.email ?? '',
            phone: client.phone ?? '',
            is_active: client.is_active,
            avatar: null,
            avatar_path: client.avatar_path,
        });
        setFormMode('edit');
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(route('clients.store'), {
            forceFormData: true,
            onSuccess: () => {
                setFormMode(null);
                setActiveClient(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        });
    };

    const localAvatarPreview = useMemo(() => {
        if (!form.data.avatar) return null;

        return URL.createObjectURL(form.data.avatar);
    }, [form.data.avatar]);

    useEffect(() => {
        return () => {
            if (localAvatarPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(localAvatarPreview);
            }
        };
    }, [localAvatarPreview]);

    const contextualFiles = useMemo(() => {
        if (!fileManagerClient) return [];

        return files.filter(
            (file) =>
                file.related_table === FILES_TABLE_ID &&
                file.related_uuid === fileManagerClient.id,
        );
    }, [fileManagerClient, files]);

    const columns: DataTableColumn<ClientRow>[] = [
        {
            key: 'full_name',
            header: 'Contratante',
            accessor: (row) => row.full_name,
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar className="size-9 border">
                        <AvatarImage src={row.avatar_url} alt={row.full_name} />
                        <AvatarFallback>
                            {row.first_name.charAt(0)}
                            {row.last_name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{row.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                            Alta{' '}
                            {new Date(row.created_at).toLocaleDateString(
                                'es-MX',
                            )}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'email',
            header: 'Correo',
            cell: (row) => row.email ?? '—',
        },
        {
            key: 'phone',
            header: 'Teléfono',
            cell: (row) => row.phone ?? '—',
        },
        {
            key: 'is_active',
            header: 'Estado',
            cell: (row) =>
                row.is_active ? (
                    <Badge className="gap-1" variant="secondary">
                        <CircleCheck className="size-3" /> Activo
                    </Badge>
                ) : (
                    <Badge className="gap-1" variant="outline">
                        <CircleX className="size-3" /> Inactivo
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
                        <DropdownMenuItem onClick={() => router.get(route('clients.show', row.id))}>
                            <User className="mr-2 size-4" /> Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>
                            <Pencil className="mr-2 size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setFileManagerClient(row)}
                        >
                            <FolderKanban className="mr-2 size-4" /> Files
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                router.get(route('polizas.wizard.create'), {
                                    client_id: row.id,
                                })
                            }
                        >
                            <BookPlus className="mr-2 size-4" /> Generar póliza
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setTrackingClient(row)}
                        >
                            <Activity className="mr-2 size-4" /> Seguimiento
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setActiveClient(row)}
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
            <Head title="Contratantes" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Users className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">
                                    Contratantes
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona contratantes y abre el gestor de
                                    archivos desde las opciones de cada contratante.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <UserPlus className="mr-2 size-4" /> Nuevo contratante
                        </Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={clients}
                    searchColumn="full_name"
                    searchPlaceholder="Buscar contratante por nombre..."
                />
            </div>

            <TrackingDrawer
                open={trackingClient !== null}
                onOpenChange={(open) => !open && setTrackingClient(null)}
                trackableType="Client"
                trackableId={trackingClient?.id ?? ''}
                trackableLabel={trackingClient?.full_name ?? 'Contratante'}
                catalogs={trackingCatalogs}
            />

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                        setActiveClient(null);
                        form.clearErrors();
                    }
                }}
                title={formMode === "edit" ? "Editar contratante" : "Nuevo contratante"}
                description="Captura datos esenciales y guarda el contratante directamente desde este modal."
                submitLabel={formMode === "edit" ? "Guardar cambios" : "Guardar contratante"}
                processing={form.processing}
                onSubmit={submitForm}
            >
                <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="size-16 border">
                                <AvatarImage
                                    src={localAvatarPreview ?? activeClient?.avatar_url}
                                    alt="Preview"
                                />
                                <AvatarFallback>
                                    <ImagePlus className="size-4" />
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <p className="text-sm font-medium">Imagen</p>
                                <p className="text-xs text-muted-foreground">
                                    Se guarda al guardar el contratante.
                                </p>

                                {(form.errors.avatar || form.errors.avatar_path) && (
                                    <div className="space-y-1">
                                        {form.errors.avatar && (
                                            <FieldError>{form.errors.avatar}</FieldError>
                                        )}
                                        {form.errors.avatar_path && (
                                            <FieldError>{form.errors.avatar_path}</FieldError>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="client-avatar-input"
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    form.setData("avatar", event.target.files?.[0] ?? null);
                                    form.setData("avatar_path", null);
                                }}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => avatarInputRef.current?.click()}
                            >
                                Seleccionar
                            </Button>

                            {(form.data.avatar || form.data.avatar_path) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        form.setData("avatar", null);
                                        form.setData("avatar_path", null);
                                    }}
                                >
                                    Quitar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Identidad */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="client-first-name">Nombre(s)</Label>
                        <Input
                            id="client-first-name"
                            value={form.data.first_name}
                            onChange={(e) => form.setData("first_name", e.target.value)}
                            placeholder="Ej. Camila"
                            aria-invalid={Boolean(form.errors.first_name)}
                        />
                        {form.errors.first_name && (
                            <FieldError>{form.errors.first_name}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="client-last-name">Apellido(s)</Label>
                        <Input
                            id="client-last-name"
                            value={form.data.last_name}
                            onChange={(e) => form.setData("last_name", e.target.value)}
                            placeholder="Ej. Salinas"
                            aria-invalid={Boolean(form.errors.last_name)}
                        />
                        {form.errors.last_name && (
                            <FieldError>{form.errors.last_name}</FieldError>
                        )}
                    </Field>
                </div>

                {/* Contacto */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="client-email">Correo</Label>
                        <Input
                            id="client-email"
                            type="email"
                            value={form.data.email}
                            onChange={(e) => form.setData("email", e.target.value)}
                            placeholder="cliente@email.com"
                            aria-invalid={Boolean(form.errors.email)}
                        />
                        {form.errors.email && <FieldError>{form.errors.email}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="client-phone">Teléfono</Label>
                        <Input
                            id="client-phone"
                            value={form.data.phone}
                            onChange={(e) => form.setData("phone", e.target.value)}
                            placeholder="55 1234 5678"
                            aria-invalid={Boolean(form.errors.phone)}
                        />
                        {form.errors.phone && <FieldError>{form.errors.phone}</FieldError>}
                    </Field>
                </div>

                {/* Estado */}
                <Field>
                    <Label>Estado</Label>
                    <Combobox
                        itemToStringLabel={(value) => (value === "1" ? "Activo" : "Inactivo")}
                        value={form.data.is_active ? "1" : "0"}
                        onValueChange={(value) => form.setData("is_active", value === "1")}
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Seleccione estado"
                            aria-label="Estado"
                        />
                        <ComboboxContent className="pointer-events-auto z-[100] overflow-visible">
                            <ComboboxList>
                                <ComboboxItem value="1">Activo</ComboboxItem>
                                <ComboboxItem value="0">Inactivo</ComboboxItem>
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>

                    {form.errors.is_active && (
                        <FieldError>{form.errors.is_active}</FieldError>
                    )}
                </Field>
            </CrudFormDialog>

            <FilePickerDialog
                key={fileManagerClient?.id ?? 'files-manager'}
                open={fileManagerClient !== null}
                onOpenChange={(open) => {
                    if (!open) setFileManagerClient(null);
                }}
                title={
                    fileManagerClient
                        ? `Archivos · ${fileManagerClient.full_name}`
                        : 'Archivos'
                }
                description="Gestiona los archivos del contratante activo (subir, descargar, renombrar o eliminar) sin salir del flujo."
                storedFiles={contextualFiles}
                tableId={FILES_TABLE_ID}
                relatedUuid={fileManagerClient?.id ?? null}
                onDeleteStoredFile={(fileId) => {
                    if (!fileManagerClient) return;

                    router.delete(route('files.destroy', fileId), {
                        preserveScroll: true,
                        data: {
                            related_table: FILES_TABLE_ID,
                            related_uuid: fileManagerClient.id,
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

            <ConfirmDeleteDialog
                open={formMode === null && activeClient !== null}
                onOpenChange={(open) => !open && setActiveClient(null)}
                title="Eliminar"
                entityLabel="el registro de"
                itemName={activeClient?.full_name}
                onConfirm={() => {
                    if (!activeClient) return;

                    router.delete(route('clients.destroy', activeClient.id), {
                        onSuccess: () => setActiveClient(null),
                        onError: () =>
                            toast.error('No se pudo eliminar el contratante.'),
                    });
                }}
            />
        </AppLayout>
    );
}
