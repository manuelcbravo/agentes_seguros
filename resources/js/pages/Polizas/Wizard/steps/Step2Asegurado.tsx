import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Step2Asegurado({
    contratante,
    sameAsClient,
    setSameAsClient,
    insured,
    setInsured,
}: any) {
    return (
        <div className="space-y-5">
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
                <>
                    <section className="space-y-3 rounded-lg border p-4">
                        <h3 className="font-semibold">Identidad</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input placeholder="Nombre(s)" value={insured.first_name} onChange={(e) => setInsured({ ...insured, first_name: e.target.value })} />
                            <Input placeholder="Segundo nombre" value={insured.middle_name} onChange={(e) => setInsured({ ...insured, middle_name: e.target.value })} />
                            <Input placeholder="Apellido paterno" value={insured.last_name} onChange={(e) => setInsured({ ...insured, last_name: e.target.value })} />
                            <Input placeholder="Apellido materno" value={insured.second_last_name} onChange={(e) => setInsured({ ...insured, second_last_name: e.target.value })} />
                            <Input placeholder="RFC" value={insured.rfc} onChange={(e) => setInsured({ ...insured, rfc: e.target.value })} />
                            <Input type="date" value={insured.birthday} onChange={(e) => setInsured({ ...insured, birthday: e.target.value })} />
                            <Input type="number" placeholder="Edad actual" value={insured.age_current} onChange={(e) => setInsured({ ...insured, age_current: e.target.value })} />
                        </div>
                    </section>
                    <section className="space-y-3 rounded-lg border p-4">
                        <h3 className="font-semibold">Contacto y dirección</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input placeholder="Email" value={insured.email} onChange={(e) => setInsured({ ...insured, email: e.target.value })} />
                            <Input placeholder="Teléfono" value={insured.phone} onChange={(e) => setInsured({ ...insured, phone: e.target.value })} />
                            <Input placeholder="Ocupación" value={insured.occupation} onChange={(e) => setInsured({ ...insured, occupation: e.target.value })} />
                            <Input placeholder="Empresa" value={insured.company_name} onChange={(e) => setInsured({ ...insured, company_name: e.target.value })} />
                            <Input type="number" placeholder="Ingreso aproximado" value={insured.approx_income} onChange={(e) => setInsured({ ...insured, approx_income: e.target.value })} />
                            <Input type="number" placeholder="Número de hijos" value={insured.children_count} onChange={(e) => setInsured({ ...insured, children_count: e.target.value })} />
                        </div>
                        <Textarea placeholder="Dirección" value={insured.address} onChange={(e) => setInsured({ ...insured, address: e.target.value })} />
                    </section>
                    <section className="space-y-3 rounded-lg border p-4">
                        <h3 className="font-semibold">Datos adicionales</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input placeholder="Meta principal de ahorro" value={insured.main_savings_goal} onChange={(e) => setInsured({ ...insured, main_savings_goal: e.target.value })} />
                            <Input placeholder="Personalidad" value={insured.personality} onChange={(e) => setInsured({ ...insured, personality: e.target.value })} />
                        </div>
                        <Textarea placeholder="Historial médico" value={insured.medical_history} onChange={(e) => setInsured({ ...insured, medical_history: e.target.value })} />
                        <Textarea placeholder="Intereses personales" value={insured.personal_interests} onChange={(e) => setInsured({ ...insured, personal_interests: e.target.value })} />
                        <Textarea placeholder="Gustos personales" value={insured.personal_likes} onChange={(e) => setInsured({ ...insured, personal_likes: e.target.value })} />
                        <div className="flex gap-6 text-sm">
                            <label className="flex items-center gap-2"><Checkbox checked={Boolean(insured.smokes)} onCheckedChange={(v) => setInsured({ ...insured, smokes: Boolean(v) })} />Fuma</label>
                            <label className="flex items-center gap-2"><Checkbox checked={Boolean(insured.drinks)} onCheckedChange={(v) => setInsured({ ...insured, drinks: Boolean(v) })} />Bebe alcohol</label>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
