import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Bot, RefreshCcw, Sparkles, UploadCloud } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type ImportRow = {
    id: string;
    original_filename: string;
    status: 'uploaded' | 'processing' | 'ready' | 'needs_review' | 'failed';
    created_at: string;
    missing_fields: string[];
    error_message?: string | null;
    took_ms?: number | null;
};

export default function PolicyAiIndex({ imports }: any) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({ file: null as File | null });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Pólizas', href: route('polizas.index') },
            { title: 'Pólizas IA', href: route('polizas.ai.index') },
        ],
        [],
    );

    const submitFile = () => {
        if (!form.data.file) return;

        form.post(route('polizas.ai.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.setData('file', null),
        });
    };

    const statusBadge = (status: ImportRow['status']) => {
        if (status === 'ready') return <Badge className="bg-emerald-500/10 text-emerald-700">Listo</Badge>;
        if (status === 'needs_review') return <Badge className="bg-amber-500/10 text-amber-700"><AlertTriangle className="mr-1 size-3" />Revisar</Badge>;
        if (status === 'failed') return <Badge variant="destructive">Falló</Badge>;
        if (status === 'processing') return <Badge className="bg-blue-500/10 text-blue-700">Procesando</Badge>;
        return <Badge variant="secondary">Subido</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pólizas IA" />
            <div className="space-y-4 p-4">
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
                                <Sparkles className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">Pólizas IA</h1>
                                <p className="text-sm text-muted-foreground">Sube PDF o imágenes y convierte análisis IA al wizard.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <label className="flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 text-sm text-muted-foreground md:flex-1">
                            <input
                                type="file"
                                className="hidden"
                                accept="application/pdf,image/png,image/jpeg"
                                onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)}
                            />
                            <span className="inline-flex items-center gap-2">
                                <UploadCloud className="size-4" />
                                {form.data.file ? form.data.file.name : 'Drag & drop o selecciona un archivo (PDF/JPG/PNG, máx 20MB)'}
                            </span>
                        </label>
                        <Button onClick={submitFile} disabled={form.processing || !form.data.file}>
                            <Bot className="mr-2 size-4" /> Subir archivo
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-left">
                            <tr>
                                <th className="px-4 py-3">Archivo</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        {(imports.data as ImportRow[]).map((item) => (
                                <tbody key={item.id}>
                                    <tr className="border-t align-top">
                                        <td className="px-4 py-3 font-medium">{item.original_filename}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(item.created_at).toLocaleString('es-MX')}</td>
                                        <td className="px-4 py-3">{statusBadge(item.status)}</td>
                                        <td className="space-x-2 px-4 py-3 text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={route('polizas.ai.show', item.id)}>Ver análisis</Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                disabled={!['ready', 'needs_review'].includes(item.status)}
                                                onClick={() => router.post(route('polizas.ai.convert', item.id))}
                                            >
                                                Convertir a póliza
                                            </Button>
                                            {['failed', 'needs_review'].includes(item.status) && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => router.post(route('polizas.ai.retry', item.id))}
                                                >
                                                    <RefreshCcw className="size-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                    {item.status === 'needs_review' && (
                                        <tr className="border-t bg-amber-50/60">
                                            <td colSpan={4} className="px-4 py-3 text-sm text-amber-900">
                                                <p className="font-medium">La IA no pudo leer correctamente o falta información importante.</p>
                                                {(item.missing_fields ?? []).length > 0 && (
                                                    <ul className="mt-1 list-disc pl-5">
                                                        {(item.missing_fields ?? []).map((field) => (
                                                            <li key={field}>{field}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <p className="mt-1">Convertir a póliza para completar manualmente.</p>
                                            </td>
                                        </tr>
                                    )}
                                    {item.status === 'failed' && (
                                        <tr className="border-t bg-red-50/60">
                                            <td colSpan={4} className="px-4 py-3 text-sm text-red-800">
                                                {item.error_message ?? 'No se pudo procesar el archivo.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            ))}
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
