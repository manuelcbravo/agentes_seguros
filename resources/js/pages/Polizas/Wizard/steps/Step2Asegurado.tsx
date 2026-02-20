import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Step2Asegurado({
    contratante,
    sameAsClient,
    setSameAsClient,
    insured,
    setInsured,
}: any) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                Contratante:{' '}
                <strong>{contratante?.full_name ?? 'Sin seleccionar'}</strong>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox
                    checked={sameAsClient}
                    onCheckedChange={(v) => setSameAsClient(Boolean(v))}
                    id="same"
                />
                <Label htmlFor="same">
                    El contratante es el mismo que el asegurado
                </Label>
            </div>
            {!sameAsClient && (
                <div className="grid gap-3 md:grid-cols-2">
                    <Input
                        placeholder="Email"
                        value={insured.email}
                        onChange={(e) =>
                            setInsured({ ...insured, email: e.target.value })
                        }
                    />
                    <Input
                        placeholder="Teléfono"
                        value={insured.phone}
                        onChange={(e) =>
                            setInsured({ ...insured, phone: e.target.value })
                        }
                    />
                    <Input
                        placeholder="RFC"
                        value={insured.rfc}
                        onChange={(e) =>
                            setInsured({ ...insured, rfc: e.target.value })
                        }
                    />
                    <Input
                        type="date"
                        value={insured.birthday}
                        onChange={(e) =>
                            setInsured({ ...insured, birthday: e.target.value })
                        }
                    />
                    <Input
                        placeholder="Ocupación"
                        value={insured.occupation}
                        onChange={(e) =>
                            setInsured({
                                ...insured,
                                occupation: e.target.value,
                            })
                        }
                    />
                    <Input
                        placeholder="Empresa"
                        value={insured.company_name}
                        onChange={(e) =>
                            setInsured({
                                ...insured,
                                company_name: e.target.value,
                            })
                        }
                    />
                </div>
            )}
        </div>
    );
}
