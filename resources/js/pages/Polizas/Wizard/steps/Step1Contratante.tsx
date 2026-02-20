import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';

type Client = {
    id: string;
    full_name: string;
    subtitle?: string;
    email?: string;
    phone?: string;
    rfc?: string;
};

export default function Step1Contratante({
    preselectedClient,
    selectedId,
    setSelectedId,
    onClientSelected,
}: {
    preselectedClient?: Client | null;
    selectedId: string;
    setSelectedId: (v: string) => void;
    onClientSelected: (client: Client | null) => void;
}) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [open, setOpen] = useState(!selectedId);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Client[]>(
        preselectedClient ? [preselectedClient] : [],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 300);

        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (
            !selectedId ||
            !preselectedClient ||
            selectedId !== preselectedClient.id
        ) {
            return;
        }

        onClientSelected(preselectedClient);
    }, [onClientSelected, preselectedClient, selectedId]);

    useEffect(() => {
        let cancelled = false;

        const searchClients = async () => {
            setLoading(true);

            try {
                const params = new URLSearchParams();

                if (debouncedQuery) {
                    params.set('query', debouncedQuery);
                }

                const response = await fetch(
                    `${route('clients.search')}?${params.toString()}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok || cancelled) return;

                const data = (await response.json()) as Array<{
                    id: string;
                    label: string;
                    subtitle?: string;
                    phone?: string;
                    email?: string;
                    rfc?: string;
                }>;

                const mapped = data.map((item) => ({
                    id: item.id,
                    full_name: item.label,
                    subtitle: item.subtitle,
                    phone: item.phone,
                    email: item.email,
                    rfc: item.rfc,
                }));

                if (!cancelled) {
                    setResults(mapped);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        searchClients();

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    const selected = useMemo(
        () =>
            results.find((c) => c.id === selectedId) ??
            preselectedClient ??
            null,
        [preselectedClient, results, selectedId],
    );

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="mb-2 text-sm font-medium">
                    Cliente / Contratante
                </p>
                {!selected ? (
                    <Combobox
                        value={selectedId}
                        open={open}
                        onOpenChange={setOpen}
                        onValueChange={(value) => {
                            if (!value) return;

                            const client =
                                results.find((item) => item.id === value) ??
                                null;

                            setSelectedId(value);
                            onClientSelected(client);
                            setOpen(false);
                        }}
                    >
                        <ComboboxInput
                            placeholder="Buscar cliente..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            aria-label="Buscar cliente"
                            className="w-full"
                        />
                        <ComboboxContent>
                            <ComboboxList>
                                {loading && (
                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" />
                                        Buscando clientes...
                                    </div>
                                )}
                                <ComboboxEmpty>
                                    {loading
                                        ? ' '
                                        : 'Sin resultados. Intenta con nombre, teléfono o email.'}
                                </ComboboxEmpty>
                                {results.map((client) => (
                                    <ComboboxItem
                                        key={client.id}
                                        value={client.id}
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {client.full_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {client.subtitle ??
                                                    'Sin teléfono ni email'}
                                            </p>
                                        </div>
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            setSelectedId('');
                            onClientSelected(null);
                            setQuery('');
                            setOpen(true);
                        }}
                    >
                        <Search className="size-4" /> Cambiar cliente
                    </Button>
                )}
            </div>
            {selected && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="space-y-1 pt-6 text-sm">
                        <p className="font-semibold">{selected.full_name}</p>
                        <p className="text-muted-foreground">
                            {selected.phone ?? 'Sin teléfono'} ·{' '}
                            {selected.email ?? 'Sin email'}
                        </p>
                        <p className="text-muted-foreground">
                            RFC: {selected.rfc ?? 'No registrado'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
