import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

type UserRole = { id: number; name: string };
type UserRow = {
    id: number;
    name: string;
    email: string;
    roles: UserRole[];
    created_at: string;
};
type UserForm = {
    id: number | null;
    name: string;
    email: string;
    password: string;
    roles: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Configuración', href: route('config.users.index') },
    { title: 'Usuarios', href: route('config.users.index') },
];

export default function UsersIndex({
    users,
    roles,
}: {
    users: UserRow[];
    roles: UserRole[];
}) {
    const [activeUser, setActiveUser] = useState<UserRow | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
    const form = useForm<UserForm>({
        id: null,
        name: '',
        email: '',
        password: '',
        roles: [],
    });
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const toggleRole = (roleName: string) => {
        const selectedRoles = form.data.roles;
        form.setData(
            'roles',
            selectedRoles.includes(roleName)
                ? selectedRoles.filter((value) => value !== roleName)
                : [...selectedRoles, roleName],
        );
    };

    const openCreateDialog = () => {
        setActiveUser(null);
        form.reset();
        form.clearErrors();
        setFormMode('create');
    };

    const openEditDialog = (user: UserRow) => {
        setActiveUser(user);
        form.clearErrors();
        form.setData({
            id: user.id,
            name: user.name,
            email: user.email,
            password: '',
            roles: user.roles.map((role) => role.name),
        });
        setFormMode('edit');
    };

    const closeFormDialog = (open: boolean) => {
        if (!open) {
            setFormMode(null);
            setActiveUser(null);
            form.clearErrors();
        }
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const config = {
            onSuccess: () => {
                setFormMode(null);
                setActiveUser(null);
                form.reset();
            },
            onError: () => toast.error('Verifica los campos marcados.'),
        };

        form.post(route('config.users.store'), config);
    };

    const columns: DataTableColumn<UserRow>[] = [
        {
            key: 'name',
            header: 'Nombre',
            accessor: (row) => row.name,
            cell: (row) => row.name,
        },
        {
            key: 'email',
            header: 'Correo',
            accessor: (row) => row.email,
            cell: (row) => row.email,
        },
        {
            key: 'roles',
            header: 'Roles',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.roles.length > 0 ? (
                        row.roles.map((role) => (
                            <Badge key={role.id} variant="outline">
                                {role.name}
                            </Badge>
                        ))
                    ) : (
                        <Badge variant="secondary">Sin rol</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'created_at',
            header: 'Creado',
            cell: (row) => new Date(row.created_at).toLocaleDateString('es-MX'),
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
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setActiveUser(row)}
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
            <Head title="Usuarios" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Users className="size-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold">
                                    Usuarios
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Gestiona cuentas y asigna roles con una
                                    experiencia clara.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <UserPlus className="mr-2 size-4" /> Nuevo usuario
                        </Button>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={users}
                    searchColumn="name"
                    searchPlaceholder="Buscar usuario por nombre..."
                />
            </div>

            <CrudFormDialog
                open={formMode !== null}
                onOpenChange={closeFormDialog}
                title={formMode === 'edit' ? 'Editar usuario' : 'Crear usuario'}
                description={
                    formMode === 'edit'
                        ? 'Actualiza los datos y roles del usuario seleccionado.'
                        : 'Completa los datos y asigna uno o más roles.'
                }
                submitLabel={
                    formMode === 'edit' ? 'Guardar cambios' : 'Guardar usuario'
                }
                processing={form.processing}
                onSubmit={submitForm}
            >
                <Field>
                    <Label htmlFor="user-name">Nombre</Label>
                    <Input
                        id="user-name"
                        aria-invalid={Boolean(form.errors.name)}
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        placeholder="Ej. Ana López"
                    />
                    {form.errors.name && (
                        <FieldError>{form.errors.name}</FieldError>
                    )}
                </Field>

                <Field>
                    <Label htmlFor="user-email">Correo</Label>
                    <Input
                        id="user-email"
                        type="email"
                        aria-invalid={Boolean(form.errors.email)}
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.target.value)
                        }
                        placeholder="ana@empresa.com"
                    />
                    {form.errors.email && (
                        <FieldError>{form.errors.email}</FieldError>
                    )}
                </Field>

                <Field>
                    <Label htmlFor="user-password">
                        {formMode === 'edit'
                            ? 'Contraseña (opcional)'
                            : 'Contraseña'}
                    </Label>
                    <Input
                        id="user-password"
                        type="password"
                        aria-invalid={Boolean(form.errors.password)}
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
                        placeholder={
                            formMode === 'edit'
                                ? 'Deja vacío para mantener la actual'
                                : 'Mínimo 8 caracteres'
                        }
                    />
                    {form.errors.password && (
                        <FieldError>{form.errors.password}</FieldError>
                    )}
                </Field>

                <Field>
                    <p className="text-sm font-medium">Roles</p>
                    <div className="grid gap-2 md:grid-cols-2">
                        {roles.map((role) => (
                            <label
                                key={role.id}
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    checked={form.data.roles.includes(
                                        role.name,
                                    )}
                                    onCheckedChange={() =>
                                        toggleRole(role.name)
                                    }
                                />
                                {role.name}
                            </label>
                        ))}
                    </div>
                    {form.errors.roles && (
                        <FieldError>{form.errors.roles}</FieldError>
                    )}
                </Field>
            </CrudFormDialog>

            <ConfirmDeleteDialog
                open={formMode === null && activeUser !== null}
                onOpenChange={(open) => !open && setActiveUser(null)}
                title="Eliminar usuario"
                entityLabel="la cuenta de"
                itemName={activeUser?.name}
                onConfirm={() => {
                    if (!activeUser) return;
                    router.delete(
                        route('config.users.destroy', activeUser.id),
                        {
                            onSuccess: () => setActiveUser(null),
                            onError: () =>
                                toast.error('No se pudo eliminar el usuario.'),
                        },
                    );
                }}
            />
        </AppLayout>
    );
}
