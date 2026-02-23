import { Head, router } from '@inertiajs/react';
import { AlertCircle, Calendar, FileText, MoreHorizontal, Plus, Trash2, UserCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type TrackingItem = { id: string; title: string | null; body: string; occurred_at: string; activity_type?: { name: string } | null; created_by?: { name: string } | null };
type LeadDto = { id: string; first_name: string; middle_name?: string | null; last_name?: string | null; second_last_name?: string | null; email?: string | null; phone?: string | null; status?: string | null; created_at?: string; agent?: { name: string } | null; client_id?: string | null; client?: ClientDto | null; tracking_activities?: TrackingItem[] };
type ClientDto = { id: string; first_name: string; middle_name?: string | null; last_name?: string | null; second_last_name?: string | null; email?: string | null; phone?: string | null; rfc?: string | null; birth_date?: string | null; street?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; postal_code?: string | null; created_at?: string; is_active?: boolean; tracking_activities?: TrackingItem[] };
type FileItem = { id: string; uuid: string; original_name: string; path?: string; url: string; size: number; created_at: string; mime_type: string | null };
type Policy = { id: string; product?: string | null; status?: string | null; risk_premium?: string | number | null; coverage_start?: string | null };
type Insured = { id: string; full_name?: string | null; relationship?: string | null; age_current?: number | null };
type Beneficiary = { id: string; full_name?: string | null; benefit_percentage?: number | string | null };

const formatName = (entity: LeadDto | ClientDto | null | undefined) => [entity?.first_name, entity?.middle_name, entity?.last_name, entity?.second_last_name].filter(Boolean).join(' ') || 'Sin nombre';
const formatDate = (date?: string | null) => (date ? new Date(date).toLocaleDateString('es-MX') : '—');
const formatMoney = (value?: string | number | null) => (value == null ? '—' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value)));

