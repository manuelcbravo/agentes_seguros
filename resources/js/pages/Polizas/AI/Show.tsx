import { Head, router } from '@inertiajs/react';
import { AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { route } from 'ziggy-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
            <Head title="Análisis IA" />
            <div className="space-y-4 p-4">
                <div className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="size-5 text-primary" />Análisis IA</h1>
                            <p className="text-sm text-muted-foreground">{item.original_filename}</p>
                            <a href={item.file_url} className="text-sm text-primary underline" target="_blank" rel="noreferrer">Ver archivo original</a>
                        </div>
                        <Button
                            size="lg"
                            disabled={!['ready', 'needs_review'].includes(item.status)}
                            onClick={() => router.post(route('polizas.ai.convert', item.id))}
                        >
                            Convertir a póliza
                        </Button>
                    </div>
                </div>

                {item.status === 'needs_review' && (
                    <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>La IA no pudo leer correctamente o falta información importante.</AlertTitle>
                        <AlertDescription>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                                {(item.missing_fields ?? []).map((field: string) => (
                                    <li key={field}>{field}</li>
                                ))}
                            </ul>
                            <p className="mt-2">Puedes convertir para completar manualmente en el wizard.</p>
                        </AlertDescription>
                    </Alert>
                )}

                {item.status === 'failed' && (
                    <Alert variant="destructive">
                        <AlertTitle>Procesamiento fallido</AlertTitle>
                        <AlertDescription>{item.error_message ?? 'No se pudo procesar el archivo.'}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border p-4">
                        <h2 className="mb-3 text-base font-semibold">Datos detectados</h2>
                        <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(item.ai_data ?? {}, null, 2)}</pre>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-xl border p-4">
                            <h2 className="mb-3 text-base font-semibold">Faltantes</h2>
                            {(item.missing_fields ?? []).length ? (
                                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                    {(item.missing_fields ?? []).map((field: string) => (
                                        <li key={field}>{field}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sin faltantes críticos detectados.</p>
                            )}
                        </div>
                        <Collapsible className="rounded-xl border p-4">
                            <CollapsibleTrigger className="flex w-full items-center justify-between text-left font-medium">
                                <span className="inline-flex items-center gap-2"><FileText className="size-4" />Texto extraído</span>
                                <span className="text-xs text-muted-foreground">Expandir</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-3">
                                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{item.extracted_text ?? 'Sin texto extraído'}</pre>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
