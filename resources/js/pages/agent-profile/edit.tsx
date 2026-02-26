import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Eye, Globe, ImagePlus, MapPin, Save, Sparkles, UserCircle2, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type RecentProfileLead = {
    id: string;
    full_name: string;
    source: string;
    created_at: string | null;
};

type AgentProfileSummary = {
    views_today: number;
    views_last_30_days: number;
    leads_last_7_days: number;
    leads_last_30_days: number;
    leads_total: number;
    conversion_rate: number;
    recent_profile_leads: RecentProfileLead[];
};

type AgentProfile = {
    display_name: string;
    headline: string | null;
    bio: string | null;
    profile_photo_url: string | null;
    cover_image_url: string | null;
    logo_url: string | null;
    brand_color: string | null;
    email_public: string | null;
    phone_public: string | null;
    whatsapp_public: string | null;
    website_url: string | null;
    address_public: string | null;
    city: string | null;
    state: string | null;
    service_areas: string[] | null;
    languages: string[] | null;
    working_hours: Record<string, string> | null;
    specialties: string[] | null;
    insurers: string[] | null;
    cta_title: string | null;
    cta_description: string | null;
    public_slug: string;
    is_public_enabled: boolean;
    contact_form_enabled: boolean;
    show_licenses: boolean;
    last_published_at: string | null;
};

