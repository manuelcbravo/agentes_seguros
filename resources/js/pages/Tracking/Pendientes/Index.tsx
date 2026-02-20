import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type Item = {
    id: string;
    trackable_type: string;
    trackable_id: string;
    body: string;
    next_action_at: string;
    status_id: number;
    activity_type_id: number;
    status: { key: string; name: string };
    activity_type: { name: string };
    priority: { name: string } | null;
};

export default function TrackingPendientesIndex({ items, catalogs }: { items: Item[]; catalogs: { statuses: Array<{ id: number; key: string }> } }) {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [{ title: 'Pendientes', href: route('tracking.pendientes') }], []);
    const doneStatus = catalogs.statuses.find((item) => item.key === 'done');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pendientes de seguimiento" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <h1 className="text-xl font-semibold">Pendientes de seguimiento</h1>
                    <p className="text-sm text-muted-foreground">Prioriza tus próximas acciones y marca rápidamente lo completado.</p>
                </div>

                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="p-3 text-left">Entidad</th>
                                <th className="p-3 text-left">Próxima acción</th>
                                <th className="p-3 text-left">Tipo</th>
                                <th className="p-3 text-left">Prioridad</th>
                                <th className="p-3 text-left">Nota</th>
                                <th className="p-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td className="p-6 text-center text-muted-foreground" colSpan={6}>No tienes pendientes por ahora.</td>
                                </tr>
                            )}
                            {items.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="p-3">{item.trackable_type.split('\\').pop()} · {item.trackable_id.slice(0, 8)}</td>
                                    <td className="p-3">{new Date(item.next_action_at).toLocaleString('es-MX')}</td>
                                    <td className="p-3">{item.activity_type?.name ?? '—'}</td>
                                    <td className="p-3">{item.priority?.name ?? '—'}</td>
                                    <td className="max-w-md truncate p-3">{item.body}</td>
                                    <td className="p-3 text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                if (!doneStatus) return;
                                                router.post(route('tracking.upsert'), {
                                                    id: item.id,
                                                    trackable_type: item.trackable_type,
                                                    trackable_id: item.trackable_id,
                                                    activity_type_id: item.activity_type_id,
                                                    status_id: doneStatus.id,
                                                    body: item.body,
                                                    completed_at: new Date().toISOString(),
                                                    occurred_at: new Date().toISOString(),
                                                });
                                            }}
                                        >
                                            <CheckCircle2 className="mr-2 size-4" /> Marcar completado
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
