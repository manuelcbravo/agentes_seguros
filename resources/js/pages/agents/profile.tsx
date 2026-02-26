import { Head, useForm, usePage } from '@inertiajs/react';
import { ImagePlus, MapPin, Save, Sparkles, UserCircle2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { FilePickerDialog } from '@/components/file-picker-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type AgentProfile = {
    display_name: string;
    headline: string | null;
    bio: string | null;
    profile_photo_url: string | null;
    cover_image_url: string | null;
    email_public: string | null;
    phone_public: string | null;
    whatsapp_public: string | null;
    website_url: string | null;
    city: string | null;
    state: string | null;
    service_areas: string[] | null;
    specialties: string[] | null;
    insurers: string[] | null;
    public_slug: string;
};

type FormData = {
    display_name: string;
    headline: string;
    bio: string;
    email_public: string;
    phone_public: string;
    whatsapp_public: string;
    website_url: string;
    city: string;
    state: string;
    service_areas_text: string;
    specialties_text: string;
    insurers_text: string;
    profile_photo: File | null;
    cover_image: File | null;
    _method: 'put';
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Perfil', href: route('agents.profile.edit') }];
const toCsv = (values?: string[] | null) => (values ?? []).join(', ');
const toArray = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function AgentsProfilePage({ profile }: { profile: AgentProfile }) {
    const { flash } = usePage<SharedData>().props;
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [coverDialogOpen, setCoverDialogOpen] = useState(false);

    const form = useForm<FormData>({
        display_name: profile.display_name,
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        email_public: profile.email_public ?? '',
        phone_public: profile.phone_public ?? '',
        whatsapp_public: profile.whatsapp_public ?? '',
        website_url: profile.website_url ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        service_areas_text: toCsv(profile.service_areas),
        specialties_text: toCsv(profile.specialties),
        insurers_text: toCsv(profile.insurers),
        profile_photo: null,
        cover_image: null,
        _method: 'put',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            service_areas: toArray(data.service_areas_text),
            specialties: toArray(data.specialties_text),
            insurers: toArray(data.insurers_text),
        }));

        form.post(route('agents.profile.update'), {
            forceFormData: true,
            onError: () => toast.error('Verifica los campos marcados.'),
            onSuccess: () => form.reset('profile_photo', 'cover_image'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Perfil" />
            <form className="space-y-6 p-4" onSubmit={onSubmit}>
                <div className="flex items-center justify-between rounded-xl border bg-card p-4">
                    <div>
                        <h1 className="text-xl font-semibold">Perfil</h1>
                        <p className="text-sm text-muted-foreground">Edita únicamente la información pública de tu perfil.</p>
                    </div>
                    <Button disabled={form.processing} type="submit"><Save className="mr-2 size-4" />Guardar cambios</Button>
                </div>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><UserCircle2 className="size-4" />Identidad</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <Field><Label>Nombre público</Label><Input value={form.data.display_name} onChange={(e) => form.setData('display_name', e.target.value)} />{form.errors.display_name && <FieldError>{form.errors.display_name}</FieldError>}</Field>
                        <Field><Label>Titular</Label><Input value={form.data.headline} onChange={(e) => form.setData('headline', e.target.value)} />{form.errors.headline && <FieldError>{form.errors.headline}</FieldError>}</Field>
                        <Field className="md:col-span-2"><Label>Biografía</Label><Textarea rows={5} value={form.data.bio} onChange={(e) => form.setData('bio', e.target.value)} />{form.errors.bio && <FieldError>{form.errors.bio}</FieldError>}</Field>
                        <Field className="md:col-span-2"><Label>Slug público</Label><p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium">/a/{profile.public_slug || 'tu-slug'}</p><p className="text-xs text-muted-foreground">Este identificador se genera automáticamente y no es editable.</p></Field>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Media</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <Field>
                            <Label>Foto de perfil</Label>
                            <button type="button" onClick={() => setPhotoDialogOpen(true)} className="w-full rounded-lg border border-dashed p-2 text-left">
                                {profile.profile_photo_url ? <img src={profile.profile_photo_url} className="h-32 w-full rounded object-cover" /> : <div className="grid h-32 place-items-center rounded bg-muted"><ImagePlus className="size-5 text-muted-foreground" /></div>}
                            </button>
                            {form.errors.profile_photo && <FieldError>{form.errors.profile_photo}</FieldError>}
                        </Field>
                        <Field>
                            <Label>Portada</Label>
                            <button type="button" onClick={() => setCoverDialogOpen(true)} className="w-full rounded-lg border border-dashed p-2 text-left">
                                {profile.cover_image_url ? <img src={profile.cover_image_url} className="h-32 w-full rounded object-cover" /> : <div className="grid h-32 place-items-center rounded bg-muted"><ImagePlus className="size-5 text-muted-foreground" /></div>}
                            </button>
                            {form.errors.cover_image && <FieldError>{form.errors.cover_image}</FieldError>}
                        </Field>
                    </CardContent>
                </Card>

                <Card><CardHeader><CardTitle>Contacto público</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Email público</Label><Input type="email" value={form.data.email_public} onChange={(e) => form.setData('email_public', e.target.value)} /></Field>
                    <Field><Label>Teléfono público</Label><Input value={form.data.phone_public} onChange={(e) => form.setData('phone_public', e.target.value)} /></Field>
                    <Field><Label>WhatsApp</Label><Input value={form.data.whatsapp_public} onChange={(e) => form.setData('whatsapp_public', e.target.value)} /></Field>
                    <Field><Label>Sitio web</Label><Input value={form.data.website_url} onChange={(e) => form.setData('website_url', e.target.value)} placeholder="https://" />{form.errors.website_url && <FieldError>{form.errors.website_url}</FieldError>}</Field>
                </CardContent></Card>

                <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-4" />Ubicación y cobertura</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Ciudad</Label><Input value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} /></Field>
                    <Field><Label>Estado</Label><Input value={form.data.state} onChange={(e) => form.setData('state', e.target.value)} /></Field>
                    <Field className="md:col-span-2"><Label>Zonas de servicio (coma)</Label><Input value={form.data.service_areas_text} onChange={(e) => form.setData('service_areas_text', e.target.value)} /></Field>
                </CardContent></Card>

                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4" />Especialidades</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
                    <Field><Label>Especialidades (coma)</Label><Input value={form.data.specialties_text} onChange={(e) => form.setData('specialties_text', e.target.value)} /></Field>
                    <Field><Label>Aseguradoras (coma)</Label><Input value={form.data.insurers_text} onChange={(e) => form.setData('insurers_text', e.target.value)} /></Field>
                </CardContent></Card>
            </form>

            <FilePickerDialog
                open={photoDialogOpen}
                onOpenChange={setPhotoDialogOpen}
                title="Subir foto de perfil"
                description="Selecciona una imagen para tu foto de perfil"
                accept="image/*"
                onUpload={(files) => {
                    form.setData('profile_photo', files[0] ?? null);
                    setPhotoDialogOpen(false);
                }}
            />

            <FilePickerDialog
                open={coverDialogOpen}
                onOpenChange={setCoverDialogOpen}
                title="Subir portada"
                description="Selecciona una imagen para tu portada"
                accept="image/*"
                onUpload={(files) => {
                    form.setData('cover_image', files[0] ?? null);
                    setCoverDialogOpen(false);
                }}
            />
        </AppLayout>
    );
}