export default function PeopleShow({ lead = null, client = null, resolvedType, files = [], policies = [], insured = [], beneficiaries = [] }: { lead?: LeadDto | null; client?: ClientDto | null; resolvedType?: 'lead' | 'client'; files?: FileItem[]; policies?: Policy[]; insured?: Insured[]; beneficiaries?: Beneficiary[] }) {
    const type = resolvedType ?? (lead?.client_id || lead?.client || client ? 'client' : 'lead');
    const entity = type === 'client' ? (client ?? lead?.client ?? null) : lead;
    const [activeTab, setActiveTab] = useState(type === 'client' ? 'archivos' : 'actividades');
    const [filesOpen, setFilesOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [{ title: type === 'client' ? 'Clientes' : 'Leads', href: type === 'client' ? route('clients.index') : route('leads.index') }, { title: formatName(entity), href: '#' }];
    const trackingItems = (entity?.tracking_activities ?? []).slice().sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at));
    const beneficiaryTotal = useMemo(() => beneficiaries.reduce((sum, b) => sum + Number(b.benefit_percentage ?? 0), 0), [beneficiaries]);

    const fileColumns: DataTableColumn<FileItem>[] = [
        { key: 'name', header: 'Nombre original', accessor: (row) => row.original_name, cell: (row) => row.original_name },
        { key: 'size', header: 'Tamaño', cell: (row) => `${Math.max(1, Math.round(row.size / 1024))} KB` },
        { key: 'date', header: 'Fecha', cell: (row) => formatDate(row.created_at) },
        { key: 'actions', header: 'Acciones', cell: (row) => <div className="flex gap-2"><a className="text-primary underline" href={row.url} target="_blank" rel="noreferrer">Ver</a><a className="text-primary underline" href={row.url} download>Descargar</a><button type="button" className="text-destructive" onClick={() => router.delete(route('files.destroy', row.id))}>Eliminar</button></div> },
    ];

    if (!entity) {
        return <AppLayout breadcrumbs={breadcrumbs}><div className="mx-auto max-w-7xl p-6"><Card className="rounded-2xl"><CardContent className="space-y-3 p-6"><Skeleton className="h-8 w-44" /><Skeleton className="h-24 w-full" /></CardContent></Card></div></AppLayout>;
    }

    const info = [
        { label: 'Email', value: entity.email },
        { label: 'Teléfono', value: entity.phone },
        { label: 'RFC', value: type === 'client' ? (entity as ClientDto).rfc : null },
        { label: 'Fecha nacimiento', value: type === 'client' ? formatDate((entity as ClientDto).birth_date) : null },
        { label: 'Dirección', value: type === 'client' ? [(entity as ClientDto).street, (entity as ClientDto).neighborhood, (entity as ClientDto).city, (entity as ClientDto).state, (entity as ClientDto).postal_code].filter(Boolean).join(', ') : null },
        { label: 'Agente asignado', value: lead?.agent?.name },
        { label: 'Creado el', value: formatDate(entity.created_at) },
    ].filter((item) => item.value);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${type === 'client' ? 'Cliente' : 'Lead'} · ${formatName(entity)}`} />
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <Card className="rounded-2xl border shadow-sm"><CardContent className="p-6"><div className="grid gap-6 lg:grid-cols-12"><aside className="space-y-4 lg:col-span-3"><div className="flex flex-col items-start gap-4"><div className="grid size-32 place-items-center rounded-2xl bg-muted"><UserCircle2 className="size-16 text-muted-foreground" /></div><div><h1 className="text-xl font-semibold">{formatName(entity)}</h1><div className="mt-2 flex flex-wrap gap-2"><Badge>{type === 'client' ? 'Cliente' : 'Lead'}</Badge><Badge variant="outline">{type === 'client' ? ((entity as ClientDto).is_active ? 'Activo' : 'Inactivo') : (lead?.status ?? 'Sin estatus')}</Badge></div></div></div><DropdownMenu><DropdownMenuTrigger asChild><Button className="w-full" variant="outline"><MoreHorizontal className="mr-2 size-4" /> Acciones</Button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-56"><DropdownMenuItem onClick={() => router.get(type === 'client' ? route('clients.index') : route('leads.index'))}>Editar</DropdownMenuItem>{type === 'lead' && !lead?.client_id && <DropdownMenuItem onClick={() => router.post(route('leads.convertToClient', lead!.id))}>Convertir a cliente</DropdownMenuItem>}{type === 'lead' && <DropdownMenuItem onClick={() => router.post(route('leads.archive', lead!.id))}>Archivar</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 size-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></aside><section className="lg:col-span-9"><div className="grid gap-4 sm:grid-cols-2">{info.map((item) => <div key={item.label} className="space-y-1 rounded-xl border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{item.label}</p><p className="font-medium">{item.value}</p></div>)}</div></section></div></CardContent></Card>

                <div className="space-y-4"><div className="flex flex-wrap gap-2">{(type === 'client' ? ['archivos', 'pólizas', 'asegurados', 'beneficiarios', 'actividades'] : ['archivos', 'actividades']).map((tab) => <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} onClick={() => setActiveTab(tab)} className="capitalize">{tab}{tab === 'beneficiarios' && beneficiaryTotal !== 100 && <Badge variant="destructive" className="ml-2">{beneficiaryTotal}%</Badge>}</Button>)}</div>
                    <Card className="rounded-2xl"><CardContent className="p-6">
                        {activeTab === 'archivos' && <div className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Archivos</h3><Button onClick={() => setFilesOpen(true)}><Plus className="mr-2 size-4" />Subir archivo</Button></div>{files.length === 0 ? <div className="grid place-items-center rounded-xl border border-dashed p-10 text-center"><FileText className="mb-2 size-8 text-muted-foreground" /><p className="font-medium">Aún no hay archivos</p><p className="text-sm text-muted-foreground">Sube documentos para mantener el perfil completo.</p></div> : <DataTable columns={fileColumns} data={files} searchColumn="name" searchPlaceholder="Buscar archivo..." />}</div>}
                        {activeTab === 'pólizas' && type === 'client' && <div className="grid gap-3 md:grid-cols-2">{policies.length === 0 ? <p className="text-sm text-muted-foreground">Sin pólizas todavía.</p> : policies.map((p) => <div key={p.id} className="rounded-xl border p-4"><p className="font-semibold">{p.product ?? 'Producto'}</p><p className="text-sm text-muted-foreground">Vigencia: {formatDate(p.coverage_start)}</p><p className="mt-2">Prima: {formatMoney(p.risk_premium)}</p><Badge variant="outline" className="mt-2">{p.status ?? 'Sin estatus'}</Badge></div>)}</div>}
                        {activeTab === 'asegurados' && type === 'client' && <DataTable columns={[{ key: 'name', header: 'Nombre completo', accessor: (r) => r.full_name ?? '', cell: (r) => r.full_name ?? '—' }, { key: 'rel', header: 'Parentesco', cell: (r) => r.relationship ?? '—' }, { key: 'age', header: 'Edad', cell: (r) => r.age_current ?? '—' }, { key: 'ac', header: 'Acciones', cell: () => <Button variant="ghost" size="sm">Ver</Button> }]} data={insured} searchColumn="name" />}
                        {activeTab === 'beneficiarios' && type === 'client' && <div className="space-y-4"><div><p className="text-sm text-muted-foreground">Total de distribución</p><div className="mt-2 flex items-center gap-3"><Progress value={Math.min(100, beneficiaryTotal)} className="h-2" /><Badge variant={beneficiaryTotal === 100 ? 'default' : 'secondary'}>Total: {beneficiaryTotal}%</Badge></div>{beneficiaryTotal !== 100 && <p className="mt-2 flex items-center gap-1 text-xs text-amber-600"><AlertCircle className="size-3" /> La suma ideal debe ser 100%.</p>}</div><DataTable columns={[{ key: 'name', header: 'Nombre completo', accessor: (r) => r.full_name ?? '', cell: (r) => r.full_name ?? '—' }, { key: 'percent', header: 'Porcentaje', cell: (r) => `${Number(r.benefit_percentage ?? 0)}%` }]} data={beneficiaries} searchColumn="name" /></div>}
                        {activeTab === 'actividades' && <div className="space-y-4"><h3 className="text-lg font-semibold">Actividades</h3>{trackingItems.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aún no hay actividad registrada.</p> : trackingItems.map((item) => <div key={item.id} className="rounded-xl border-l-4 border-primary bg-muted/20 p-4"><p className="font-medium">{item.activity_type?.name ?? 'Actividad'} · {item.title ?? 'Sin título'}</p><p className="mt-1 text-sm text-muted-foreground">{item.body}</p><p className="mt-2 flex items-center gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {new Date(item.occurred_at).toLocaleString('es-MX')}</span>{item.created_by?.name && <span>{item.created_by.name}</span>}</p></div>)}</div>}
                    </CardContent></Card>
                </div>
            </div>

            <FilePickerDialog open={filesOpen} onOpenChange={setFilesOpen} title="Gestión de archivos" tableId={type === 'client' ? 'clients' : 'leads'} relatedUuid={entity.id} storedFiles={files} />
            <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} itemName={formatName(entity)} entityLabel={type === 'client' ? 'este cliente' : 'este lead'} onConfirm={() => router.delete(type === 'client' ? route('clients.destroy', entity.id) : route('leads.destroy', entity.id), { onSuccess: () => setDeleteOpen(false) })} />
        </AppLayout>
    );
}
