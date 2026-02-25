import { Plus, Search, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { CrudFormDialog } from '@/components/crud-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

type Relationship = { id: string; name: string };
type BeneficiaryCatalog = {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    second_last_name?: string | null;
    rfc?: string | null;
    relationship_id?: string | null;
};

type SelectedBeneficiary = {
    beneficiary_id: string;
    percentage: number;
    first_name?: string;
    middle_name?: string | null;
    last_name?: string;
    second_last_name?: string | null;
    rfc?: string | null;
    relationship_id?: string | null;
};

const TOTAL_TOLERANCE = 0.01;

const formatFullName = (beneficiary: {
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    second_last_name?: string | null;
}) =>
    [
        beneficiary.first_name,
        beneficiary.middle_name,
        beneficiary.last_name,
        beneficiary.second_last_name,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

export default function Step4Beneficiarios({
    beneficiaries,
    setBeneficiaries,
    relationships,
    beneficiaryCatalog,
    errors,
}: {
    beneficiaries: SelectedBeneficiary[];
    setBeneficiaries: (items: SelectedBeneficiary[]) => void;
    relationships: Relationship[];
    beneficiaryCatalog: BeneficiaryCatalog[];
    errors: Record<string, string>;
}) {
    const [openDialog, setOpenDialog] = useState(false);
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('');
    const [percentage, setPercentage] = useState('');
    const [saving, setSaving] = useState(false);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [newBeneficiary, setNewBeneficiary] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        second_last_name: '',
        rfc: '',
        phone: '',
        email: '',
        relationship_id: '',
    });

    const total = useMemo(
        () =>
            Number(
                beneficiaries
                    .reduce(
                        (sum, item) => sum + Number(item.percentage || 0),
                        0,
                    )
                    .toFixed(2),
            ),
        [beneficiaries],
    );

    const selectedFromCatalog = useMemo(
        () =>
            beneficiaryCatalog.find(
                (item) => String(item.id) === String(selectedBeneficiaryId),
            ),
        [beneficiaryCatalog, selectedBeneficiaryId],
    );

    const status =
        Math.abs(total - 100) <= TOTAL_TOLERANCE
            ? {
                  label: 'Completo',
                  className: 'bg-emerald-100 text-emerald-700',
              }
            : total > 100
              ? { label: 'Excedido', className: 'bg-red-100 text-red-700' }
              : {
                    label: 'Pendiente',
                    className: 'bg-amber-100 text-amber-700',
                };

    const relationshipName = (relationshipId?: string | null) =>
        relationships.find((item) => String(item.id) === String(relationshipId))
            ?.name ?? '—';

    const resetDialog = () => {
        setMode('existing');
        setSelectedBeneficiaryId('');
        setPercentage('');
        setCreateErrors({});
        setNewBeneficiary({
            first_name: '',
            middle_name: '',
            last_name: '',
            second_last_name: '',
            rfc: '',
            phone: '',
            email: '',
            relationship_id: '',
        });
    };

    const upsertListEntry = (item: SelectedBeneficiary) => {
        const nextPercentage = Number.parseFloat(String(item.percentage || 0));

        if (!Number.isFinite(nextPercentage) || nextPercentage <= 0) {
            return;
        }

        const existingIndex = beneficiaries.findIndex(
            (row) => String(row.beneficiary_id) === String(item.beneficiary_id),
        );

        if (existingIndex >= 0) {
            const updated = [...beneficiaries];
            updated[existingIndex] = {
                ...updated[existingIndex],
                ...item,
                percentage: Number(nextPercentage.toFixed(2)),
            };
            setBeneficiaries(updated);
            return;
        }

        setBeneficiaries([
            ...beneficiaries,
            {
                ...item,
                percentage: Number(nextPercentage.toFixed(2)),
            },
        ]);
    };

    const addExistingBeneficiary = () => {
        if (!selectedFromCatalog) {
            return;
        }

        upsertListEntry({
            beneficiary_id: selectedFromCatalog.id,
            percentage: Number(percentage),
            first_name: selectedFromCatalog.first_name,
            middle_name: selectedFromCatalog.middle_name,
            last_name: selectedFromCatalog.last_name,
            second_last_name: selectedFromCatalog.second_last_name,
            rfc: selectedFromCatalog.rfc,
            relationship_id: selectedFromCatalog.relationship_id,
        });

        setOpenDialog(false);
        resetDialog();
    };

    const createAndAddBeneficiary = async () => {
        setSaving(true);
        setCreateErrors({});

        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const response = await fetch(route('beneficiarios.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            },
            body: JSON.stringify({
                ...newBeneficiary,
                policy_id: null,
            }),
        });

        if (!response.ok) {
            if (response.status === 422) {
                const payload = (await response.json()) as {
                    errors?: Record<string, string[]>;
                };

                const errorBag = Object.fromEntries(
                    Object.entries(payload.errors ?? {}).map(([key, value]) => [
                        key,
                        value[0] ?? 'Valor inválido.',
                    ]),
                );
                setCreateErrors(errorBag);
            }
            setSaving(false);
            return;
        }

        const created = (await response.json()) as BeneficiaryCatalog;

        upsertListEntry({
            beneficiary_id: created.id,
            percentage: Number(percentage),
            first_name: created.first_name,
            middle_name: created.middle_name,
            last_name: created.last_name,
            second_last_name: created.second_last_name,
            rfc: created.rfc,
            relationship_id: created.relationship_id,
        });

        setOpenDialog(false);
        resetDialog();
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                    <h3 className="text-sm font-semibold">
                        Beneficiarios seleccionados
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Asigna porcentajes por póliza. Deben sumar 100%.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        Total: {total.toFixed(2)}%
                    </Badge>
                    <Badge className={status.className}>{status.label}</Badge>
                </div>
            </div>

            {errors?.beneficiaries && (
                <FieldError>{errors.beneficiaries}</FieldError>
            )}

            <div className="rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">RFC</th>
                            <th className="p-2 text-left">Parentesco</th>
                            <th className="p-2 text-left">%</th>
                            <th className="p-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {beneficiaries.map((item, index) => (
                            <tr
                                key={`${item.beneficiary_id}-${index}`}
                                className="border-t align-top"
                            >
                                <td className="p-2">
                                    {formatFullName(item) ||
                                        item.beneficiary_id}
                                </td>
                                <td className="p-2">{item.rfc || '—'}</td>
                                <td className="p-2">
                                    {relationshipName(item.relationship_id)}
                                </td>
                                <td className="p-2">
                                    <Input
                                        type="number"
                                        min={0.01}
                                        max={100}
                                        step="0.01"
                                        value={item.percentage}
                                        onChange={(event) => {
                                            const value = Number(
                                                event.target.value || 0,
                                            );
                                            setBeneficiaries(
                                                beneficiaries.map(
                                                    (row, itemIndex) =>
                                                        itemIndex === index
                                                            ? {
                                                                  ...row,
                                                                  percentage:
                                                                      Number(
                                                                          value.toFixed(
                                                                              2,
                                                                          ),
                                                                      ),
                                                              }
                                                            : row,
                                                ),
                                            );
                                        }}
                                    />
                                </td>
                                <td className="p-2 text-right">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setBeneficiaries(
                                                beneficiaries.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        Quitar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Button onClick={() => setOpenDialog(true)}>
                <Plus className="mr-2 size-4" /> Agregar beneficiario
            </Button>

            <CrudFormDialog
                open={openDialog}
                onOpenChange={(open) => {
                    setOpenDialog(open);
                    if (!open) {
                        resetDialog();
                    }
                }}
                title="Agregar beneficiario"
                description="Busca uno existente o crea uno nuevo con el formulario estándar."
                submitLabel={
                    mode === 'existing' ? 'Agregar a póliza' : 'Crear y agregar'
                }
                processing={saving}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (mode === 'existing') {
                        addExistingBeneficiary();
                        return;
                    }
                    void createAndAddBeneficiary();
                }}
            >
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={mode === 'existing' ? 'default' : 'outline'}
                        onClick={() => setMode('existing')}
                    >
                        <Search className="mr-2 size-4" /> Buscar existente
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'new' ? 'default' : 'outline'}
                        onClick={() => setMode('new')}
                    >
                        <UserPlus className="mr-2 size-4" /> Crear nuevo
                    </Button>
                </div>

                {mode === 'existing' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label>Beneficiario</Label>
                            <Combobox
                                itemToStringLabel={(value) => {
                                    const found = beneficiaryCatalog.find(
                                        (item) =>
                                            String(item.id) === String(value),
                                    );

                                    if (!found) {
                                        return 'Selecciona beneficiario';
                                    }

                                    const name = formatFullName(found);
                                    return found.rfc
                                        ? `${name} · ${found.rfc}`
                                        : name;
                                }}
                                value={selectedBeneficiaryId}
                                onValueChange={(value) =>
                                    setSelectedBeneficiaryId(value ?? '')
                                }
                            >
                                <ComboboxInput
                                    className="w-full"
                                    placeholder="Nombre completo o RFC"
                                />
                                <ComboboxContent>
                                    <ComboboxList>
                                        <ComboboxEmpty>
                                            No se encontraron beneficiarios.
                                        </ComboboxEmpty>
                                        {beneficiaryCatalog.map((item) => (
                                            <ComboboxItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {formatFullName(item)}
                                                {item.rfc
                                                    ? ` · ${item.rfc}`
                                                    : ''}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label>Porcentaje</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min={0.01}
                                max={100}
                                value={percentage}
                                onChange={(event) =>
                                    setPercentage(event.target.value)
                                }
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Nombre(s)</Label>
                            <Input
                                value={newBeneficiary.first_name}
                                onChange={(event) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        first_name: event.target.value,
                                    })
                                }
                            />
                            <FieldError>{createErrors.first_name}</FieldError>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Segundo nombre</Label>
                            <Input
                                value={newBeneficiary.middle_name}
                                onChange={(event) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        middle_name: event.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Apellido paterno</Label>
                            <Input
                                value={newBeneficiary.last_name}
                                onChange={(event) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        last_name: event.target.value,
                                    })
                                }
                            />
                            <FieldError>{createErrors.last_name}</FieldError>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Apellido materno</Label>
                            <Input
                                value={newBeneficiary.second_last_name}
                                onChange={(event) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        second_last_name: event.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>RFC</Label>
                            <Input
                                value={newBeneficiary.rfc}
                                onChange={(event) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        rfc: event.target.value,
                                    })
                                }
                            />
                            <FieldError>{createErrors.rfc}</FieldError>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Teléfono</Label>
                            <Input
                                value={newBeneficiary.phone}
                                onChange={(event) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        phone: event.target.value,
                                    })
                                }
                            />
                            <FieldError>{createErrors.phone}</FieldError>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input
                                value={newBeneficiary.email}
                                onChange={(event) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        email: event.target.value,
                                    })
                                }
                            />
                            <FieldError>{createErrors.email}</FieldError>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Parentesco</Label>
                            <Combobox
                                itemToStringLabel={(value) =>
                                    !value
                                        ? 'Selecciona parentesco'
                                        : (relationships.find(
                                              (item) =>
                                                  String(item.id) ===
                                                  String(value),
                                          )?.name ?? '')
                                }
                                value={newBeneficiary.relationship_id}
                                onValueChange={(value) =>
                                    setNewBeneficiary({
                                        ...newBeneficiary,
                                        relationship_id: value ?? '',
                                    })
                                }
                            >
                                <ComboboxInput
                                    className="w-full"
                                    placeholder="Parentesco"
                                />
                                <ComboboxContent>
                                    <ComboboxList>
                                        <ComboboxEmpty>
                                            No se encontraron parentescos.
                                        </ComboboxEmpty>
                                        {relationships.map((item) => (
                                            <ComboboxItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.name}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <FieldError>
                                {createErrors.relationship_id}
                            </FieldError>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label>Porcentaje</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min={0.01}
                                max={100}
                                value={percentage}
                                onChange={(event) =>
                                    setPercentage(event.target.value)
                                }
                            />
                        </div>
                    </div>
                )}
            </CrudFormDialog>
        </div>
    );
}
