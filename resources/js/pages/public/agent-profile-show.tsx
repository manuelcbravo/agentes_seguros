import { Head, usePage } from '@inertiajs/react';
import {
    Building2,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    ShieldCheck,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SharedData } from '@/types';

type License = {
    id: string;
    num_licencia: string;
    aseguradora: string | null;
    fecha_expiracion: string | null;
};

type Profile = {
    display_name: string;
    headline: string | null;
    bio: string | null;
    brand_color: string | null;
    email_public: string | null;
    phone_public: string | null;
    whatsapp_public: string | null;
    website_url: string | null;
    address_public: string | null;
    city: string | null;
    state: string | null;
    service_areas: string[] | null;
    specialties: string[] | null;
    insurers: string[] | null;
    cta_title: string | null;
    cta_description: string | null;
    public_slug: string;
    contact_form_enabled: boolean;
    profile_photo_url: string | null;
    cover_image_url: string | null;
    logo_url: string | null;
};

export default function PublicAgentProfileShow({
    profile,
    licenses,
    csrfToken,
}: {
    profile: Profile;
    licenses: License[];
    csrfToken: string;
}) {
    const { flash, errors } = usePage<SharedData>().props;

    const location = [profile.city, profile.state].filter(Boolean).join(', ');
    const contactAvailable = Boolean(
        profile.whatsapp_public || profile.phone_public || profile.email_public,
    );

    return (
        <>
            <Head title={`${profile.display_name} | Perfil del agente`} />
            <main className="min-h-screen bg-muted/30 py-10">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
                    <Card className="overflow-hidden border-border/70">
                        {profile.cover_image_url && (
                            <img
                                src={profile.cover_image_url}
                                className="h-40 w-full object-cover md:h-52"
                                alt="Portada del perfil"
                            />
                        )}
                        <CardContent className="space-y-6 p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={
                                            profile.profile_photo_url ??
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=E2E8F0&color=0F172A&size=128`
                                        }
                                        className="size-20 rounded-full border bg-background object-cover"
                                        alt={profile.display_name}
                                    />
                                    <div>
                                        <h1 className="text-2xl font-semibold text-foreground">
                                            {profile.display_name}
                                        </h1>
                                        {profile.headline && (
                                            <p className="text-sm text-muted-foreground">
                                                {profile.headline}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {profile.whatsapp_public && (
                                    <a
                                        href={`https://wa.me/${profile.whatsapp_public.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Button
                                            size="lg"
                                            className="gap-2"
                                            style={
                                                profile.brand_color
                                                    ? {
                                                          backgroundColor:
                                                              profile.brand_color,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <MessageCircle className="size-4" />{' '}
                                            WhatsApp
                                        </Button>
                                    </a>
                                )}
                            </div>

                            {profile.bio && (
                                <p className="leading-relaxed text-muted-foreground">
                                    {profile.bio}
                                </p>
                            )}

                            <div className="grid gap-3 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Especialidades
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap gap-2">
                                        {(profile.specialties ?? []).length ? (
                                            (profile.specialties ?? []).map(
                                                (specialty) => (
                                                    <Badge
                                                        key={specialty}
                                                        variant="secondary"
                                                    >
                                                        {specialty}
                                                    </Badge>
                                                ),
                                            )
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Sin especialidades publicadas.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Aseguradoras
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap gap-2">
                                        {(profile.insurers ?? []).length ? (
                                            (profile.insurers ?? []).map(
                                                (insurer) => (
                                                    <Badge
                                                        key={insurer}
                                                        variant="outline"
                                                    >
                                                        {insurer}
                                                    </Badge>
                                                ),
                                            )
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Sin aseguradoras publicadas.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Contacto y cobertura
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    {profile.email_public && (
                                        <p className="flex items-center gap-2">
                                            <Mail className="size-4" />{' '}
                                            {profile.email_public}
                                        </p>
                                    )}
                                    {profile.phone_public && (
                                        <p className="flex items-center gap-2">
                                            <Phone className="size-4" />{' '}
                                            {profile.phone_public}
                                        </p>
                                    )}
                                    {location && (
                                        <p className="flex items-center gap-2">
                                            <MapPin className="size-4" />{' '}
                                            {location}
                                        </p>
                                    )}
                                    {(profile.service_areas ?? []).length >
                                        0 && (
                                        <p>
                                            Atiendo en:{' '}
                                            {(profile.service_areas ?? []).join(
                                                ', ',
                                            )}
                                        </p>
                                    )}
                                    {!contactAvailable && (
                                        <p>
                                            No hay canales de contacto públicos
                                            por el momento.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {licenses.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <ShieldCheck className="size-4" />{' '}
                                            Licencias vigentes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {licenses.map((license) => (
                                            <div
                                                key={license.id}
                                                className="rounded-md border p-3"
                                            >
                                                <p className="font-medium">
                                                    {license.num_licencia}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {license.aseguradora ??
                                                        'Aseguradora no especificada'}
                                                </p>
                                                {license.fecha_expiracion && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Vence:{' '}
                                                        {
                                                            license.fecha_expiracion
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="size-4" />{' '}
                                {profile.cta_title ?? 'Contáctame'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {profile.cta_description ??
                                    'Completa el formulario y te contactaremos pronto.'}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {!profile.contact_form_enabled ? (
                                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                    El formulario de contacto no está disponible
                                    temporalmente.
                                </p>
                            ) : (
                                <form
                                    method="POST"
                                    action={route(
                                        'public-agent-profile.contact',
                                        profile.public_slug,
                                    )}
                                    className="grid gap-4 md:grid-cols-2"
                                >
                                    <input
                                        type="hidden"
                                        name="_token"
                                        value={csrfToken}
                                    />
                                    <input
                                        type="text"
                                        name="website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        className="hidden"
                                    />
                                    <Field>
                                        <Label htmlFor="name">Nombre</Label>
                                        <Input id="name" name="name" required />
                                        {errors.name && (
                                            <FieldError>
                                                {errors.name}
                                            </FieldError>
                                        )}
                                    </Field>
                                    <Field>
                                        <Label htmlFor="phone">
                                            Teléfono / WhatsApp
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            required
                                        />
                                        {errors.phone && (
                                            <FieldError>
                                                {errors.phone}
                                            </FieldError>
                                        )}
                                    </Field>
                                    <Field>
                                        <Label htmlFor="email">
                                            Email (opcional)
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                        />
                                        {errors.email && (
                                            <FieldError>
                                                {errors.email}
                                            </FieldError>
                                        )}
                                    </Field>
                                    <Field>
                                        <Label htmlFor="product_interest">
                                            Producto de interés
                                        </Label>
                                        <select
                                            id="product_interest"
                                            name="product_interest"
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="">
                                                Selecciona una opción
                                            </option>
                                            {(profile.specialties ?? []).map(
                                                (specialty) => (
                                                    <option
                                                        key={specialty}
                                                        value={specialty}
                                                    >
                                                        {specialty}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        {errors.product_interest && (
                                            <FieldError>
                                                {errors.product_interest}
                                            </FieldError>
                                        )}
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <Label htmlFor="message">Mensaje</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            rows={4}
                                            required
                                        />
                                        {errors.message && (
                                            <FieldError>
                                                {errors.message}
                                            </FieldError>
                                        )}
                                    </Field>
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
                                        <input
                                            type="checkbox"
                                            name="consent"
                                            value="1"
                                        />{' '}
                                        Acepto ser contactado para recibir
                                        información.
                                    </label>
                                    <div className="flex items-center justify-between gap-3 md:col-span-2">
                                        <Button type="submit">Enviar</Button>
                                        {flash?.success && (
                                            <p className="text-sm text-emerald-600">
                                                {flash.success}
                                            </p>
                                        )}
                                        {flash?.error && (
                                            <p className="text-sm text-destructive">
                                                {flash.error}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
