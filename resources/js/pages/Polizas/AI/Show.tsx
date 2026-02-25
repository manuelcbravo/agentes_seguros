import { Head, router } from '@inertiajs/react';
import { FileText, RefreshCcw, Sparkles } from 'lucide-react';
import { route } from 'ziggy-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import AppLayout from '@/layouts/app-layout';

export default function PolicyAiShow({ import: item }: any) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Pólizas', href: route('polizas.index') },
                { title: 'Pólizas IA', href: route('polizas.ai.index') },
            ]}
        >
            <Head title="Pólizas IA · Detalle" />

            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Sparkles className="size-5 text-primary" />
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold">Detalle de análisis IA</h1>
                                <p className="text-sm text-muted-foreground">
                                    Revisa el análisis y conviértelo al wizard de pólizas.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                disabled={!['failed', 'needs_review'].includes(item.status)}
                                onClick={() => router.post(route('polizas.ai.retry', item.id))}
                            >
                                <RefreshCcw className="mr-2 size-4" /> Reintentar
                            </Button>
                            <Button
                                disabled={!['ready', 'needs_review'].includes(item.status)}
                                onClick={() => router.post(route('polizas.ai.convert', item.id))}
                            >
                                Convertir a póliza
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <h2 className="mb-2 text-sm font-semibold">Archivos</h2>
                    <div className="flex flex-wrap gap-2">
                        {(item.files ?? []).map((file: any) => (
                            <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                            >
                                {file.original_filename}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border p-4">
                        <h2 className="mb-3 text-base font-semibold">Campos faltantes</h2>
                        {(item.missing_fields ?? []).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {item.missing_fields.map((field: string) => (
                                    <Badge key={field} variant="secondary">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin faltantes críticos detectados.</p>
                        )}
                    </div>

                    <div className="rounded-xl border p-4">
                        <h2 className="mb-3 text-base font-semibold">Datos detectados</h2>
                        <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
                            {JSON.stringify(item.ai_data ?? {}, null, 2)}
                        </pre>
                    </div>
                </div>

                <Collapsible className="rounded-xl border p-4">
                    <CollapsibleTrigger className="flex w-full items-center justify-between text-left font-medium">
                        <span className="inline-flex items-center gap-2">
                            <FileText className="size-4" /> Texto extraído
                        </span>
                        <span className="text-xs text-muted-foreground">Expandir</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                            {item.extracted_text ?? 'Sin texto extraído.'}
                        </pre>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </AppLayout>
    );
}
