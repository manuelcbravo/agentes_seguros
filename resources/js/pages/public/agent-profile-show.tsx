import { Head, usePage } from '@inertiajs/react';
import {
    Clock3,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Sparkles,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import PublicLayout from '@/layouts/public-layout';
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
    working_hours: string | null;
    show_licenses: boolean;
    service_areas: string[] | null;
    specialties: string[] | null;
    insurers: string[] | null;
    cta_title: string | null;
    cta_description: string | null;
    public_slug: string;
    contact_form_enabled: boolean;
    profile_photo_url: string | null;
    logo_url: string | null;
};

const quickCardClass =
    'rounded-xl border-border/70 bg-card/85 p-4 shadow-sm shadow-black/[0.02]';

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function PublicAgentProfileShow({
    profile,
    licenses,
    csrfToken,
    isPreview,
    webSettingsUrl,
}: {
    profile: Profile;
    licenses: License[];
    csrfToken: string;
    isPreview: boolean;
    webSettingsUrl: string | null;
}) {
    const { flash, errors } = usePage<SharedData>().props;

    const location = [profile.city, profile.state].filter(Boolean).join(', ');
    const specialties = profile.specialties ?? [];
    const insurers = profile.insurers ?? [];
    const serviceAreas = profile.service_areas ?? [];

    return (
        <>
            <Head title={`${profile.display_name} | Perfil profesional`} />
            <PublicLayout
                topbarTitle={profile.display_name || 'Agente'}
                contactHref="#contacto"
                isPreview={isPreview}
                previewSettingsUrl={webSettingsUrl}
            >
                <div className="space-y-10 sm:space-y-14">
                    <section className="space-y-6 rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm sm:p-10">
                        {isPreview && (
                            <Badge
                                variant="outline"
                                className="w-fit border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                            >
                                Vista previa (solo tú la ves)
                            </Badge>
                        )}

                        <div className="grid gap-8 lg:grid-cols-[auto,1fr] lg:items-center">
                            <Avatar className="size-28 border-4 border-background shadow-lg sm:size-36">
                                <AvatarImage
                                    src={profile.profile_photo_url ?? undefined}
                                    alt={profile.display_name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="text-3xl font-semibold">
                                    {getInitials(profile.display_name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                        {profile.display_name}
                                    </h1>
                                    {profile.headline && (
                                        <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                                            {profile.headline}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                    {profile.whatsapp_public && (
                                        <Button
                                            asChild
                                            size="lg"
                                            className="w-full sm:w-auto"
                                            style={
                                                profile.brand_color
                                                    ? {
                                                          backgroundColor:
                                                              profile.brand_color,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <a
                                                href={`https://wa.me/${profile.whatsapp_public.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <MessageCircle className="mr-2 size-4" />
                                                Cotizar por WhatsApp
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                    >
                                        <a href="#contacto">Enviar mensaje</a>
                                    </Button>
                                </div>

                                {specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {specialties.map((specialty) => (
                                            <Badge
                                                key={specialty}
                                                variant="secondary"
                                                className="rounded-full px-3 py-1 text-xs"
                                            >
                                                {specialty}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className={quickCardClass}>
                            <CardContent className="p-0">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Ubicación
                                </p>
                                <p className="mt-2 font-medium">
                                    {location || 'Cobertura digital nacional'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className={quickCardClass}>
                            <CardContent className="p-0">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Horario
                                </p>
                                <p className="mt-2 font-medium">
                                    {profile.working_hours ||
                                        'Atención previa cita'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className={quickCardClass}>
                            <CardContent className="p-0">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Aseguradoras
                                </p>
                                <p className="mt-2 font-medium">
                                    {insurers.length} activas
                                </p>
                            </CardContent>
                        </Card>
                        <Card className={quickCardClass}>
                            <CardContent className="p-0">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Licencias vigentes
                                </p>
                                <p className="mt-2 font-medium">
                                    {profile.show_licenses
                                        ? `${licenses.length} registradas`
                                        : 'No públicas'}
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="space-y-5">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Sobre mí
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Acompañamiento experto para proteger tu
                                patrimonio y tranquilidad.
                            </p>
                        </div>
                        <Card className="rounded-2xl border-border/70">
                            <CardContent className="p-6 leading-relaxed text-muted-foreground sm:p-8">
                                {profile.bio ||
                                    'Este agente aún no agrega descripción. Muy pronto tendrás aquí más detalles sobre su experiencia, enfoque y forma de trabajo.'}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="space-y-5">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Especialidades y productos
                        </h2>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card className="rounded-2xl border-border/70">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Especialidades
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2 pb-6">
                                    {specialties.length > 0 ? (
                                        specialties.map((specialty) => (
                                            <Badge
                                                key={specialty}
                                                variant="secondary"
                                                className="rounded-full px-3 py-1"
                                            >
                                                {specialty}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Especialidades por definir.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-border/70">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Productos más solicitados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-6 text-sm text-muted-foreground">
                                    {specialties.length > 0 ? (
                                        specialties
                                            .slice(0, 3)
                                            .map((specialty) => (
                                                <p
                                                    key={`${specialty}-product`}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Sparkles className="size-4" />
                                                    {specialty}
                                                </p>
                                            ))
                                    ) : (
                                        <p>
                                            Próximamente se publicarán los
                                            productos más solicitados por sus
                                            clientes.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <section className="space-y-5">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Aseguradoras
                        </h2>
                        <Card className="rounded-2xl border-border/70">
                            <CardContent className="flex flex-wrap gap-2 p-6 sm:p-8">
                                {insurers.length > 0 ? (
                                    insurers.map((insurer) => (
                                        <Badge
                                            key={insurer}
                                            variant="outline"
                                            className="rounded-full px-3 py-1"
                                        >
                                            {insurer}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Aseguradoras por publicar.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {profile.show_licenses && (
                        <section className="space-y-5">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Licencias
                            </h2>
                            <Card className="rounded-2xl border-border/70">
                                <CardContent className="space-y-4 p-6 sm:p-8">
                                    {licenses.length > 0 ? (
                                        licenses.map((license) => (
                                            <div
                                                key={license.id}
                                                className="rounded-xl border border-border/60 p-4"
                                            >
                                                <p className="font-medium">
                                                    {license.aseguradora ||
                                                        'Aseguradora no especificada'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Licencia:{' '}
                                                    {license.num_licencia}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {license.fecha_expiracion
                                                        ? `Vigencia hasta: ${license.fecha_expiracion}`
                                                        : 'Vigencia no especificada'}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Licencias no disponibles.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                    )}

                    <section className="space-y-5">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Cobertura
                        </h2>
                        <Card className="rounded-2xl border-border/70">
                            <CardContent className="space-y-4 p-6 sm:p-8">
                                <p className="text-sm text-muted-foreground">
                                    Atiendo en:
                                </p>
                                {serviceAreas.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {serviceAreas.map((area) => (
                                            <Badge
                                                key={area}
                                                variant="secondary"
                                                className="rounded-full px-3 py-1"
                                            >
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Cobertura por confirmar.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <section id="contacto" className="scroll-mt-36 space-y-5">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Contacto
                        </h2>
                        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                            <Card className="rounded-2xl border-border/70">
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        {profile.cta_title ?? 'Contáctame'}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {profile.cta_description ??
                                            'Cuéntame qué estás buscando y te responderé con una propuesta personalizada.'}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {!profile.contact_form_enabled ? (
                                        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                            El formulario de contacto no está
                                            disponible temporalmente.
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
                                                <Label htmlFor="name">
                                                    Nombre
                                                </Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    required
                                                />
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
                                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <option value="">
                                                        Selecciona una opción
                                                    </option>
                                                    {specialties.map(
                                                        (specialty) => (
                                                            <option
                                                                key={specialty}
                                                                value={
                                                                    specialty
                                                                }
                                                            >
                                                                {specialty}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                {errors.product_interest && (
                                                    <FieldError>
                                                        {
                                                            errors.product_interest
                                                        }
                                                    </FieldError>
                                                )}
                                            </Field>

                                            <Field className="md:col-span-2">
                                                <Label htmlFor="message">
                                                    Mensaje
                                                </Label>
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
                                                    className="size-4 rounded border-input"
                                                />
                                                Acepto ser contactado para
                                                recibir información.
                                            </label>

                                            <div className="space-y-2 md:col-span-2">
                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="w-full sm:w-auto"
                                                >
                                                    Enviar mensaje
                                                </Button>
                                                {flash?.success && (
                                                    <p className="text-sm font-medium text-emerald-600">
                                                        {flash.success}
                                                    </p>
                                                )}
                                                {flash?.error && (
                                                    <p className="text-sm font-medium text-destructive">
                                                        {flash.error}
                                                    </p>
                                                )}
                                            </div>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-border/70">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Canales directos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    {profile.whatsapp_public && (
                                        <a
                                            href={`https://wa.me/${profile.whatsapp_public.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 text-foreground hover:text-primary"
                                        >
                                            <MessageCircle className="size-4" />{' '}
                                            WhatsApp
                                        </a>
                                    )}
                                    {profile.phone_public && (
                                        <p className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="size-4" />{' '}
                                            {profile.phone_public}
                                        </p>
                                    )}
                                    {profile.email_public && (
                                        <a
                                            href={`mailto:${profile.email_public}`}
                                            className="flex items-center gap-2 text-foreground hover:text-primary"
                                        >
                                            <Mail className="size-4" />{' '}
                                            {profile.email_public}
                                        </a>
                                    )}
                                    {location && (
                                        <p className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="size-4" />{' '}
                                            {location}
                                        </p>
                                    )}
                                    {profile.working_hours && (
                                        <p className="flex items-center gap-2 text-muted-foreground">
                                            <Clock3 className="size-4" />{' '}
                                            {profile.working_hours}
                                        </p>
                                    )}
                                    <Separator />
                                    <p className="text-xs text-muted-foreground">
                                        Respuesta profesional en el menor tiempo
                                        posible.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            </PublicLayout>
        </>
    );
}
