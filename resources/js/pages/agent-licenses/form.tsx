import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type SimpleOption = {
    id: string;
    name: string;
    code?: string | null;
};

type StatusOption = {
    value: string;
    label: string;
};

type LicenseFormData = {
    id: string | null;
    agent_id: string;
    aseguradora_id: string;
    num_licencia: string;
    fecha_expiracion: string;
    fecha_emision: string;
    status: string;
    observaciones: string;
    activo: boolean;
};

type LicenseFormErrors = Partial<Record<keyof LicenseFormData, string>>;

type Props = {
    data: LicenseFormData;
    errors: LicenseFormErrors;
    insuranceCompanies: SimpleOption[];
    statusOptions: StatusOption[];
    setData: <K extends keyof LicenseFormData>(
        key: K,
        value: LicenseFormData[K],
    ) => void;
};

export function AgentLicenseForm({
    data,
    errors,
    insuranceCompanies,
    statusOptions,
    setData,
}: Props) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <Label htmlFor="license-insurer">Aseguradora</Label>
                    <select
                        id="license-insurer"
                        value={data.aseguradora_id}
                        onChange={(event) =>
                            setData('aseguradora_id', event.target.value)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs ring-offset-background transition-[color,box-shadow] outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">Selecciona una aseguradora</option>
                        {insuranceCompanies.map((company) => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                                {company.code ? ` (${company.code})` : ''}
                            </option>
                        ))}
                    </select>
                    {errors.aseguradora_id && (
                        <FieldError>{errors.aseguradora_id}</FieldError>
                    )}
                </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <Label htmlFor="license-number">Numero de licencia</Label>
                    <Input
                        id="license-number"
                        value={data.num_licencia}
                        onChange={(event) =>
                            setData('num_licencia', event.target.value)
                        }
                        placeholder="Ej. LIC-MX-2026-0041"
                        aria-invalid={Boolean(errors.num_licencia)}
                    />
                    {errors.num_licencia && (
                        <FieldError>{errors.num_licencia}</FieldError>
                    )}
                </Field>

                <Field>
                    <Label htmlFor="license-status">Estatus</Label>
                    <select
                        id="license-status"
                        value={data.status}
                        onChange={(event) =>
                            setData('status', event.target.value)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs ring-offset-background transition-[color,box-shadow] outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    {errors.status && <FieldError>{errors.status}</FieldError>}
                </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Field>
                    <Label htmlFor="license-issue-date">Fecha de emision</Label>
                    <Input
                        id="license-issue-date"
                        type="date"
                        value={data.fecha_emision}
                        onChange={(event) =>
                            setData('fecha_emision', event.target.value)
                        }
                        aria-invalid={Boolean(errors.fecha_emision)}
                    />
                    {errors.fecha_emision && (
                        <FieldError>{errors.fecha_emision}</FieldError>
                    )}
                </Field>

                <Field>
                    <Label htmlFor="license-expiration-date">
                        Fecha de expiracion
                    </Label>
                    <Input
                        id="license-expiration-date"
                        type="date"
                        value={data.fecha_expiracion}
                        onChange={(event) =>
                            setData('fecha_expiracion', event.target.value)
                        }
                        aria-invalid={Boolean(errors.fecha_expiracion)}
                    />
                    {errors.fecha_expiracion && (
                        <FieldError>{errors.fecha_expiracion}</FieldError>
                    )}
                </Field>
            </div>

            <Field>
                <Label htmlFor="license-notes">Observaciones</Label>
                <Textarea
                    id="license-notes"
                    value={data.observaciones}
                    onChange={(event) =>
                        setData('observaciones', event.target.value)
                    }
                    placeholder="Notas internas, restricciones o comentarios de validacion..."
                />
                {errors.observaciones && (
                    <FieldError>{errors.observaciones}</FieldError>
                )}
            </Field>

            <Field>
                <Label
                    htmlFor="license-active"
                    className="inline-flex items-center gap-2 font-normal"
                >
                    <input
                        id="license-active"
                        type="checkbox"
                        checked={data.activo}
                        onChange={(event) =>
                            setData('activo', event.target.checked)
                        }
                        className="size-4"
                    />
                    Licencia activa
                </Label>
                {errors.activo && <FieldError>{errors.activo}</FieldError>}
            </Field>
        </div>
    );
}
