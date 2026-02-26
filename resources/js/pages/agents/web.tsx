import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ExternalLink, Globe, Save } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type LeadRow = { id: string; full_name: string; phone: string | null; product_interest: string | null; created_at: string | null };
type Props = {
    profile: {
        public_slug: string;
        is_public_enabled: boolean;
        contact_form_enabled: boolean;
        show_licenses: boolean;
        last_published_at: string | null;
    };
    metrics: {
        views_last_30_days: number;
        views_total: number;
        leads_last_30_days: number;
        conversion_rate: number;
        recent_profile_leads: LeadRow[];
    };
    profile_completion_warnings: {
        missing_profile_photo: boolean;
        missing_phone_or_whatsapp: boolean;
        missing_bio: boolean;
    };
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Web', href: route('agents.web.edit') }];
const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n);

export default function AgentsWebPage({ profile, metrics, profile_completion_warnings: warnings }: Props) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({
        is_public_enabled: profile.is_public_enabled,
        contact_form_enabled: profile.contact_form_enabled,
        show_licenses: profile.show_licenses,
        _method: 'put' as const,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const siteHref = profile.is_public_enabled ? route('public-agent-profile.show', profile.public_slug) : route('public-agent-profile.preview', profile.public_slug);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Web" />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
                    <div>
                        <h1 className="text-xl font-semibold">Web</h1>
                        <p className="text-sm text-muted-foreground">Administra tu sitio público y monitorea resultados.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline"><Link href={siteHref} target="_blank"><ExternalLink className="mr-2 size-4" />Abrir sitio</Link></Button>
                        <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal"><Checkbox checked={form.data.is_public_enabled} onCheckedChange={(v) => form.setData('is_public_enabled', Boolean(v))} />Sitio publicado</Label>
                        <Button onClick={() => form.put(route('agents.web.update'))} disabled={form.processing}><Save className="mr-2 size-4" />Guardar</Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    <Card><CardHeader><CardTitle>Estado</CardTitle></CardHeader><CardContent><Badge variant={form.data.is_public_enabled ? 'default' : 'outline'}>{form.data.is_public_enabled ? 'Publicado' : 'Borrador'}</Badge></CardContent></Card>
                    <Card><CardHeader><CardTitle>Vistas últimos 30 días</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{fmt(metrics.views_last_30_days)}</CardContent></Card>
                    <Card><CardHeader><CardTitle>Leads últimos 30 días</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{fmt(metrics.leads_last_30_days)}</CardContent></Card>
                    <Card><CardHeader><CardTitle>Conversión simple</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{metrics.conversion_rate}%</CardContent></Card>
                    <Card><CardHeader><CardTitle>Última publicación</CardTitle></CardHeader><CardContent className="text-sm">{profile.last_published_at ? new Date(profile.last_published_at).toLocaleString('es-MX') : 'Sin publicar'}</CardContent></Card>
                </div>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="size-4" />Configuración Web</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                            <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal"><Checkbox checked={form.data.is_public_enabled} onCheckedChange={(v) => form.setData('is_public_enabled', Boolean(v))} />Sitio publicado</Label>
                            <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal"><Checkbox checked={form.data.contact_form_enabled} onCheckedChange={(v) => form.setData('contact_form_enabled', Boolean(v))} />Formulario de contacto</Label>
                            <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal"><Checkbox checked={form.data.show_licenses} onCheckedChange={(v) => form.setData('show_licenses', Boolean(v))} />Mostrar licencias</Label>
                        </div>
                        {(warnings.missing_bio || warnings.missing_phone_or_whatsapp || warnings.missing_profile_photo) && (
                            <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                                <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" />Te recomendamos completar estos datos de perfil:</p>
                                {warnings.missing_profile_photo && <p>• Falta foto de perfil.</p>}
                                {warnings.missing_phone_or_whatsapp && <p>• Falta teléfono o WhatsApp.</p>}
                                {warnings.missing_bio && <p>• Falta biografía.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Últimos leads del sitio</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Producto de interés</TableHead><TableHead></TableHead></TableRow></TableHeader>
                            <TableBody>
                                {metrics.recent_profile_leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>{lead.created_at ? new Date(lead.created_at).toLocaleString('es-MX') : '—'}</TableCell>
                                        <TableCell>{lead.full_name}</TableCell>
                                        <TableCell>{lead.phone ?? '—'}</TableCell>
                                        <TableCell>{lead.product_interest ?? '—'}</TableCell>
                                        <TableCell><Button asChild variant="outline" size="sm"><Link href={route('leads.profile.show', lead.id)}>Ver lead</Link></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
