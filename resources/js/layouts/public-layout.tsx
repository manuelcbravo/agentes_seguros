import type { PropsWithChildren, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PublicLayoutProps = PropsWithChildren<{
    topbarTitle: ReactNode;
    contactHref?: string;
    isPreview?: boolean;
    previewSettingsUrl?: string | null;
}>;

export default function PublicLayout({
    children,
    topbarTitle,
    contactHref,
    isPreview = false,
    previewSettingsUrl,
}: PublicLayoutProps) {
    return (
        <main className="min-h-screen bg-background text-foreground">
            {isPreview && (
                <div className="sticky top-0 z-40 border-b bg-amber-50/95 backdrop-blur dark:bg-amber-950/40">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Vista previa: tu sitio aún está en borrador.
                        </p>
                        {previewSettingsUrl && (
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-amber-300 bg-white/70 text-amber-900 hover:bg-white dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-950"
                            >
                                <a href={previewSettingsUrl}>
                                    Ir a configuración Web
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <header
                className={cn(
                    'sticky z-30 border-b bg-background/95 backdrop-blur',
                    isPreview ? 'top-[57px]' : 'top-0',
                )}
            >
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
                    <div className="text-sm font-semibold tracking-wide text-foreground/90 sm:text-base">
                        {topbarTitle}
                    </div>
                    {contactHref && (
                        <Button asChild size="sm">
                            <a href={contactHref}>Contactar</a>
                        </Button>
                    )}
                </div>
            </header>

            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
                {children}
            </div>
        </main>
    );
}