type FormData = {
    display_name: string;
    headline: string;
    bio: string;
    brand_color: string;
    email_public: string;
    phone_public: string;
    whatsapp_public: string;
    website_url: string;
    address_public: string;
    city: string;
    state: string;
    service_areas_text: string;
    languages_text: string;
    specialties_text: string;
    insurers_text: string;
    working_hours_text: string;
    cta_title: string;
    cta_description: string;
    public_slug: string;
    is_public_enabled: boolean;
    contact_form_enabled: boolean;
    show_licenses: boolean;
    profile_photo: File | null;
    cover_image: File | null;
    logo_image: File | null;
    _method: 'put';
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Perfil', href: route('agent-profile.edit') }];
const toCsv = (values?: string[] | null) => (values ?? []).join(', ');
const toArray = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const formatNumber = (value: number) => new Intl.NumberFormat('es-MX').format(value);

export default function AgentProfileEdit({ profile, summary }: { profile: AgentProfile; summary: AgentProfileSummary }) {
    const { flash } = usePage<SharedData>().props;

    const form = useForm<FormData>({
        display_name: profile.display_name,
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        brand_color: profile.brand_color ?? '',
        email_public: profile.email_public ?? '',
        phone_public: profile.phone_public ?? '',
        whatsapp_public: profile.whatsapp_public ?? '',
        website_url: profile.website_url ?? '',
        address_public: profile.address_public ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        service_areas_text: toCsv(profile.service_areas),
        languages_text: toCsv(profile.languages),
        specialties_text: toCsv(profile.specialties),
        insurers_text: toCsv(profile.insurers),
        working_hours_text: profile.working_hours ? JSON.stringify(profile.working_hours, null, 2) : '',
        cta_title: profile.cta_title ?? '',
        cta_description: profile.cta_description ?? '',
        public_slug: profile.public_slug,
        is_public_enabled: profile.is_public_enabled,
        contact_form_enabled: profile.contact_form_enabled,
        show_licenses: profile.show_licenses,
        profile_photo: null,
        cover_image: null,
        logo_image: null,
        _method: 'put',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let workingHours: Record<string, string> | null = {};
        if (form.data.working_hours_text.trim()) {
            try {
                workingHours = JSON.parse(form.data.working_hours_text);
            } catch {
                toast.error('El JSON de horario no es válido.');
                return;
            }
        }

        form.transform((data) => ({
            ...data,
            service_areas: toArray(data.service_areas_text),
            languages: toArray(data.languages_text),
            specialties: toArray(data.specialties_text),
            insurers: toArray(data.insurers_text),
            working_hours: workingHours,
        }));

        form.post(route('agent-profile.update'), {
            forceFormData: true,
            onError: () => toast.error('Verifica los campos marcados.'),
            onSuccess: () => form.reset('profile_photo', 'cover_image', 'logo_image'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Perfil del agente" />
            <form onSubmit={onSubmit} className="space-y-4 rounded-xl p-4">
                <div className="space-y-4 rounded-xl">
                    <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <UserCircle2 className="size-5 text-primary" />
                                <div>
                                    <h1 className="text-xl font-semibold">Perfil público del agente</h1>
                                    <p className="text-sm text-muted-foreground">Configura tu presencia digital, canales de contacto y propuesta de valor.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={form.data.is_public_enabled ? 'default' : 'outline'}>
                                    {form.data.is_public_enabled ? 'Publicado' : 'Borrador'}
                                </Badge>
                                <Button type="submit" disabled={form.processing}>
                                    <Save className="mr-2 size-4" />
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Resumen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Vistas hoy</p>
                                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                                    <Eye className="size-4 text-primary" />
                                    {formatNumber(summary.views_today)}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Vistas últimos 30 días</p>
                                <p className="mt-2 text-2xl font-semibold">{formatNumber(summary.views_last_30_days)}</p>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Leads últimos 30 días</p>
                                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                                    <Users className="size-4 text-primary" />
                                    {formatNumber(summary.leads_last_30_days)}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversion rate</p>
                                <p className="mt-2 text-2xl font-semibold">{summary.conversion_rate}%</p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                                <p className="font-medium">Leads 7 días</p>
                                <p className="text-muted-foreground">{formatNumber(summary.leads_last_7_days)} nuevos contactos recientes.</p>
                            </div>
                            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                                <p className="font-medium">Leads acumulados</p>
                                <p className="text-muted-foreground">{formatNumber(summary.leads_total)} leads totales desde perfil web.</p>
                            </div>
                            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                                <p className="font-medium">Recomendación</p>
                                <p className="text-muted-foreground">Refuerza CTA y WhatsApp si tienes muchas vistas con baja conversión.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border">
                            <div className="border-b px-4 py-3 text-sm font-medium">Últimos leads del perfil</div>
                            <div className="divide-y">
                                {summary.recent_profile_leads.length === 0 ? (
                                    <p className="px-4 py-3 text-sm text-muted-foreground">Aún no hay leads captados desde tu perfil público.</p>
                                ) : (
                                    summary.recent_profile_leads.map((lead) => (
                                        <div key={lead.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                                            <div>
                                                <p className="font-medium">{lead.full_name || 'Lead sin nombre'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {lead.created_at ? new Date(lead.created_at).toLocaleString('es-MX') : 'Sin fecha'} · Perfil web
                                                </p>
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={route('leads.show', lead.id)}>Ver lead</Link>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4" />Identidad visual y mensaje</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <Field><Label>Nombre para mostrar</Label><Input value={form.data.display_name} onChange={(e) => form.setData('display_name', e.target.value)} />{form.errors.display_name && <FieldError>{form.errors.display_name}</FieldError>}</Field>
                        <Field><Label>Titular</Label><Input value={form.data.headline} onChange={(e) => form.setData('headline', e.target.value)} />{form.errors.headline && <FieldError>{form.errors.headline}</FieldError>}</Field>
                        <Field className="md:col-span-2"><Label>Bio</Label><Textarea rows={4} value={form.data.bio} onChange={(e) => form.setData('bio', e.target.value)} />{form.errors.bio && <FieldError>{form.errors.bio}</FieldError>}</Field>
                        <Field><Label>Foto de perfil</Label><div className="rounded-lg border border-dashed p-2">{profile.profile_photo_url ? <img src={profile.profile_photo_url} className="h-28 w-full rounded object-cover" /> : <div className="grid h-28 place-items-center rounded bg-muted"><ImagePlus className="size-5 text-muted-foreground" /></div>}</div><Input type="file" accept="image/*" onChange={(e) => form.setData('profile_photo', e.target.files?.[0] ?? null)} />{form.errors.profile_photo && <FieldError>{form.errors.profile_photo}</FieldError>}</Field>
                        <Field><Label>Portada</Label><div className="rounded-lg border border-dashed p-2">{profile.cover_image_url ? <img src={profile.cover_image_url} className="h-28 w-full rounded object-cover" /> : <div className="grid h-28 place-items-center rounded bg-muted"><ImagePlus className="size-5 text-muted-foreground" /></div>}</div><Input type="file" accept="image/*" onChange={(e) => form.setData('cover_image', e.target.files?.[0] ?? null)} />{form.errors.cover_image && <FieldError>{form.errors.cover_image}</FieldError>}</Field>
                        <Field><Label>Logo</Label><div className="rounded-lg border border-dashed p-2">{profile.logo_url ? <img src={profile.logo_url} className="h-28 w-full rounded object-cover" /> : <div className="grid h-28 place-items-center rounded bg-muted"><ImagePlus className="size-5 text-muted-foreground" /></div>}</div><Input type="file" accept="image/*" onChange={(e) => form.setData('logo_image', e.target.files?.[0] ?? null)} />{form.errors.logo_image && <FieldError>{form.errors.logo_image}</FieldError>}</Field>
                        <Field><Label>Color de marca</Label><Input value={form.data.brand_color} onChange={(e) => form.setData('brand_color', e.target.value)} placeholder="#0F172A" />{form.errors.brand_color && <FieldError>{form.errors.brand_color}</FieldError>}</Field>
                    </CardContent>
                </Card>

                <Card><CardHeader><CardTitle>Contacto</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Email público</Label><Input type="email" value={form.data.email_public} onChange={(e) => form.setData('email_public', e.target.value)} /></Field>
                    <Field><Label>Teléfono público</Label><Input value={form.data.phone_public} onChange={(e) => form.setData('phone_public', e.target.value)} /></Field>
                    <Field><Label>WhatsApp</Label><Input value={form.data.whatsapp_public} onChange={(e) => form.setData('whatsapp_public', e.target.value)} /></Field>
                    <Field><Label>Sitio web</Label><Input value={form.data.website_url} onChange={(e) => form.setData('website_url', e.target.value)} placeholder="https://" />{form.errors.website_url && <FieldError>{form.errors.website_url}</FieldError>}</Field>
                </CardContent></Card>

                <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-4" />Ubicación y cobertura</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Ciudad</Label><Input value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} /></Field>
                    <Field><Label>Estado</Label><Input value={form.data.state} onChange={(e) => form.setData('state', e.target.value)} /></Field>
                    <Field className="md:col-span-2"><Label>Dirección pública</Label><Input value={form.data.address_public} onChange={(e) => form.setData('address_public', e.target.value)} /></Field>
                    <Field className="md:col-span-2"><Label>Zonas de servicio (coma)</Label><Input value={form.data.service_areas_text} onChange={(e) => form.setData('service_areas_text', e.target.value)} /></Field>
                    <Field className="md:col-span-2"><Label>Idiomas (coma)</Label><Input value={form.data.languages_text} onChange={(e) => form.setData('languages_text', e.target.value)} /></Field>
                    <Field className="md:col-span-2"><Label>Horario (JSON)</Label><Textarea rows={3} value={form.data.working_hours_text} onChange={(e) => form.setData('working_hours_text', e.target.value)} placeholder='{"lun-vie":"9:00-18:00"}' /></Field>
                </CardContent></Card>

                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4" />Especialidades y oferta</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Especialidades (coma)</Label><Input value={form.data.specialties_text} onChange={(e) => form.setData('specialties_text', e.target.value)} /></Field>
                    <Field><Label>Aseguradoras (coma)</Label><Input value={form.data.insurers_text} onChange={(e) => form.setData('insurers_text', e.target.value)} /></Field>
                    <Field><Label>Título CTA</Label><Input value={form.data.cta_title} onChange={(e) => form.setData('cta_title', e.target.value)} /></Field>
                    <Field><Label>Descripción CTA</Label><Input value={form.data.cta_description} onChange={(e) => form.setData('cta_description', e.target.value)} /></Field>
                </CardContent></Card>

                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Globe className="size-4" />Publicación</CardTitle></CardHeader><CardContent className="space-y-4">
                    <Field><Label>Slug público</Label><Input value={form.data.public_slug} onChange={(e) => form.setData('public_slug', e.target.value.toLowerCase())} />{form.errors.public_slug && <FieldError>{form.errors.public_slug}</FieldError>}<Badge variant="outline">/{form.data.public_slug || 'tu-slug'}</Badge></Field>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal"><Checkbox checked={form.data.is_public_enabled} onCheckedChange={(v) => form.setData('is_public_enabled', Boolean(v))} />Activar perfil web</Label>
                        <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal"><Checkbox checked={form.data.contact_form_enabled} onCheckedChange={(v) => form.setData('contact_form_enabled', Boolean(v))} />Habilitar formulario</Label>
                        <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal"><Checkbox checked={form.data.show_licenses} onCheckedChange={(v) => form.setData('show_licenses', Boolean(v))} />Mostrar licencias</Label>
                    </div>
                    {profile.last_published_at && <p className="text-xs text-muted-foreground">Publicado por última vez: {new Date(profile.last_published_at).toLocaleString('es-MX')}</p>}
                </CardContent></Card>
            </form>
        </AppLayout>
    );
}
