import { useMemo } from 'react';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MONTHS = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
];

export default function Step3Poliza({
    data,
    setData,
    paymentChannels,
    currencies,
    periodicities,
    insuranceCompanies,
    products,
    errors,
}: any) {
    const filteredProducts = useMemo(
        () =>
            products.filter(
                (item: any) =>
                    String(item.insurance_company_id) ===
                    String(data.insurance_company_id),
            ),
        [data.insurance_company_id, products],
    );

    return (
        <div className="space-y-5">
            <section className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Datos generales</h3>
                <FieldError>
                    {errors?.insurance_company_id ?? errors?.product_id}
                </FieldError>
                <div className="grid gap-3 md:grid-cols-2">
                    <Combobox
                        itemToStringLabel={(value) =>
                            !value
                                ? 'Seleccione marca'
                                : (insuranceCompanies.find(
                                      (p: any) =>
                                          String(p.id) === String(value),
                                  )?.name ?? '')
                        }
                        value={data.insurance_company_id}
                        onValueChange={(value) => {
                            setData('insurance_company_id', value ?? '');
                            setData('product_id', '');
                        }}
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Marca"
                            aria-label="Marca"
                        />
                        <FieldError>{errors?.insurance_company_id}</FieldError>
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>
                                    No se encontraron marcas.
                                </ComboboxEmpty>
                                {insuranceCompanies.map((p: any) => (
                                    <ComboboxItem
                                        key={p.id}
                                        value={String(p.id)}
                                    >
                                        {p.name}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>

                    <Combobox
                        itemToStringLabel={(value) =>
                            !value
                                ? 'Seleccione producto'
                                : (products.find(
                                      (p: any) =>
                                          String(p.id) === String(value),
                                  )?.name ?? '')
                        }
                        value={data.product_id}
                        onValueChange={(value) =>
                            setData('product_id', value ?? '')
                        }
                        disabled={!data.insurance_company_id}
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Producto"
                            aria-label="Producto"
                        />
                        <FieldError>{errors?.product_id}</FieldError>
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>
                                    No se encontraron productos.
                                </ComboboxEmpty>
                                {filteredProducts.map((p: any) => (
                                    <ComboboxItem
                                        key={p.id}
                                        value={String(p.id)}
                                    >
                                        {p.name}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
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
                        <FieldError>{errors?.coverage_start}</FieldError>
                    </div>
                    <div>
                        <Label>Prima riesgo</Label>
                        <Input
                            value={data.risk_premium}
                            onChange={(e) =>
                                setData('risk_premium', e.target.value)
                            }
                        />
                        <FieldError>{errors?.risk_premium}</FieldError>
                    </div>
                    <div>
                        <Label>Prima fraccionada</Label>
                        <Input
                            value={data.fractional_premium}
                            onChange={(e) =>
                                setData('fractional_premium', e.target.value)
                            }
                        />
                        <FieldError>{errors?.fractional_premium}</FieldError>
                    </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <Combobox
                        itemToStringLabel={(value) =>
                            !value
                                ? 'Seleccione periodicidad'
                                : (periodicities.find(
                                      (p: any) =>
                                          String(p.id) === String(value),
                                  )?.name ?? '')
                        }
                        value={data.periodicity_id}
                        onValueChange={(value) =>
                            setData('periodicity_id', value ?? '')
                        }
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Periodicidad"
                            aria-label="Periodicidad"
                        />
                        <FieldError>{errors?.periodicity_id}</FieldError>
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>
                                    No se encontraron periodicidades.
                                </ComboboxEmpty>
                                {periodicities.map((p: any) => (
                                    <ComboboxItem
                                        key={p.id}
                                        value={String(p.id)}
                                    >
                                        {p.name}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    <Combobox
                        itemToStringLabel={(value) =>
                            !value
                                ? 'Seleccione mes'
                                : (MONTHS.find(
                                      (month) => month.value === String(value),
                                  )?.label ?? '')
                        }
                        value={String(data.month).padStart(2, '0')}
                        onValueChange={(value) => setData('month', value ?? '')}
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Mes"
                            aria-label="Mes"
                        />
                        <FieldError>{errors?.month}</FieldError>
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>
                                    No se encontraron meses.
                                </ComboboxEmpty>
                                {MONTHS.map((month) => (
                                    <ComboboxItem
                                        key={month.value}
                                        value={month.value}
                                    >
                                        {month.label}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    <Combobox
                        itemToStringLabel={(value) =>
                            !value
                                ? 'Seleccione canal de pago'
                                : (paymentChannels.find(
                                      (p: any) =>
                                          String(p.code) === String(value),
                                  )?.name ?? '')
                        }
                        value={data.payment_channel}
                        onValueChange={(value) =>
                            setData('payment_channel', value ?? '')
                        }
                    >
                        <ComboboxInput
                            className="w-full"
                            placeholder="Canal de pago"
                            aria-label="Canal de pago"
                        />
                        <FieldError>{errors?.payment_channel}</FieldError>
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>
                                    No se encontraron canales de pago.
                                </ComboboxEmpty>
                                {paymentChannels.map((p: any) => (
                                    <ComboboxItem
                                        key={p.code}
                                        value={String(p.code)}
                                    >
                                        {p.name}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>
                <Combobox
                    itemToStringLabel={(value) =>
                        !value
                            ? 'Seleccione moneda'
                            : (currencies.find(
                                  (c: any) => String(c.id) === String(value),
                              )?.name ?? '')
                    }
                    value={data.currency_id}
                    onValueChange={(value) =>
                        setData('currency_id', value ?? '')
                    }
                >
                    <ComboboxInput
                        className="w-full"
                        placeholder="Moneda"
                        aria-label="Moneda catálogo"
                    />
                    <FieldError>{errors?.currency_id}</FieldError>
                    <ComboboxContent>
                        <ComboboxList>
                            <ComboboxEmpty>
                                No se encontraron monedas.
                            </ComboboxEmpty>
                            {currencies.map((c: any) => (
                                <ComboboxItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </ComboboxItem>
                            ))}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </section>
        </div>
    );
}
