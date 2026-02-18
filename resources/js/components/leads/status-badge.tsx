import { Badge } from '@/components/ui/badge';

const toneByStatus: Record<string, string> = {
    nuevo: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    contacto_intento: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    contactado: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
    perfilado: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    cotizacion_enviada: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    seguimiento: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
    en_tramite: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    ganado: 'bg-green-100 text-green-700 hover:bg-green-100',
    no_interesado: 'bg-rose-100 text-rose-700 hover:bg-rose-100',
};

const labelByStatus: Record<string, string> = {
    nuevo: 'Nuevo',
    contacto_intento: 'Intento de contacto',
    contactado: 'Contactado',
    perfilado: 'Perfilado',
    cotizacion_enviada: 'Cotización enviada',
    seguimiento: 'Seguimiento',
    en_tramite: 'En trámite',
    ganado: 'Ganado',
    no_interesado: 'No interesado',
};

export function statusLabel(status: string): string {
    return labelByStatus[status] ?? status;
}

export function LeadStatusBadge({ status }: { status: string }) {
    return (
        <Badge className={toneByStatus[status] ?? 'bg-slate-100 text-slate-700'} variant="secondary">
            {statusLabel(status)}
        </Badge>
    );
}
