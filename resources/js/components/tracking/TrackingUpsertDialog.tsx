import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { route } from 'ziggy-js';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CatalogItem = { id: number; key: string; name: string };

type TrackingForm = {
    id: string | null;
    trackable_type: string;
    trackable_id: string;
    activity_type_id: string;
    channel_id: string;
    status_id: string;
    priority_id: string;
    outcome_id: string;
    title: string;
    body: string;
    occurred_at: string;
    next_action_at: string;
    completed_at: string;
    meta: string;
};

export type TrackingActivityItem = {
    id: string;
    title: string | null;
    body: string;
    occurred_at: string;
    next_action_at: string | null;
    status_id: number;
    activity_type_id: number;
    channel_id: number | null;
    priority_id: number | null;
    outcome_id: number | null;
    meta: Record<string, unknown> | null;
};

export function TrackingUpsertDialog({
    open,
    onOpenChange,
    trackableType,
    trackableId,
    catalogs,
    editingItem,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trackableType: string;
    trackableId: string | number;
    catalogs: {
        activityTypes: CatalogItem[];
        channels: CatalogItem[];
        statuses: CatalogItem[];
        priorities: CatalogItem[];
        outcomes: CatalogItem[];
    };
    editingItem: TrackingActivityItem | null;
}) {
    const form = useForm<TrackingForm>({
        id: null,
        trackable_type: trackableType,
        trackable_id: String(trackableId),
        activity_type_id: '',
        channel_id: '',
        status_id: '',
        priority_id: '',
        outcome_id: '',
        title: '',
        body: '',
        occurred_at: new Date().toISOString().slice(0, 16),
        next_action_at: '',
        completed_at: '',
        meta: '',
    });

    useEffect(() => {
        if (!open) return;

        if (editingItem) {
            form.setData({
                id: editingItem.id,
                trackable_type: trackableType,
                trackable_id: String(trackableId),
                activity_type_id: String(editingItem.activity_type_id),
                channel_id: editingItem.channel_id ? String(editingItem.channel_id) : '',
                status_id: String(editingItem.status_id),
                priority_id: editingItem.priority_id ? String(editingItem.priority_id) : '',
                outcome_id: editingItem.outcome_id ? String(editingItem.outcome_id) : '',
                title: editingItem.title ?? '',
                body: editingItem.body,
                occurred_at: (editingItem.occurred_at ?? '').slice(0, 16),
                next_action_at: (editingItem.next_action_at ?? '').slice(0, 16),
                completed_at: '',
                meta: editingItem.meta ? JSON.stringify(editingItem.meta, null, 2) : '',
            });

            return;
        }

        form.reset();
        form.setData('trackable_type', trackableType);
        form.setData('trackable_id', String(trackableId));
    }, [editingItem, open, trackableId, trackableType, form]);

    return (
        <CrudFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={editingItem ? 'Editar seguimiento' : 'Nuevo seguimiento'}
            description="Registra interacciones, acuerdos y próximos pasos con contexto claro."
            submitLabel={editingItem ? 'Guardar cambios' : 'Guardar seguimiento'}
            processing={form.processing}
            onSubmit={(event) => {
                event.preventDefault();
                form.transform((data) => ({
                    ...data,
                    activity_type_id: Number(data.activity_type_id),
                    channel_id: data.channel_id ? Number(data.channel_id) : null,
                    status_id: Number(data.status_id),
                    priority_id: data.priority_id ? Number(data.priority_id) : null,
                    outcome_id: data.outcome_id ? Number(data.outcome_id) : null,
                    meta: data.meta ? JSON.parse(data.meta) : null,
                }));
                form.post(route('tracking.upsert'), {
                    preserveScroll: true,
                    onSuccess: () => {
                        onOpenChange(false);
                        form.reset();
                    },
                });
            }}
        >
            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <Label>Tipo</Label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.activity_type_id} onChange={(event) => form.setData('activity_type_id', event.target.value)}>
                        <option value="">Selecciona tipo</option>
                        {catalogs.activityTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    {form.errors.activity_type_id && <FieldError>{form.errors.activity_type_id}</FieldError>}
                </Field>
                <Field>
                    <Label>Canal</Label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.channel_id} onChange={(event) => form.setData('channel_id', event.target.value)}>
                        <option value="">Sin canal</option>
                        {catalogs.channels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </Field>
                <Field>
                    <Label>Estatus</Label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.status_id} onChange={(event) => form.setData('status_id', event.target.value)}>
                        <option value="">Selecciona estatus</option>
                        {catalogs.statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    {form.errors.status_id && <FieldError>{form.errors.status_id}</FieldError>}
                </Field>
                <Field>
                    <Label>Prioridad</Label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.priority_id} onChange={(event) => form.setData('priority_id', event.target.value)}>
                        <option value="">Sin prioridad</option>
                        {catalogs.priorities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </Field>
                <Field>
                    <Label>Resultado</Label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.data.outcome_id} onChange={(event) => form.setData('outcome_id', event.target.value)}>
                        <option value="">Sin resultado</option>
                        {catalogs.outcomes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </Field>
                <Field>
                    <Label>Título</Label>
                    <Input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                </Field>
                <Field className="md:col-span-2">
                    <Label>Nota / descripción</Label>
                    <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} />
                    {form.errors.body && <FieldError>{form.errors.body}</FieldError>}
                </Field>
                <Field>
                    <Label>Fecha del evento</Label>
                    <Input type="datetime-local" value={form.data.occurred_at} onChange={(event) => form.setData('occurred_at', event.target.value)} />
                </Field>
                <Field>
                    <Label>Próxima acción</Label>
                    <Input type="datetime-local" value={form.data.next_action_at} onChange={(event) => form.setData('next_action_at', event.target.value)} />
                </Field>
                <Field className="md:col-span-2">
                    <Label>Meta avanzada (JSON)</Label>
                    <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder='{"duracion_min": 20}' value={form.data.meta} onChange={(event) => form.setData('meta', event.target.value)} />
                </Field>
            </div>
        </CrudFormDialog>
    );
}
