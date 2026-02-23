import { useEffect, useMemo, useState } from 'react';
import { Loader2, PlusCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const emptyQuickClient = {
    first_name: '',
    middle_name: '',
    last_name: '',
    second_last_name: '',
    email: '',
    phone: '',
    rfc: '',
    address: '',
};

export default function Step1Contratante({
    preselectedClient,
    selectedId,
    setSelectedId,
    clientForm,
    setClientForm,
    onClientSelected,
}: any) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [open, setOpen] = useState(!selectedId);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Client[]>(
        preselectedClient ? [preselectedClient] : [],
    );
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [quickClient, setQuickClient] = useState(emptyQuickClient);

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
        setClientForm({
            first_name: preselectedClient.first_name ?? '',
            middle_name: preselectedClient.middle_name ?? '',
            last_name: preselectedClient.last_name ?? '',
            second_last_name: preselectedClient.second_last_name ?? '',
            email: preselectedClient.email ?? '',
            phone: preselectedClient.phone ?? '',
            rfc: preselectedClient.rfc ?? '',
            address: preselectedClient.address ?? '',
        });
    }, [onClientSelected, preselectedClient, selectedId, setClientForm]);

    useEffect(() => {
        let cancelled = false;

        if (debouncedQuery.length < 3) {
            setLoading(false);
            setResults([]);
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
    }, [debouncedQuery]);

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

    const createClient = async () => {
        try {
            const response = await fetch(route('polizas.wizard.client.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') ?? '') as string,
                },
                body: JSON.stringify(quickClient),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message ?? 'No se pudo crear el cliente.');
                return;
            }

            const client: Client = data;
            persistSelected(client);
            setShowCreatePanel(false);
            setQuickClient(emptyQuickClient);
            toast.success('Cliente creado y seleccionado.');
        } catch {
            toast.error('No se pudo crear el cliente.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Cliente / Contratante</p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreatePanel((value) => !value)}
                    className="gap-2"
                >
                    <PlusCircle className="size-4" /> Agregar cliente
                </Button>
            </div>

            {showCreatePanel && (
                <Card>
                    <CardContent className="grid gap-3 pt-5 md:grid-cols-2">
                        <Input placeholder="Nombre(s)*" value={quickClient.first_name} onChange={(e) => setQuickClient({ ...quickClient, first_name: e.target.value })} />
                        <Input placeholder="Segundo nombre" value={quickClient.middle_name} onChange={(e) => setQuickClient({ ...quickClient, middle_name: e.target.value })} />
                        <Input placeholder="Apellido paterno*" value={quickClient.last_name} onChange={(e) => setQuickClient({ ...quickClient, last_name: e.target.value })} />
                        <Input placeholder="Apellido materno" value={quickClient.second_last_name} onChange={(e) => setQuickClient({ ...quickClient, second_last_name: e.target.value })} />
                        <Input placeholder="Email" value={quickClient.email} onChange={(e) => setQuickClient({ ...quickClient, email: e.target.value })} />
                        <Input placeholder="Teléfono" value={quickClient.phone} onChange={(e) => setQuickClient({ ...quickClient, phone: e.target.value })} />
                        <Input placeholder="RFC" value={quickClient.rfc} onChange={(e) => setQuickClient({ ...quickClient, rfc: e.target.value })} />
                        <Input placeholder="Dirección básica" value={quickClient.address} onChange={(e) => setQuickClient({ ...quickClient, address: e.target.value })} />
                        <div className="md:col-span-2">
                            <Button type="button" onClick={createClient} disabled={!quickClient.first_name || !quickClient.last_name}>Guardar cliente</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!selected ? (
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
                                {!loading && <ComboboxEmpty>Sin resultados.</ComboboxEmpty>}
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
                    )}
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

            {selectedId && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="space-y-3 pt-6 text-sm">
                        <p className="font-semibold">Datos rápidos del contratante</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div><Label>Nombre(s)</Label><Input value={clientForm.first_name} onChange={(e) => setClientForm({ ...clientForm, first_name: e.target.value })} /></div>
                            <div><Label>Segundo nombre</Label><Input value={clientForm.middle_name} onChange={(e) => setClientForm({ ...clientForm, middle_name: e.target.value })} /></div>
                            <div><Label>Apellido paterno</Label><Input value={clientForm.last_name} onChange={(e) => setClientForm({ ...clientForm, last_name: e.target.value })} /></div>
                            <div><Label>Apellido materno</Label><Input value={clientForm.second_last_name} onChange={(e) => setClientForm({ ...clientForm, second_last_name: e.target.value })} /></div>
                            <div><Label>Email</Label><Input value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} /></div>
                            <div><Label>Teléfono</Label><Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} /></div>
                            <div><Label>RFC</Label><Input value={clientForm.rfc} onChange={(e) => setClientForm({ ...clientForm, rfc: e.target.value })} /></div>
                            <div><Label>Dirección básica</Label><Input value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} /></div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
