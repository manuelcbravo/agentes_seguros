import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, CircleAlert, Clock3, Download, Loader2, RefreshCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type ImportFile = {
    id: string;
    original_filename: string;
    size?: number | null;
    created_at?: string | null;
    url: string;
};

type PolicyAiImport = {
    id: string;
    status: 'uploaded' | 'processing' | 'ready' | 'needs_review' | 'failed';
    created_at: string;
    error_message?: string | null;
    missing_fields?: string[];
    ai_data?: Record<string, any> | null;
    ai_confidence?: Record<string, any> | null;
    files?: ImportFile[];
    files_count?: number;
    primary_filename?: string | null;
    processing_stage?: string | null;
    progress?: number;
};

type ProcessingState = {
    status: PolicyAiImport['status'];
    processing_stage?: string | null;
    progress: number;
    error_message?: string | null;
    missing_fields?: string[];
};

export default function PolicyAiShow({ import: item }: { import: PolicyAiImport }) {
    const { flash } = usePage<SharedData>().props;
    const [processingState, setProcessingState] = useState<ProcessingState>({
        status: item.status,
        processing_stage: item.processing_stage,
        progress: item.progress ?? 0,
        error_message: item.error_message,
        missing_fields: item.missing_fields ?? [],
    });

    useEffect(() => {
        setProcessingState({
            status: item.status,
            processing_stage: item.processing_stage,
            progress: item.progress ?? 0,
            error_message: item.error_message,
            missing_fields: item.missing_fields ?? [],
        });
    }, [item.error_message, item.processing_stage, item.progress, item.status]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.error, flash?.success]);

    useEffect(() => {
        if (processingState.status !== 'processing') {
            return;
        }

        const timer = window.setInterval(async () => {
            const response = await fetch(route('polizas.ia.status', item.id), {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as ProcessingState;
            setProcessingState({
                status: payload.status,
                processing_stage: payload.processing_stage,
                progress: payload.progress ?? 0,
                error_message: payload.error_message,
                missing_fields: payload.missing_fields ?? [],
            });

            if (payload.status !== 'processing') {
                router.reload({ only: ['import'], preserveScroll: true, preserveState: true });
            }
        }, 3000);

        return () => window.clearInterval(timer);
    }, [item.id, processingState.status]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Pólizas', href: route('polizas.index') },
            { title: 'Pólizas IA', href: route('polizas.ai.index') },
        ],
        [],
    );

    const currentStatus = processingState.status;
    const canProcess = ['uploaded', 'failed', 'needs_review'].includes(currentStatus);
    const canConvert = ['ready', 'needs_review'].includes(currentStatus);

    const stageLabels: Record<string, string> = {
        queued: 'En cola',
        uploading_files: 'Subiendo archivos',
        ai_request: 'Consultando IA',
        parsing: 'Interpretando respuesta',
        saving: 'Guardando resultado',
        done: 'Completado',
        failed: 'Falló el proceso',
    };

    const statusMeta = {
        uploaded: { label: 'Subido', classes: 'bg-slate-500/10 text-slate-700 border-slate-200', icon: <Clock3 className="size-4" /> },
        processing: { label: 'Procesando', classes: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: <Loader2 className="size-4 animate-spin" /> },
        ready: { label: 'Listo', classes: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="size-4" /> },
        needs_review: { label: 'Revisión requerida', classes: 'bg-amber-500/10 text-amber-700 border-amber-200', icon: <CircleAlert className="size-4" /> },
        failed: { label: 'Error', classes: 'bg-red-500/10 text-red-700 border-red-200', icon: <ShieldAlert className="size-4" /> },
    }[currentStatus];

    const aiData = item.ai_data ?? {};
    const contractor = aiData.contractor ?? {};
    const insured = aiData.insured ?? {};
    const beneficiaries = Array.isArray(aiData.beneficiaries) ? aiData.beneficiaries : [];
    const policy = aiData.policy ?? {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pólizas IA · Detalle" />

            <div className="space-y-6 p-4">
                <Card className="rounded-2xl border-sidebar-border/70 bg-sidebar-accent/20">
                    <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 text-primary">
                                <Sparkles className="size-5" />
                                <span className="text-sm font-medium">Análisis IA</span>
                            </div>
                            <h1 className="text-2xl font-semibold">Análisis IA — {item.primary_filename ?? 'Documento sin nombre'}</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                disabled={!canProcess || processingState.status === 'processing'}
                                onClick={() => {
                                    router.post(route('polizas.ia.process', item.id), {}, {
                                        onSuccess: () => toast.success('Procesamiento de IA iniciado'),
                                        onError: () => toast.error('No se pudo iniciar el procesamiento'),
                                    });
                                }}
                            >
                                {processingState.status === 'processing' ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" /> Procesando...
                                    </>
                                ) : (
                                    'Procesar con IA'
                                )}
                            </Button>
                            {canConvert && (
                                <Button variant="outline" onClick={() => router.post(route('polizas.ai.convert', item.id))}>
                                    Convertir a póliza
                                </Button>
                            )}
                            <Button variant="ghost" onClick={() => router.reload({ only: ['import'], preserveScroll: true })}>
                                <RefreshCcw className="mr-2 size-4" /> Actualizar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {processingState.status === 'processing' && (
                    <Card className="rounded-2xl border-blue-200/70 bg-blue-50/40">
                        <CardContent className="space-y-3 p-6">
                            <div className="flex items-center justify-between text-sm font-medium text-blue-700">
                                <span>Etapa: {stageLabels[processingState.processing_stage ?? ''] ?? processingState.processing_stage ?? 'Iniciando'}</span>
                                <span>{processingState.progress}%</span>
                            </div>
                            <Progress value={processingState.progress} className="h-2" />
                        </CardContent>
                    </Card>
                )}

                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">Estado del procesamiento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Badge variant="outline" className={`inline-flex items-center gap-2 ${statusMeta.classes}`}>
                            {statusMeta.icon}
                            {statusMeta.label}
                        </Badge>

                        {currentStatus === 'failed' && (processingState.error_message || item.error_message) && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Error en el análisis</AlertTitle>
                                <AlertDescription>{processingState.error_message ?? item.error_message}</AlertDescription>
                            </Alert>
                        )}

                        {currentStatus === 'needs_review' && (processingState.missing_fields ?? item.missing_fields ?? []).length > 0 && (
                            <Alert>
                                <CircleAlert className="size-4" />
                                <AlertTitle>Campos críticos faltantes</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-inside list-disc text-sm">
                                        {(processingState.missing_fields ?? item.missing_fields ?? []).map((field) => (
                                            <li key={field}>{field}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-base">Archivos</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm"><tbody>{(item.files ?? []).map((file) => (<tr key={file.id} className="border-t"><td className="px-4 py-3 font-medium">{file.original_filename}</td><td className="px-4 py-3 text-muted-foreground">{file.size ? `${Math.max(1, Math.round(file.size / 1024))} KB` : '—'}</td><td className="px-4 py-3 text-muted-foreground">{file.created_at ? new Date(file.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td><td className="px-4 py-3"><a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline"><Download className="mr-1 size-4" /> Descargar</a></td></tr>))}</tbody></table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-base">Resultado IA</CardTitle></CardHeader>
                    <CardContent>
                        {['ready', 'needs_review'].includes(currentStatus) ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <Card><CardHeader><CardTitle className="text-sm">Datos de póliza</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No. póliza: {policy.policy_number ?? '—'}<br />Aseguradora: {policy.insurer_name ?? '—'}</CardContent></Card>
                                <Card><CardHeader><CardTitle className="text-sm">Contratante</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{[contractor.first_name, contractor.last_name].filter(Boolean).join(' ') || '—'}</CardContent></Card>
                                <Card><CardHeader><CardTitle className="text-sm">Asegurado</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{[insured.first_name, insured.last_name].filter(Boolean).join(' ') || '—'}</CardContent></Card>
                                <Card><CardHeader><CardTitle className="text-sm">Beneficiarios</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{beneficiaries.length > 0 ? beneficiaries.length : 'Sin beneficiarios detectados'}</CardContent></Card>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Este archivo aún no ha sido procesado con IA.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
