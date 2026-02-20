import { router, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { TrackingUpsertDialog, type TrackingActivityItem } from '@/components/tracking/TrackingUpsertDialog';
import { Button } from '@/components/ui/button';
import type { SharedData } from '@/types';

type CatalogItem = { id: number; key: string; name: string };

export function TrackingPanel({
    trackableType,
    trackableId,
    items = [],
    catalogs,
}: {
    trackableType: string;
    trackableId: string | number;
    items?: TrackingActivityItem[];
    catalogs: {
        activityTypes: CatalogItem[];
        channels: CatalogItem[];
        statuses: CatalogItem[];
        priorities: CatalogItem[];
        outcomes: CatalogItem[];
    };
}) {
    const [localItems, setLocalItems] = useState<TrackingActivityItem[]>(items);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TrackingActivityItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<TrackingActivityItem | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    useEffect(() => {
        fetch(`${route('tracking.index')}?trackable_type=${trackableType}&trackable_id=${trackableId}`)
            .then((response) => response.json())
            .then((data) => setLocalItems(data.items ?? []));
    }, [trackableId, trackableType]);

    const filteredItems = useMemo(() => {
        return localItems.filter((item) => {
            const matchesStatus = statusFilter ? String(item.status_id) === statusFilter : true;
            const matchesType = typeFilter ? String(item.activity_type_id) === typeFilter : true;
            const needle = search.trim().toLowerCase();
            const matchesSearch = needle.length === 0
                ? true
                : `${item.title ?? ''} ${item.body}`.toLowerCase().includes(needle);

            return matchesStatus && matchesType && matchesSearch;
        });
    }, [localItems, search, statusFilter, typeFilter]);

    return (
        <div className="space-y-3 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-base font-semibold">Seguimiento</h3>
                    <p className="text-sm text-muted-foreground">Timeline de actividades con foco en próxima acción.</p>
                </div>
                <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }}>
                    <Plus className="mr-2 size-4" /> Nuevo seguimiento
                </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    <option value="">Todos los tipos</option>
                    {catalogs.activityTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="">Todos los estatus</option>
                    {catalogs.statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Buscar en título o nota..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>

            <div className="space-y-2">
                {filteredItems.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Sin actividades para los filtros seleccionados.</p>}
                {filteredItems.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-card p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="font-medium">{item.title || 'Actividad sin título'}</p>
                                <p className="text-xs text-muted-foreground">{new Date(item.occurred_at).toLocaleString('es-MX')}</p>
                            </div>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setDialogOpen(true); }}><Edit className="size-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => setDeletingItem(item)}><Trash2 className="size-4 text-destructive" /></Button>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                        {item.next_action_at && <p className="mt-2 text-xs font-medium text-primary">Próxima acción: {new Date(item.next_action_at).toLocaleString('es-MX')}</p>}
                    </div>
                ))}
            </div>

            <TrackingUpsertDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                trackableType={trackableType}
                trackableId={trackableId}
                catalogs={catalogs}
                editingItem={editingItem}
            />

            <ConfirmDeleteDialog
                open={Boolean(deletingItem)}
                onOpenChange={(open) => !open && setDeletingItem(null)}
                itemName={deletingItem?.title ?? undefined}
                entityLabel="este seguimiento"
                onConfirm={() => {
                    if (!deletingItem) return;
                    router.delete(route('tracking.destroy', deletingItem.id), {
                        preserveScroll: true,
                        onSuccess: () => setDeletingItem(null),
                    });
                }}
            />
        </div>
    );
}
