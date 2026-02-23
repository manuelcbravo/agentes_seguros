import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export default function Step4Beneficiarios({
    beneficiaries,
    setBeneficiaries,
    relationships,
}: any) {
    const beneficiaryFullName = (beneficiary: any) =>
        [beneficiary.first_name, beneficiary.middle_name, beneficiary.last_name, beneficiary.second_last_name]
            .filter(Boolean)
            .join(' ')
            .trim();

    const [open, setOpen] = useState(false);
    const [newBeneficiary, setNewBeneficiary] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        second_last_name: '',
        relationship_id: '',
        benefit_percentage: 0,
    });
    const total = useMemo(
        () =>
            beneficiaries.reduce(
                (sum: number, b: any) =>
                    sum + Number(b.benefit_percentage || 0),
                0,
            ),
        [beneficiaries],
    );

    const addBeneficiary = () => {
        if (!newBeneficiary.first_name || !newBeneficiary.last_name) return;
        setBeneficiaries([...beneficiaries, { ...newBeneficiary }]);
        setNewBeneficiary({
            first_name: '',
            middle_name: '',
            last_name: '',
            second_last_name: '',
            relationship_id: '',
            benefit_percentage: 0,
        });
        setOpen(false);
    };

    return (
        <div className="space-y-4">
            {total !== 100 && (
                <Alert variant="destructive">
                    <AlertTitle>Validación pendiente</AlertTitle>
                    <AlertDescription>
                        Para terminar, la suma debe ser 100%.
                    </AlertDescription>
                </Alert>
            )}
            <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Total asignado</span>
                    <strong>{total}%</strong>
                </div>
                <Progress
                    value={Math.min(100, total)}
                    className={total === 100 ? 'text-emerald-500' : ''}
                />
            </div>
            <div className="rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Parentesco</th>
                            <th className="p-2 text-left">%</th>
                            <th className="p-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {beneficiaries.map((b: any, index: number) => (
                            <tr
                                key={`${b.id ?? 'new'}-${index}`}
                                className="border-t"
                            >
                                <td className="p-2">{beneficiaryFullName(b) || '—'}</td>
                                <td className="p-2">
                                    {relationships.find(
                                        (r: any) => r.id === b.relationship_id,
                                    )?.name ?? '—'}
                                </td>
                                <td className="p-2">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={b.benefit_percentage}
                                        onChange={(e) =>
                                            setBeneficiaries(
                                                beneficiaries.map(
                                                    (row: any, i: number) =>
                                                        i === index
                                                            ? {
                                                                  ...row,
                                                                  benefit_percentage:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : row,
                                                ),
                                            )
                                        }
                                    />
                                </td>
                                <td className="p-2 text-right">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setBeneficiaries(
                                                beneficiaries.filter(
                                                    (_: any, i: number) =>
                                                        i !== index,
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
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>Agregar beneficiario</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar beneficiario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder="Nombre(s)*"
                            value={newBeneficiary.first_name}
                            onChange={(e) =>
                                setNewBeneficiary({
                                    ...newBeneficiary,
                                    first_name: e.target.value,
                                })
                            }
                        />
                        <Input
                            placeholder="Segundo nombre"
                            value={newBeneficiary.middle_name}
                            onChange={(e) =>
                                setNewBeneficiary({
                                    ...newBeneficiary,
                                    middle_name: e.target.value,
                                })
                            }
                        />
                        <Input
                            placeholder="Apellido paterno*"
                            value={newBeneficiary.last_name}
                            onChange={(e) =>
                                setNewBeneficiary({
                                    ...newBeneficiary,
                                    last_name: e.target.value,
                                })
                            }
                        />
                        <Input
                            placeholder="Apellido materno"
                            value={newBeneficiary.second_last_name}
                            onChange={(e) =>
                                setNewBeneficiary({
                                    ...newBeneficiary,
                                    second_last_name: e.target.value,
                                })
                            }
                        />
                        <Combobox
                            itemToStringLabel={(value) => !value ? 'Seleccione parentesco' : (relationships.find((r: any) => String(r.id) === String(value))?.name ?? '')}
                            value={newBeneficiary.relationship_id}
                            onValueChange={(value) =>
                                setNewBeneficiary({
                                    ...newBeneficiary,
                                    relationship_id: value,
                                })
                            }
                        >
                            <ComboboxInput
                                className="w-full"
                                placeholder="Seleccione parentesco"
                                aria-label="Parentesco"
                            />
                            <ComboboxContent>
                                <ComboboxList>
                                    <ComboboxEmpty>No se encontraron parentescos.</ComboboxEmpty>
                                    <ComboboxItem value="">Parentesco</ComboboxItem>
                                    {relationships.map((r: any) => (
                                        <ComboboxItem key={r.id} value={String(r.id)}>
                                            {r.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="%"
                            value={newBeneficiary.benefit_percentage}
                            onChange={(e) =>
                                setNewBeneficiary({
                                    ...newBeneficiary,
                                    benefit_percentage: Number(e.target.value),
                                })
                            }
                        />
                        <Button onClick={addBeneficiary} className="w-full">
                            Guardar beneficiario
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
