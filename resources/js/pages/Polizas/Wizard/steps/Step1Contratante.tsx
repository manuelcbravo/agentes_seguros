import { Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Client = {
    id: string;
    full_name: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    second_last_name?: string;
    subtitle?: string;
    email?: string;
    phone?: string;
    rfc?: string;
    address?: string;
};

export default function Step1Contratante({
    preselectedClient,
    selectedId,
    setSelectedId,
    clientForm,
    setClientForm,
    onClientSelected,
    isNewClient,
    setIsNewClient,
}: any) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [open, setOpen] = useState(!selectedId);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Client[]>(
        preselectedClient ? [preselectedClient] : [],
    );

    useEffect(() => {
        const timer = window.setTimeout(
            () => setDebouncedQuery(query.trim()),
            300,
        );

        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (
            !selectedId ||
            !preselectedClient ||
            selectedId !== preselectedClient.id
        )
            return;

        onClientSelected(preselectedClient);
    }, [onClientSelected, preselectedClient, selectedId]);

    useEffect(() => {
        let cancelled = false;

        if (debouncedQuery.length < 3 || isNewClient) {
            setLoading(false);
            setResults(preselectedClient ? [preselectedClient] : []);
            setOpen(false);
            return;
        }

        const searchClients = async () => {
            setLoading(true);
            setOpen(true);

            try {
                const response = await fetch(
                    `${route('clients.search')}?query=${encodeURIComponent(debouncedQuery)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok || cancelled) return;

                const data = (await response.json()) as Array<any>;
                const mapped = data.map((item) => ({
                    id: item.id,
                    full_name: item.label,
                    first_name: item.first_name,
                    middle_name: item.middle_name,
                    last_name: item.last_name,
                    second_last_name: item.second_last_name,
                    subtitle: item.subtitle,
                    phone: item.phone,
                    email: item.email,
                    rfc: item.rfc,
                    address: item.address,
                }));

                if (!cancelled) setResults(mapped);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        searchClients();

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, isNewClient, preselectedClient]);

    const selected = useMemo(
        () =>
            results.find((c) => c.id === selectedId) ??
            (selectedId === preselectedClient?.id ? preselectedClient : null),
        [preselectedClient, results, selectedId],
    );

    const persistSelected = (client: Client) => {
        setSelectedId(client.id);
        setClientForm({
            first_name: client.first_name ?? '',
            middle_name: client.middle_name ?? '',
            last_name: client.last_name ?? '',
            second_last_name: client.second_last_name ?? '',
            email: client.email ?? '',
            phone: client.phone ?? '',
            rfc: client.rfc ?? '',
            address: client.address ?? '',
        });
        onClientSelected(client);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="is_new_client"
                    checked={isNewClient}
                    onCheckedChange={(value) => {
                        const checked = Boolean(value);
                        setIsNewClient(checked);
                        if (checked) {
                            setSelectedId('');
                            onClientSelected(null);
                        }
                    }}
                />
                <Label htmlFor="is_new_client">
                    No existe contratante, crear uno nuevo
                </Label>
            </div>

            {!isNewClient && !selected ? (
                <Combobox
                    value={selectedId}
                    open={open && debouncedQuery.length >= 3}
                    onOpenChange={setOpen}
                    onValueChange={(value) => {
                        if (!value) return;

                        const client =
                            results.find((item) => item.id === value) ?? null;
                        if (!client) return;

                        persistSelected(client);
                        setOpen(false);
                    }}
                >
                    <ComboboxInput
                        placeholder="Buscar cliente (mínimo 3 caracteres)..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        aria-label="Buscar cliente"
                        className="w-full"
                    />
                    {debouncedQuery.length >= 3 && (
                        <ComboboxContent>
                            <ComboboxList>
                                {loading && (
                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" />
                                        Buscando clientes...
                                    </div>
                                )}
                                {!loading && results.length === 0 && (
                                    <ComboboxEmpty>
                                        Sin resultados.
                                    </ComboboxEmpty>
                                )}
                                {results.map((client) => (
                                    <ComboboxItem
                                        key={client.id}
                                        value={client.id}
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {client.full_name}
                                            </p>
                                            {client.rfc && (
                                                <p className="text-xs text-muted-foreground">
                                                    RFC: {client.rfc}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {client.subtitle ??
                                                    'Sin teléfono ni email'}
                                            </p>
                                        </div>
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    )}
                </Combobox>
            ) : null}

            {!isNewClient && selected ? (
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
            ) : null}

            {(isNewClient || selectedId) && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="space-y-3 pt-6 text-sm">
                        <p className="font-semibold">Datos del contratante</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="client_first_name">
                                    Nombre(s)
                                </Label>
                                <Input
                                    id="client_first_name"
                                    value={clientForm.first_name}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            first_name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="client_middle_name">
                                    Segundo nombre
                                </Label>
                                <Input
                                    id="client_middle_name"
                                    value={clientForm.middle_name}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            middle_name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="client_last_name">
                                    Apellido paterno
                                </Label>
                                <Input
                                    id="client_last_name"
                                    value={clientForm.last_name}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            last_name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="client_second_last_name">
                                    Apellido materno
                                </Label>
                                <Input
                                    id="client_second_last_name"
                                    value={clientForm.second_last_name}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            second_last_name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="client_email">Email</Label>
                                <Input
                                    id="client_email"
                                    value={clientForm.email}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="client_phone">Teléfono</Label>
                                <Input
                                    id="client_phone"
                                    value={clientForm.phone}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            phone: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="client_rfc">RFC</Label>
                                <Input
                                    id="client_rfc"
                                    value={clientForm.rfc}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            rfc: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="client_address">
                                    Dirección básica
                                </Label>
                                <Input
                                    id="client_address"
                                    value={clientForm.address}
                                    onChange={(e) =>
                                        setClientForm({
                                            ...clientForm,
                                            address: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
