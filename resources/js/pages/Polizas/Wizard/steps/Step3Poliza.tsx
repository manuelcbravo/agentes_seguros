import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Step3Poliza({
    data,
    setData,
    paymentChannels,
    currencies,
}: any) {
    return (
        <div className="space-y-5">
            <section className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Datos generales</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <div>
                        <Label>Producto</Label>
                        <Input
                            value={data.product}
                            onChange={(e) => setData('product', e.target.value)}
                        />
                    </div>
                    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                        El estatus de la póliza se controla automáticamente:{' '}
                        <strong>borrador</strong> al guardar y{' '}
                        <strong>activo</strong> al terminar con beneficiarios al
                        100%.
                    </div>
                </div>
            </section>
            <section className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Vigencia y pago</h3>
                <div className="grid gap-3 md:grid-cols-3">
                    <div>
                        <Label>Inicio cobertura</Label>
                        <Input
                            type="date"
                            value={data.coverage_start}
                            onChange={(e) =>
                                setData('coverage_start', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <Label>Prima riesgo</Label>
                        <Input
                            value={data.risk_premium}
                            onChange={(e) =>
                                setData('risk_premium', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <Label>Prima fraccionada</Label>
                        <Input
                            value={data.fractional_premium}
                            onChange={(e) =>
                                setData('fractional_premium', e.target.value)
                            }
                        />
                    </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <Input
                        placeholder="Periodicidad"
                        value={data.periodicity}
                        onChange={(e) => setData('periodicity', e.target.value)}
                    />
                    <Input
                        type="number"
                        placeholder="Mes"
                        value={data.month}
                        onChange={(e) => setData('month', e.target.value)}
                    />
                    <select
                        className="h-10 rounded-md border px-3"
                        value={data.payment_channel}
                        onChange={(e) =>
                            setData('payment_channel', e.target.value)
                        }
                    >
                        <option value="">Canal de pago</option>
                        {paymentChannels.map((p: any) => (
                            <option key={p.code} value={p.code}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <Input
                        type="number"
                        placeholder="Moneda (legacy)"
                        value={data.currency}
                        onChange={(e) => setData('currency', e.target.value)}
                    />
                    <select
                        className="h-10 rounded-md border px-3"
                        value={data.currency_id}
                        onChange={(e) => setData('currency_id', e.target.value)}
                    >
                        <option value="">Catálogo moneda</option>
                        {currencies.map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <Textarea
                    placeholder="Observaciones"
                    value={data.observations ?? ''}
                    onChange={() => {}}
                    disabled
                />
            </section>
        </div>
    );
}
