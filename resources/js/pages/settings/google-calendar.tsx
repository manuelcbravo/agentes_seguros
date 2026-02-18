import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Calendar, type EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import '@fullcalendar/core/index.css';
import '@fullcalendar/daygrid/index.css';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type GoogleCalendarPageProps = SharedData & {
    connected: boolean;
    google_email?: string | null;
    google_calendar_id?: string | null;
    google_connected_at?: string | null;
};

type EventFormState = {
    id?: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    description: string;
    location: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Google Calendar',
        href: '/settings/google-calendar',
    },
];

const emptyForm: EventFormState = {
    title: '',
    start: '',
    end: '',
    allDay: false,
    description: '',
    location: '',
};

export default function GoogleCalendarSettings() {
    const { connected, google_calendar_id, google_connected_at, google_email, flash } = usePage<GoogleCalendarPageProps>().props;
    const [events, setEvents] = useState<EventInput[]>([]);
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [calendarRange, setCalendarRange] = useState<{ start: string; end: string } | null>(null);
    const [form, setForm] = useState<EventFormState>(emptyForm);
    const calendarRef = useRef<HTMLDivElement | null>(null);
    const calendarInstanceRef = useRef<Calendar | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const connectedSince = useMemo(() => {
        if (!google_connected_at) return '—';
        return new Date(google_connected_at).toLocaleString('es-MX');
    }, [google_connected_at]);

    useEffect(() => {
        if (!connected || !calendarRef.current || calendarInstanceRef.current) return;

        const calendar = new Calendar(calendarRef.current, {
            plugins: [dayGridPlugin],
            initialView: 'dayGridMonth',
            locale: 'es',
            height: 'auto',
            events,
            datesSet: (info) => {
                setCalendarRange({ start: info.startStr, end: info.endStr });
            },
            eventClick: (arg) => {
                setForm({
                    id: String(arg.event.id),
                    title: arg.event.title,
                    start: arg.event.start ? toInputDateTime(arg.event.start) : '',
                    end: arg.event.end ? toInputDateTime(arg.event.end) : '',
                    allDay: arg.event.allDay,
                    description: String(arg.event.extendedProps.description ?? ''),
                    location: String(arg.event.extendedProps.location ?? ''),
                });
                setEventModalOpen(true);
            },
        });

        calendar.render();
        calendarInstanceRef.current = calendar;

        return () => {
            calendar.destroy();
            calendarInstanceRef.current = null;
        };
    }, [connected, events]);

    useEffect(() => {
        if (!connected || !calendarRange) return;
        void loadEvents(calendarRange.start, calendarRange.end);
    }, [connected, calendarRange]);

    useEffect(() => {
        if (!calendarInstanceRef.current) return;
        calendarInstanceRef.current.removeAllEvents();
        events.forEach((event) => calendarInstanceRef.current?.addEvent(event));
    }, [events]);

    const loadEvents = async (start: string, end: string) => {
        try {
            const response = await fetch(`/google-calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw await response.json();
            }

            const data = (await response.json()) as EventInput[];
            setEvents(data);
        } catch (error) {
            handleCalendarError(error);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const method = form.id ? 'PUT' : 'POST';
            const url = form.id ? `/google-calendar/events/${form.id}` : '/google-calendar/events';
            const response = await fetch(url, {
                method,
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    title: form.title,
                    start: form.start,
                    end: form.end || null,
                    allDay: form.allDay,
                    description: form.description || null,
                    location: form.location || null,
                }),
            });

            if (!response.ok) {
                throw await response.json();
            }

            toast.success(form.id ? 'Evento actualizado correctamente.' : 'Evento creado correctamente.');
            setEventModalOpen(false);
            setForm(emptyForm);
            if (calendarRange) await loadEvents(calendarRange.start, calendarRange.end);
        } catch (error) {
            handleCalendarError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!form.id) return;
        setSubmitting(true);
        try {
            const response = await fetch(`/google-calendar/events/${form.id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (!response.ok && response.status !== 204) {
                throw await response.json();
            }

            toast.success('Evento eliminado correctamente.');
            setEventModalOpen(false);
            setForm(emptyForm);
            if (calendarRange) await loadEvents(calendarRange.start, calendarRange.end);
        } catch (error) {
            handleCalendarError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateModal = () => {
        const start = new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        setForm({ ...emptyForm, start: toInputDateTime(start), end: toInputDateTime(end) });
        setEventModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Google Calendar" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Google Calendar"
                        description="Conecta tu calendario para gestionar citas y seguimientos desde un solo lugar."
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de la conexión</CardTitle>
                            <CardDescription>
                                Sincroniza tu agenda de Google con tus eventos internos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {connected ? (
                                <>
                                    <p><strong>Correo de Google:</strong> {google_email || 'No disponible'}</p>
                                    <p><strong>Calendario:</strong> {google_calendar_id || 'primary'}</p>
                                    <p><strong>Conectado desde:</strong> {connectedSince}</p>
                                    <Button
                                        variant="destructive"
                                        onClick={() => router.post('/google-calendar/disconnect')}
                                    >
                                        Desconectar
                                    </Button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">
                                        Aún no tienes Google Calendar conectado. Conecta tu cuenta para empezar a crear eventos.
                                    </p>
                                    <Button onClick={() => router.visit('/google-calendar/connect')}>
                                        Conectar con Google
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle>Calendario</CardTitle>
                                <CardDescription>
                                    Visualiza y administra tus eventos en una vista mensual.
                                </CardDescription>
                            </div>
                            <Button disabled={!connected} onClick={openCreateModal}>Nuevo evento</Button>
                        </CardHeader>
                        <CardContent>
                            {connected ? (
                                <div ref={calendarRef} className="min-h-[520px]" />
                            ) : (
                                <p className="text-sm text-muted-foreground">Conecta Google Calendar para ver y gestionar eventos.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>

            <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{form.id ? 'Editar evento' : 'Crear evento'}</DialogTitle>
                        <DialogDescription>
                            Completa la información del evento para sincronizarla con Google Calendar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start">Inicio</Label>
                                <Input id="start" type="datetime-local" value={form.start} onChange={(e) => setForm((prev) => ({ ...prev, start: e.target.value }))} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end">Fin</Label>
                                <Input id="end" type="datetime-local" value={form.end} onChange={(e) => setForm((prev) => ({ ...prev, end: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input id="allDay" type="checkbox" checked={form.allDay} onChange={(e) => setForm((prev) => ({ ...prev, allDay: e.target.checked }))} />
                            <Label htmlFor="allDay">Todo el día</Label>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Ubicación</Label>
                            <Input id="location" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        {form.id && (
                            <Button variant="destructive" disabled={submitting} onClick={handleDelete}>
                                Eliminar
                            </Button>
                        )}
                        <Button disabled={submitting} onClick={handleSubmit}>
                            {form.id ? 'Guardar cambios' : 'Crear evento'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function handleCalendarError(error: unknown) {
    const payload = (error ?? {}) as { message?: string };
    const message = payload.message || 'No se pudo completar la operación con Google Calendar.';
    if (message.includes('expiró')) {
        toast.error('Tu conexión con Google expiró, vuelve a conectar.');
        return;
    }

    toast.error(message);
}

function getCsrfToken(): string {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return token ?? '';
}

function toInputDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
