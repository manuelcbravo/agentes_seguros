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

type WizardStep3Data = {
    insurance_company_id: string;
    product_id: string;
    policy_number: string;
    coverage_start: string;
    month: string;
    periodicity_id: string;
    payment_channel: string;
    risk_premium: string | number;
    fractional_premium: string | number;
    currency: string;
};

type Option = { id: string; name: string; insurance_company_id?: string };

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
}: {
    data: WizardStep3Data;
    setData: (key: string, value: any) => void;
    paymentChannels: Option[];
    currencies: Option[];
    periodicities: Option[];
    insuranceCompanies: Option[];
    products: Option[];
    errors: Record<string, string>;
}) {
    const filteredProducts = useMemo(
        () =>
            products.filter(
                (item) =>
                    String(item.insurance_company_id) ===
                    String(data.insurance_company_id),
            ),
        [data.insurance_company_id, products],
    );

    return (
        <div className="space-y-5">
            <section className="space-y-4 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Datos de póliza</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Número de póliza</Label>
                        <Input
                            value={data.policy_number ?? ''}
                            placeholder="Ej. A1B2C3"
                            onChange={(e) =>
                                setData('policy_number', e.target.value)
                            }
                        />
                        <FieldError>{errors?.policy_number}</FieldError>
                    </div>
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
                        <Label>Marca</Label>
                        <Combobox
                            itemToStringLabel={(value) =>
                                !value
                                    ? 'Seleccione marca'
                                    : (insuranceCompanies.find(
                                          (p) => String(p.id) === String(value),
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
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>
                                        No se encontraron marcas.
                                    </ComboboxEmpty>
                                    {insuranceCompanies.map((item) => (
                                        <ComboboxItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {item.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <FieldError>{errors?.insurance_company_id}</FieldError>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Producto</Label>
                        <Combobox
                            itemToStringLabel={(value) =>
                                !value
                                    ? 'Seleccione producto'
                                    : (products.find(
                                          (p) => String(p.id) === String(value),
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
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>
                                        No se encontraron productos.
                                    </ComboboxEmpty>
                                    {filteredProducts.map((item) => (
                                        <ComboboxItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {item.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <FieldError>{errors?.product_id}</FieldError>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Pago</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Forma de pago</Label>
                        <Combobox
                            itemToStringLabel={(value) =>
                                !value
                                    ? 'Seleccione forma de pago'
                                    : (paymentChannels.find(
                                          (item) =>
                                              String(item.id) === String(value),
                                      )?.name ?? '')
                            }
                            value={data.payment_channel}
                            onValueChange={(value) =>
                                setData('payment_channel', value ?? '')
                            }
                        >
                            <ComboboxInput
                                className="w-full"
                                placeholder="Forma de pago"
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>
                                        No se encontraron formas de pago.
                                    </ComboboxEmpty>
                                    {paymentChannels.map((item) => (
                                        <ComboboxItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {item.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <FieldError>{errors?.payment_channel}</FieldError>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Moneda</Label>
                        <Combobox
                            itemToStringLabel={(value) =>
                                !value
                                    ? 'Seleccione moneda'
                                    : (currencies.find(
                                          (item) =>
                                              String(item.id) === String(value),
                                      )?.name ?? '')
                            }
                            value={data.currency}
                            onValueChange={(value) =>
                                setData('currency', value ?? '')
                            }
                        >
                            <ComboboxInput
                                className="w-full"
                                placeholder="Moneda"
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>
                                        No se encontraron monedas.
                                    </ComboboxEmpty>
                                    {currencies.map((item) => (
                                        <ComboboxItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {item.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <FieldError>{errors?.currency}</FieldError>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Prima de riesgo</Label>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={data.risk_premium}
                            onChange={(e) =>
                                setData('risk_premium', e.target.value)
                            }
                        />
                        <FieldError>{errors?.risk_premium}</FieldError>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Prima fraccionada</Label>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={data.fractional_premium}
                            onChange={(e) =>
                                setData('fractional_premium', e.target.value)
                            }
                        />
                        <FieldError>{errors?.fractional_premium}</FieldError>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Vigencias</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Periodicidad</Label>
                        <Combobox
                            itemToStringLabel={(value) =>
                                !value
                                    ? 'Seleccione periodicidad'
                                    : (periodicities.find(
                                          (item) =>
                                              String(item.id) === String(value),
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
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>
                                        No se encontraron periodicidades.
                                    </ComboboxEmpty>
                                    {periodicities.map((item) => (
                                        <ComboboxItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {item.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <FieldError>{errors?.periodicity_id}</FieldError>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Mes de aniversario</Label>
                        <Combobox
                            itemToStringLabel={(value) =>
                                !value
                                    ? 'Seleccione mes'
                                    : (MONTHS.find(
                                          (item) => item.value === value,
                                      )?.label ?? '')
                            }
                            value={data.month}
                            onValueChange={(value) =>
                                setData('month', value ?? '')
                            }
                        >
                            <ComboboxInput
                                className="w-full"
                                placeholder="Mes"
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>
                                        No se encontraron meses.
                                    </ComboboxEmpty>
                                    {MONTHS.map((item) => (
                                        <ComboboxItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <FieldError>{errors?.month}</FieldError>
                    </div>
                </div>
            </section>
        </div>
    );
}
