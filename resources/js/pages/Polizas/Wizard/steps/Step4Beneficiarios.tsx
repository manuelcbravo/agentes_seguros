import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
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
    full_name: string;
    rfc?: string | null;
    percentage: number | null;
    relationship_id?: string | null;
};

type SearchBeneficiary = {
    id: string;
    full_name: string;
    rfc?: string | null;
};

const TOTAL_TOLERANCE = 0.01;

export default function Step4Beneficiarios({
    beneficiaries,
    setBeneficiaries,
    relationships,
    errors,
}: {
    beneficiaries: SelectedBeneficiary[];
    setBeneficiaries: (items: SelectedBeneficiary[]) => void;
    relationships: Relationship[];
    beneficiaryCatalog: BeneficiaryCatalog[];
    errors: Record<string, string>;
}) {
    const [openDialog, setOpenDialog] = useState(false);
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

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchBeneficiary[]>([]);

    const tableRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(
            () => setDebouncedQuery(query.trim()),
            300,
        );

        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        let cancelled = false;

        if (debouncedQuery.length < 3) {
            setSearchLoading(false);
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }

        const searchBeneficiaries = async () => {
            setSearchLoading(true);
            setSearchOpen(true);

            try {
                const response = await fetch(
                    `${route('beneficiarios.search')}?q=${encodeURIComponent(debouncedQuery)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok || cancelled) {
                    return;
                }

                const data = (await response.json()) as SearchBeneficiary[];

                if (!cancelled) {
                    setSearchResults(data);
                }
            } finally {
                if (!cancelled) {
                    setSearchLoading(false);
                }
            }
        };

        void searchBeneficiaries();

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

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

    const addBeneficiaryToSelection = (beneficiary: {
        id: string;
        full_name: string;
        rfc?: string | null;
        relationship_id?: string | null;
    }) => {
        const alreadyAdded = beneficiaries.some(
            (item) => String(item.beneficiary_id) === String(beneficiary.id),
        );

        if (alreadyAdded) {
            toast.warning('Ya fue agregado');
            return;
        }

        setBeneficiaries([
            ...beneficiaries,
            {
                beneficiary_id: beneficiary.id,
                full_name: beneficiary.full_name,
                rfc: beneficiary.rfc ?? null,
                relationship_id: beneficiary.relationship_id ?? null,
                percentage: null,
            },
        ]);

        window.setTimeout(() => {
            tableRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 100);
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

        const created = (await response.json()) as BeneficiaryCatalog & {
            full_name: string;
        };

        addBeneficiaryToSelection({
            id: created.id,
            full_name: created.full_name,
            rfc: created.rfc,
            relationship_id: created.relationship_id,
        });

        toast.success('Beneficiario creado y agregado');
        setOpenDialog(false);
        resetDialog();
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold">
                            Beneficiarios seleccionados
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Busca y agrega beneficiarios. Asigna porcentajes por
                            póliza hasta sumar 100%.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            Total: {total.toFixed(2)}%
                        </Badge>
                        <Badge className={status.className}>
                            {status.label}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-1">
                    <Combobox
                        value=""
                        open={searchOpen && debouncedQuery.length >= 3}
                        onOpenChange={setSearchOpen}
                        onValueChange={(value) => {
                            if (!value) return;

                            const beneficiary =
                                searchResults.find(
                                    (item) => item.id === value,
                                ) ?? null;

                            if (!beneficiary) return;

                            addBeneficiaryToSelection(beneficiary);
                            setQuery('');
                            setSearchResults([]);
                            setSearchOpen(false);
                        }}
                    >
                        <ComboboxInput
                            placeholder="Buscar beneficiario (mínimo 3 caracteres)..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            aria-label="Buscar beneficiario"
                            className="w-full"
                        />
                        {debouncedQuery.length >= 3 && (
                            <ComboboxContent>
                                <ComboboxList>
                                    {searchLoading && (
                                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                            <Loader2 className="size-4 animate-spin" />
                                            Buscando beneficiarios...
                                        </div>
                                    )}
                                    {!searchLoading &&
                                        searchResults.length === 0 && (
                                            <ComboboxEmpty>
                                                Sin resultados.
                                            </ComboboxEmpty>
                                        )}
                                    {searchResults.map((beneficiary) => (
                                        <ComboboxItem
                                            key={beneficiary.id}
                                            value={beneficiary.id}
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {beneficiary.full_name}
                                                </p>
                                                {beneficiary.rfc && (
                                                    <p className="text-xs text-muted-foreground">
                                                        RFC: {beneficiary.rfc}
                                                    </p>
                                                )}
                                            </div>
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        )}
                    </Combobox>
                    <p className="text-xs text-muted-foreground">
                        También puedes crear un beneficiario nuevo si no existe.
                    </p>
                </div>

                <Button type="button" onClick={() => setOpenDialog(true)}>
                    <Plus className="mr-2 size-4" /> Crear beneficiario nuevo
                </Button>
            </div>

            {errors?.beneficiaries && (
                <FieldError>{errors.beneficiaries}</FieldError>
            )}

            <div ref={tableRef} className="rounded-lg border">
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
                        {beneficiaries.length === 0 && (
                            <tr className="border-t">
                                <td
                                    colSpan={5}
                                    className="p-4 text-center text-sm text-muted-foreground"
                                >
                                    Aún no has agregado beneficiarios.
                                </td>
                            </tr>
                        )}
                        {beneficiaries.map((item) => (
                            <tr
                                key={item.beneficiary_id}
                                className="border-t align-top"
                            >
                                <td className="p-2">{item.full_name}</td>
                                <td className="p-2">{item.rfc || '—'}</td>
                                <td className="p-2">
                                    {relationshipName(item.relationship_id)}
                                </td>
                                <td className="p-2">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.01"
                                        value={item.percentage ?? ''}
                                        onChange={(event) => {
                                            const rawValue = event.target.value;
                                            const parsedValue =
                                                rawValue === ''
                                                    ? null
                                                    : Number(rawValue);

                                            setBeneficiaries(
                                                beneficiaries.map((row) =>
                                                    row.beneficiary_id ===
                                                    item.beneficiary_id
                                                        ? {
                                                              ...row,
                                                              percentage:
                                                                  parsedValue ===
                                                                      null ||
                                                                  Number.isNaN(
                                                                      parsedValue,
                                                                  )
                                                                      ? null
                                                                      : Number(
                                                                            parsedValue.toFixed(
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
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            setBeneficiaries(
                                                beneficiaries.filter(
                                                    (row) =>
                                                        row.beneficiary_id !==
                                                        item.beneficiary_id,
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

            <CrudFormDialog
                open={openDialog}
                onOpenChange={(open) => {
                    setOpenDialog(open);
                    if (!open) {
                        resetDialog();
                    }
                }}
                title="Crear beneficiario"
                description="Registra un beneficiario nuevo y se agregará automáticamente a la tabla."
                submitLabel="Crear y agregar"
                processing={saving}
                onSubmit={(event) => {
                    event.preventDefault();
                    void createAndAddBeneficiary();
                }}
            >
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
                                              String(item.id) === String(value),
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
                        <FieldError>{createErrors.relationship_id}</FieldError>
                    </div>
                </div>
            </CrudFormDialog>
        </div>
    );
}
