import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BadgeDollarSign, CircleDollarSign, HandCoins, MoreHorizontal, Pencil, Plus, ReceiptText, RefreshCw, Trash2, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type Commission = { id: string; period: string; insurer_name: string; concept: string; reference: string | null; amount: number; applied_amount: number; remaining_amount: number; status: 'pending' | 'cancelled'; status_effective: 'pending' | 'paid' | 'cancelled'; earned_date: string | null; notes: string | null; };
type Payment = { id: string; payment_date: string; insurer_name: string; amount: number; applied_amount: number; remaining_amount: number; reference: string | null; status: 'draft' | 'posted'; notes: string | null; };
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Contabilidad', href: route('accounting.commissions.index') }, { title: 'Comisiones', href: route('accounting.commissions.index') }];

export default function AccountingCommissionsIndex({ commissions, payments, insurers, filters, summary }: { commissions: Commission[]; payments: Payment[]; insurers: string[]; filters: { period: string; insurer_name: string; status_effective: string; q: string }; summary: { pending: number; paid: number; total: number } }) {
    const { flash } = usePage<SharedData>().props;
    const [commissionOpen, setCommissionOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [reconcileOpen, setReconcileOpen] = useState(false);
    const [commissionToCancel, setCommissionToCancel] = useState<Commission | null>(null);
    const [filterState, setFilterState] = useState(filters);

    const commissionForm = useForm({ id: null as string | null, insurer_name: '', concept: '', reference: '', period: '', earned_date: '', amount: '', currency: 'MXN', status: 'pending', notes: '' });
    const paymentForm = useForm({ id: null as string | null, insurer_name: '', payment_date: '', amount: '', currency: 'MXN', reference: '', status: 'posted', notes: '' });
    const reconcileForm = useForm({ payment_id: '', lines: [] as Array<{ commission_id: string; amount_applied: string }> });

    useEffect(() => { if (flash?.success) toast.success(flash.success); if (flash?.error) toast.error(flash.error); }, [flash?.error, flash?.success]);

    const currency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    const pendingCommissions = useMemo(() => commissions.filter((c) => c.status_effective === 'pending'), [commissions]);
    const selectedPayment = payments.find((payment) => payment.id === reconcileForm.data.payment_id);
    const totalToApply = reconcileForm.data.lines.reduce((sum, line) => sum + (Number(line.amount_applied) || 0), 0);

    const commissionColumns: DataTableColumn<Commission>[] = [
        { key: 'period', header: 'Periodo' }, { key: 'insurer_name', header: 'Aseguradora' }, { key: 'concept', header: 'Concepto' },
        { key: 'reference', header: 'Referencia', cell: (row) => row.reference ?? '—' },
        { key: 'amount', header: 'Monto', cell: (row) => currency(row.amount) },
        { key: 'apply', header: 'Aplicado / Restante', cell: (row) => `${currency(row.applied_amount)} / ${currency(row.remaining_amount)}` },
        { key: 'status', header: 'Estatus', cell: (row) => <Badge variant={row.status_effective === 'paid' ? 'secondary' : row.status_effective === 'cancelled' ? 'destructive' : 'outline'}>{row.status_effective === 'paid' ? 'Pagada' : row.status_effective === 'cancelled' ? 'Cancelada' : 'Pendiente'}</Badge> },
        { key: 'actions', header: '', className: 'w-12', cell: (row) => <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { commissionForm.setData({ id: row.id, insurer_name: row.insurer_name, concept: row.concept, reference: row.reference ?? '', period: row.period, earned_date: row.earned_date ?? '', amount: String(row.amount), currency: 'MXN', status: row.status, notes: row.notes ?? '' }); setCommissionOpen(true); }}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>{row.status_effective === 'pending' && <DropdownMenuItem onClick={() => { setReconcileOpen(true); reconcileForm.setData('lines', [{ commission_id: row.id, amount_applied: '' }]); }}><HandCoins className="mr-2 size-4" />Conciliar con pago</DropdownMenuItem>}<DropdownMenuItem onClick={() => setCommissionToCancel(row)} className="text-destructive"><Trash2 className="mr-2 size-4" />Cancelar</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
    ];

    const paymentColumns: DataTableColumn<Payment>[] = [
        { key: 'payment_date', header: 'Fecha' }, { key: 'insurer_name', header: 'Aseguradora' },
        { key: 'amount', header: 'Monto', cell: (row) => currency(row.amount) }, { key: 'applied', header: 'Aplicado', cell: (row) => currency(row.applied_amount) }, { key: 'remaining', header: 'Restante', cell: (row) => currency(row.remaining_amount) },
        { key: 'reference', header: 'Referencia', cell: (row) => row.reference ?? '—' },
        { key: 'actions', header: '', className: 'w-12', cell: (row) => <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { paymentForm.setData({ id: row.id, insurer_name: row.insurer_name, payment_date: row.payment_date, amount: String(row.amount), currency: 'MXN', reference: row.reference ?? '', status: row.status, notes: row.notes ?? '' }); setPaymentOpen(true); }}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => { reconcileForm.setData('payment_id', row.id); setReconcileOpen(true); }}><RefreshCw className="mr-2 size-4" />Conciliar</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}><Head title="Comisiones" />
        <div className="space-y-4 rounded-xl p-4">
            <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Wallet className="size-5 text-primary" /><div><h1 className="text-xl font-semibold">Comisiones</h1><p className="text-sm text-muted-foreground">Libro de comisiones y conciliación de pagos.</p></div></div><div className="flex gap-2"><Button variant="outline" onClick={() => { paymentForm.reset(); setPaymentOpen(true); }}><Plus className="mr-2 size-4" />Nuevo pago</Button><Button onClick={() => { commissionForm.reset(); setCommissionOpen(true); }}><Plus className="mr-2 size-4" />Nueva comisión</Button></div></div></div>
            <div className="grid gap-3 md:grid-cols-3"><Card><CardHeader><CardTitle className="text-sm">Pendientes</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-xl font-semibold"><BadgeDollarSign className="size-5 text-amber-600" />{currency(summary.pending)}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Pagadas</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-xl font-semibold"><CircleDollarSign className="size-5 text-emerald-600" />{currency(summary.paid)}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Total del periodo</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-xl font-semibold"><ReceiptText className="size-5 text-primary" />{currency(summary.total)}</CardContent></Card></div>
            <div className="rounded-xl border p-4"><div className="grid gap-3 md:grid-cols-5"><Input placeholder="Periodo (YYYY-MM)" value={filterState.period} onChange={(e) => setFilterState((s) => ({ ...s, period: e.target.value }))} /><Input placeholder="Aseguradora" list="insurers" value={filterState.insurer_name} onChange={(e) => setFilterState((s) => ({ ...s, insurer_name: e.target.value }))} /><datalist id="insurers">{insurers.map((insurer) => <option key={insurer} value={insurer} />)}</datalist><Input placeholder="Estatus" value={filterState.status_effective} onChange={(e) => setFilterState((s) => ({ ...s, status_effective: e.target.value }))} /><Input placeholder="Búsqueda" value={filterState.q} onChange={(e) => setFilterState((s) => ({ ...s, q: e.target.value }))} /><Button onClick={() => router.get(route('accounting.commissions.index'), filterState, { preserveState: true, preserveScroll: true })}>Aplicar filtros</Button></div></div>
            <DataTable columns={commissionColumns} data={commissions} searchColumn="concept" searchPlaceholder="Buscar comisiones..." />
            <div className="rounded-xl border p-4"><h2 className="mb-3 text-lg font-semibold">Pagos</h2><DataTable columns={paymentColumns} data={payments} searchColumn="insurer_name" searchPlaceholder="Buscar pagos..." /></div>
        </div>

        <CrudFormDialog open={commissionOpen} onOpenChange={setCommissionOpen} title={commissionForm.data.id ? 'Editar comisión' : 'Nueva comisión'} description="Registra comisiones manuales por periodo." submitLabel="Guardar" processing={commissionForm.processing} onSubmit={(e) => { e.preventDefault(); commissionForm.post(route('accounting.commissions.store'), { onSuccess: () => { setCommissionOpen(false); commissionForm.reset(); }, onError: () => toast.error('Verifica los campos de la comisión.'), preserveScroll: true }); }}>
            <div className="grid gap-3 md:grid-cols-2"><Field><Label>Aseguradora</Label><Input value={commissionForm.data.insurer_name} onChange={(e) => commissionForm.setData('insurer_name', e.target.value)} /><FieldError message={commissionForm.errors.insurer_name} /></Field><Field><Label>Concepto</Label><Input value={commissionForm.data.concept} onChange={(e) => commissionForm.setData('concept', e.target.value)} /><FieldError message={commissionForm.errors.concept} /></Field><Field><Label>Periodo</Label><Input placeholder="YYYY-MM" value={commissionForm.data.period} onChange={(e) => commissionForm.setData('period', e.target.value)} /><FieldError message={commissionForm.errors.period} /></Field><Field><Label>Monto</Label><Input type="number" step="0.01" value={commissionForm.data.amount} onChange={(e) => commissionForm.setData('amount', e.target.value)} /><FieldError message={commissionForm.errors.amount} /></Field><Field><Label>Referencia</Label><Input value={commissionForm.data.reference} onChange={(e) => commissionForm.setData('reference', e.target.value)} /></Field><Field><Label>Fecha devengada</Label><Input type="date" value={commissionForm.data.earned_date} onChange={(e) => commissionForm.setData('earned_date', e.target.value)} /></Field></div><Field><Label>Notas</Label><Textarea value={commissionForm.data.notes} onChange={(e) => commissionForm.setData('notes', e.target.value)} /></Field>
        </CrudFormDialog>

        <CrudFormDialog open={paymentOpen} onOpenChange={setPaymentOpen} title={paymentForm.data.id ? 'Editar pago' : 'Nuevo pago'} description="Registra depósitos o pagos para conciliar." submitLabel="Guardar" processing={paymentForm.processing} onSubmit={(e) => { e.preventDefault(); paymentForm.post(route('accounting.commission_payments.store'), { onSuccess: () => { setPaymentOpen(false); paymentForm.reset(); }, onError: () => toast.error('No se pudo guardar el pago.'), preserveScroll: true }); }}>
            <div className="grid gap-3 md:grid-cols-2"><Field><Label>Aseguradora</Label><Input value={paymentForm.data.insurer_name} onChange={(e) => paymentForm.setData('insurer_name', e.target.value)} /><FieldError message={paymentForm.errors.insurer_name} /></Field><Field><Label>Fecha de pago</Label><Input type="date" value={paymentForm.data.payment_date} onChange={(e) => paymentForm.setData('payment_date', e.target.value)} /><FieldError message={paymentForm.errors.payment_date} /></Field><Field><Label>Monto</Label><Input type="number" step="0.01" value={paymentForm.data.amount} onChange={(e) => paymentForm.setData('amount', e.target.value)} /><FieldError message={paymentForm.errors.amount} /></Field><Field><Label>Referencia</Label><Input value={paymentForm.data.reference} onChange={(e) => paymentForm.setData('reference', e.target.value)} /></Field></div><Field><Label>Notas</Label><Textarea value={paymentForm.data.notes} onChange={(e) => paymentForm.setData('notes', e.target.value)} /></Field>
        </CrudFormDialog>

        <Dialog open={reconcileOpen} onOpenChange={setReconcileOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Conciliar pago</DialogTitle><DialogDescription>Asigna montos de un pago a comisiones pendientes.</DialogDescription></DialogHeader><div className="space-y-3"><Field><Label>Pago</Label><select className="w-full rounded-md border bg-background p-2" value={reconcileForm.data.payment_id} onChange={(e) => reconcileForm.setData('payment_id', e.target.value)}><option value="">Selecciona un pago</option>{payments.map((p) => <option key={p.id} value={p.id}>{p.payment_date} · {p.insurer_name} · {currency(p.remaining_amount)}</option>)}</select></Field><div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">{pendingCommissions.map((commission) => { const line = reconcileForm.data.lines.find((item) => item.commission_id === commission.id); return <div key={commission.id} className="grid gap-2 md:grid-cols-[1fr_180px]"><div><p className="font-medium">{commission.period} · {commission.concept}</p><p className="text-xs text-muted-foreground">{commission.insurer_name} · Restante {currency(commission.remaining_amount)}</p></div><Input type="number" step="0.01" value={line?.amount_applied ?? ''} onChange={(e) => { const next = reconcileForm.data.lines.filter((item) => item.commission_id !== commission.id); if (e.target.value) next.push({ commission_id: commission.id, amount_applied: e.target.value }); reconcileForm.setData('lines', next); }} placeholder="Monto aplicado" /></div>; })}</div><div className="rounded-md border bg-muted/40 p-3 text-sm"><p>Total a aplicar: <strong>{currency(totalToApply)}</strong></p><p>Saldo del pago: <strong>{currency(selectedPayment?.remaining_amount ?? 0)}</strong></p></div><Button disabled={totalToApply <= 0} onClick={() => reconcileForm.post(route('accounting.commissions.reconcile.store'), { onSuccess: () => { setReconcileOpen(false); reconcileForm.reset(); }, onError: () => toast.error('No se pudo completar la conciliación.'), preserveScroll: true })}>Guardar conciliación</Button></div></DialogContent></Dialog>

        <ConfirmDeleteDialog open={Boolean(commissionToCancel)} onOpenChange={(open) => !open && setCommissionToCancel(null)} title="Cancelar comisión" entityLabel="la comisión seleccionada" onConfirm={() => { if (!commissionToCancel) return; router.patch(route('accounting.commissions.cancel', commissionToCancel.id), {}, { onSuccess: () => setCommissionToCancel(null), preserveScroll: true }); }} />
    </AppLayout>;
}
