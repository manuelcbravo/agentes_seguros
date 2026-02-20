import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Client = {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    rfc?: string;
};

export default function Step1Contratante({
    clients,
    selectedId,
    setSelectedId,
}: {
    clients: Client[];
    selectedId: string;
    setSelectedId: (v: string) => void;
}) {
    const selected = clients.find((c) => c.id === selectedId);

    return (
        <div className="space-y-4">
            <div>
                <p className="mb-2 text-sm font-medium">
                    Cliente / Contratante
                </p>
                <Input
                    list="clients-list"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    placeholder="Busca por nombre/correo/teléfono"
                />
                <datalist id="clients-list">
                    {clients.map((c) => (
                        <option
                            key={c.id}
                            value={c.id}
                        >{`${c.full_name} · ${c.phone ?? 'sin teléfono'} · ${c.email ?? 'sin email'}`}</option>
                    ))}
                </datalist>
            </div>
            {selected && (
                <Card>
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
