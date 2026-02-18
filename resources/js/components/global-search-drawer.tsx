import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

const mockResults = [
    {
        title: 'Cliente: María Hernández',
        description: 'Última actualización: hoy · Estado: Activo',
        tag: 'Clientes',
    },
    {
        title: 'Agente: Javier Soto',
        description: '3 licencias vigentes · 1 por vencer',
        tag: 'Agentes',
    },
    {
        title: 'Aseguradora: Seguros Atlas',
        description: '25 pólizas asociadas · Catálogo',
        tag: 'Catálogos',
    },
];

export function GlobalSearchDrawer() {
    const [open, setOpen] = useState(false);

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
                <SheetContent side="right" className="w-full p-0 sm:max-w-xl">
                    <div className="flex h-full flex-col">
                        <SheetHeader className="border-b px-6 py-5 text-left">
                            <SheetTitle>Búsqueda global</SheetTitle>
                            <SheetDescription>
                                Encuentra clientes, agentes, licencias y
                                catálogos en segundos.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-4 overflow-y-auto p-6">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre, correo, licencia o aseguradora..."
                                    className="pl-9"
                                />
                            </div>

                            <div className="space-y-3">
                                {mockResults.map((result) => (
                                    <Card
                                        key={result.title}
                                        className="transition-colors hover:bg-muted/40"
                                    >
                                        <CardHeader className="pb-2">
                                            <CardDescription>
                                                {result.tag}
                                            </CardDescription>
                                            <CardTitle className="text-base">
                                                {result.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                {result.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
