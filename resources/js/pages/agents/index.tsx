import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BriefcaseBusiness, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent} from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
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
} from '@/components/ui/dropdown-menu';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type UserItem = {
    id: number;
    name: string;
    email: string;
};

type AgentRow = {
    id: string;
    user_id: number;
    name: string;
    phone: string | null;
    email: string | null;
    license_id: string | null;
    commission_percent: string | null;
    city: string | null;
    state: string | null;
    created_at: string;
    user: UserItem;
};

type PaginatedAgents = {
    data: AgentRow[];
    current_page: number;
    last_page: number;
    total: number;
};

type AgentForm = {
    id: string | null;
    user_id: string;
    name: string;
    phone: string;
    email: string;
    license_id: string;
    commission_percent: string;
    city: string;
    state: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Agentes', href: route('agents.index') },
];

export default function AgentsIndex({
    agents,
    users,
    filters,
}: {
    agents: PaginatedAgents;
    users: UserItem[];
    filters: { search: string };
}) {
    const [activeAgent, setActiveAgent] = useState<AgentRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const { flash } = usePage<SharedData>().props;

    const form = useForm<AgentForm>({
        id: null,
        user_id: '',
        name: '',
        phone: '',
        email: '',
        license_id: '',
        commission_percent: '',
        city: '',
        state: '',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const openCreateDialog = () => {
        setActiveAgent(null);
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (agent: AgentRow) => {
        setActiveAgent(agent);
        form.clearErrors();
        form.setData({
            id: agent.id,
            user_id: String(agent.user_id),
            name: agent.name,
            phone: agent.phone ?? '',
            email: agent.email ?? '',
            license_id: agent.license_id ?? '',
            commission_percent: agent.commission_percent ?? '',
            city: agent.city ?? '',
            state: agent.state ?? '',
        });
        setFormMode('edit');
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(route('agents.store'), {
            onSuccess: () => {
                setFormMode(null);
                setActiveAgent(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        });
    };

    const columns: DataTableColumn<AgentRow>[] = [
        {
            key: 'name',
            header: 'Agente',
            accessor: (row) => row.name,
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.email ?? 'Sin correo'}</p>
                </div>
            ),
        },
        {
            key: 'user',
            header: 'Usuario',
            accessor: (row) => row.user.name,
            cell: (row) => row.user.name,
        },
        {
            key: 'phone',
            header: 'Telefono',
            cell: (row) => row.phone ?? '—',
        },
        {
            key: 'city',
            header: 'Ubicacion',
            cell: (row) => [row.city, row.state].filter(Boolean).join(', ') || '—',
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
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>
                            <Pencil className="mr-2 size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setActiveAgent(row)}>
                            <Trash2 className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agentes" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <BriefcaseBusiness className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">Agentes</h1>
                                <p className="text-sm text-muted-foreground">
                                    Administra el equipo comercial y su vinculacion con usuarios del sistema.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 size-4" /> Nuevo agente
                        </Button>
                    </div>
                </div>

                <DataTable columns={columns} data={agents.data} searchColumn="name" searchPlaceholder="Filtrar resultados de la pagina..." />

            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null);
                        setActiveAgent(null);
                        form.clearErrors();
                    }
                }}
                title={formMode === 'edit' ? 'Editar agente' : 'Nuevo agente'}
                description="Registra la informacion comercial del agente y su usuario relacionado."
                submitLabel={formMode === 'edit' ? 'Guardar cambios' : 'Guardar agente'}
                processing={form.processing}
                onSubmit={submitForm}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <Label htmlFor="agent-user-id">Usuario</Label>
                        <Combobox
                            value={form.data.user_id}
                            onValueChange={(value) => form.setData('user_id', value)}
                        >
                            <ComboboxInput
                                className="w-full"
                                placeholder="selecciones nombre del catalogo"
                                aria-label="Usuario"
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>No se encontraron usuarios.</ComboboxEmpty>
                                    <ComboboxItem value="">Selecciona un usuario</ComboboxItem>
                                    {users.map((user) => (
                                        <ComboboxItem key={user.id} value={String(user.id)}>
                                            {user.name} ({user.email})
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        {form.errors.user_id && <FieldError>{form.errors.user_id}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="agent-name">Nombre</Label>
                        <Input id="agent-name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                        {form.errors.name && <FieldError>{form.errors.name}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="agent-email">Correo</Label>
                        <Input id="agent-email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                        {form.errors.email && <FieldError>{form.errors.email}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="agent-phone">Telefono</Label>
                        <Input id="agent-phone" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} />
                        {form.errors.phone && <FieldError>{form.errors.phone}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="agent-license">Cedula/licencia</Label>
                        <Input id="agent-license" value={form.data.license_id} onChange={(event) => form.setData('license_id', event.target.value)} />
                        {form.errors.license_id && <FieldError>{form.errors.license_id}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="agent-commission">Comision %</Label>
                        <Input id="agent-commission" value={form.data.commission_percent} onChange={(event) => form.setData('commission_percent', event.target.value)} />
                        {form.errors.commission_percent && <FieldError>{form.errors.commission_percent}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="agent-city">Ciudad</Label>
                        <Input id="agent-city" value={form.data.city} onChange={(event) => form.setData('city', event.target.value)} />
                        {form.errors.city && <FieldError>{form.errors.city}</FieldError>}
                    </Field>

                    <Field>
                        <Label htmlFor="agent-state">Estado</Label>
                        <Input id="agent-state" value={form.data.state} onChange={(event) => form.setData('state', event.target.value)} />
                        {form.errors.state && <FieldError>{form.errors.state}</FieldError>}
                    </Field>
                </div>
            </CrudFormDialog>

            <ConfirmDeleteDialog
                open={formMode === null && activeAgent !== null}
                onOpenChange={(open) => !open && setActiveAgent(null)}
                title="Eliminar agente"
                entityLabel="al agente"
                itemName={activeAgent?.name}
                onConfirm={() => {
                    if (!activeAgent) return;

                    router.delete(route('agents.destroy', activeAgent.id), {
                        onSuccess: () => setActiveAgent(null),
                        onError: () => toast.error('No se pudo eliminar el agente.'),
                    });
                }}
            />
        </AppLayout>
    );
}
