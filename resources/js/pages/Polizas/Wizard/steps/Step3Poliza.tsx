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
                    <Combobox
                        itemToStringLabel={(value) => !value ? 'Seleccione canal de pago' : (paymentChannels.find((p: any) => String(p.code) === String(value))?.name ?? '')}
                        value={data.payment_channel}
                        onValueChange={(value) =>
                            setData('payment_channel', value ?? '')
                        }
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Seleccione canal de pago"
                            aria-label="Canal de pago"
                        />
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>No se encontraron canales de pago.</ComboboxEmpty>
                                <ComboboxItem value="">Canal de pago</ComboboxItem>
                                {paymentChannels.map((p: any) => (
                                    <ComboboxItem key={p.code} value={String(p.code)}>
                                        {p.name}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <Input
                        type="number"
                        placeholder="Moneda (legacy)"
                        value={data.currency}
                        onChange={(e) => setData('currency', e.target.value)}
                    />
                    <Combobox
                        itemToStringLabel={(value) => !value ? 'Seleccione moneda' : (currencies.find((c: any) => String(c.id) === String(value))?.name ?? '')}
                        value={data.currency_id}
                        onValueChange={(value) => setData('currency_id', value ?? '')}
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Seleccione moneda"
                            aria-label="Moneda catálogo"
                        />
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>No se encontraron monedas.</ComboboxEmpty>
                                <ComboboxItem value="">Catálogo moneda</ComboboxItem>
                                {currencies.map((c: any) => (
                                    <ComboboxItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
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
