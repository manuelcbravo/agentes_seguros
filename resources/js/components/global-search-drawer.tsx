import { useMemo, useState, type KeyboardEventHandler } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ResultGroup } from '@/components/global-search/ResultGroup';
import { useGlobalSearch } from '@/components/global-search/useGlobalSearch';

function LoadingState() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={`search-skeleton-${index}`}
                    className="space-y-2 rounded-xl border border-border/50 p-4"
                >
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            ))}
        </div>
    );
}

export function GlobalSearchDrawer() {
    const [open, setOpen] = useState(false);
    const {
        query,
        setQuery,
        loading,
        groups,
        flatItems,
        activeIndex,
        setActiveIndex,
        openItem,
        total,
        tookMs,
        minLengthMet,
        normalizedQuery,
    } = useGlobalSearch(open);

    const offsets = useMemo(() => {
        let running = 0;
        return groups.map((group) => {
            const start = running;
            running += group.items.length;
            return { key: group.key, start };
        });
    }, [groups]);

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            return;
        }

        if (flatItems.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) =>
                current < 0 ? 0 : (current + 1) % flatItems.length,
            );
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) =>
                current <= 0 ? flatItems.length - 1 : current - 1,
            );
        }

        if (
            event.key === 'Enter' &&
            activeIndex >= 0 &&
            flatItems[activeIndex]
        ) {
            event.preventDefault();
            openItem(flatItems[activeIndex]);
            setOpen(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                size="icon"
                className="fixed right-6 bottom-6 z-[70] size-12 rounded-full shadow-xl"
                onClick={() => setOpen(true)}
                aria-label="Abrir búsqueda global"
            >
                <Search className="size-5" />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="w-full p-0 sm:max-w-2xl"
                    onKeyDown={handleKeyDown}
                >
                    <div className="flex h-full flex-col">
                        <SheetHeader className="border-b px-6 py-5 text-left">
                            <SheetTitle>Búsqueda global</SheetTitle>
                            <SheetDescription>
                                Busca clientes, asegurados, beneficiarios y
                                pólizas al instante.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-4 border-b px-6 py-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    autoFocus
                                    placeholder="Ej. Manuel, 55..., correo o producto..."
                                    className="h-11 rounded-xl border-border/70 pl-9"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <p>
                                    ↑ ↓ para navegar · Enter para abrir · Esc
                                    para cerrar
                                </p>
                                {minLengthMet && !loading && total > 0 && (
                                    <p>
                                        {total} resultado
                                        {total === 1 ? '' : 's'} · {tookMs} ms
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto bg-muted/15 p-6">
                            {!minLengthMet ? (
                                <div className="rounded-xl border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
                                    Escribe al menos 3 caracteres para buscar.
                                </div>
                            ) : loading ? (
                                <LoadingState />
                            ) : groups.length === 0 ? (
                                <div className="rounded-xl border bg-background p-8 text-center">
                                    <p className="text-sm font-medium">
                                        Sin resultados para “{normalizedQuery}”.
                                    </p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Prueba por nombre, teléfono, correo, RFC.
                                    </p>
                                </div>
                            ) : (
                                groups.map((group) => (
                                    <ResultGroup
                                        key={group.key}
                                        group={group}
                                        query={normalizedQuery}
                                        activeIndex={activeIndex}
                                        startIndex={
                                            offsets.find(
                                                (offset) =>
                                                    offset.key === group.key,
                                            )?.start ?? 0
                                        }
                                        onOpen={(item) => {
                                            openItem(item);
                                            setOpen(false);
                                        }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
