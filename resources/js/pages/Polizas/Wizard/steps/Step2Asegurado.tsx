import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Step2Asegurado({
    contratante,
    sameAsClient,
    setSameAsClient,
    insured,
    setInsured,
    hasExistingInsured,
    errors,
}: any) {
    const showSamePersonOption = Boolean(hasExistingInsured);

    return (
        <div className="space-y-5">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                Contratante:{' '}
                <strong>{contratante?.full_name ?? 'Sin seleccionar'}</strong>
            </div>

            {showSamePersonOption && (
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
            )}

            {(!showSamePersonOption || !sameAsClient) && (
                <>
                    <section className="space-y-3 rounded-lg border p-4">
                        <h3 className="font-semibold">Identidad</h3>
                        <FieldError>{errors?.insured}</FieldError>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="insured_first_name">
                                    Nombre(s)
                                </Label>
                                <Input
                                    id="insured_first_name"
                                    placeholder="Nombre(s)"
                                    value={insured.first_name}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            first_name: e.target.value,
                                        })
                                    }
                                />
                                <FieldError>
                                    {errors?.['insured.first_name']}
                                </FieldError>
                            </div>
                            <div>
                                <Label htmlFor="insured_middle_name">
                                    Segundo nombre
                                </Label>
                                <Input
                                    id="insured_middle_name"
                                    placeholder="Segundo nombre"
                                    value={insured.middle_name}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            middle_name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_last_name">
                                    Apellido paterno
                                </Label>
                                <Input
                                    id="insured_last_name"
                                    placeholder="Apellido paterno"
                                    value={insured.last_name}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            last_name: e.target.value,
                                        })
                                    }
                                />
                                <FieldError>
                                    {errors?.['insured.last_name']}
                                </FieldError>
                            </div>
                            <div>
                                <Label htmlFor="insured_second_last_name">
                                    Apellido materno
                                </Label>
                                <Input
                                    id="insured_second_last_name"
                                    placeholder="Apellido materno"
                                    value={insured.second_last_name}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            second_last_name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_rfc">RFC</Label>
                                <Input
                                    id="insured_rfc"
                                    placeholder="RFC"
                                    value={insured.rfc}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            rfc: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_birthday">
                                    Fecha de nacimiento
                                </Label>
                                <Input
                                    id="insured_birthday"
                                    type="date"
                                    value={insured.birthday}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            birthday: e.target.value,
                                        })
                                    }
                                />
                                <FieldError>
                                    {errors?.['insured.birthday']}
                                </FieldError>
                            </div>
                            <div>
                                <Label htmlFor="insured_age_current">
                                    Edad actual
                                </Label>
                                <Input
                                    id="insured_age_current"
                                    type="number"
                                    placeholder="Edad actual"
                                    value={insured.age_current}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            age_current: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </section>
                    <section className="space-y-3 rounded-lg border p-4">
                        <h3 className="font-semibold">Contacto y dirección</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="insured_email">Email</Label>
                                <Input
                                    id="insured_email"
                                    placeholder="Email"
                                    value={insured.email}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_phone">Teléfono</Label>
                                <Input
                                    id="insured_phone"
                                    placeholder="Teléfono"
                                    value={insured.phone}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            phone: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_occupation">
                                    Ocupación
                                </Label>
                                <Input
                                    id="insured_occupation"
                                    placeholder="Ocupación"
                                    value={insured.occupation}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            occupation: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_company_name">
                                    Empresa
                                </Label>
                                <Input
                                    id="insured_company_name"
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
                            <div>
                                <Label htmlFor="insured_approx_income">
                                    Ingreso aproximado
                                </Label>
                                <Input
                                    id="insured_approx_income"
                                    type="number"
                                    placeholder="Ingreso aproximado"
                                    value={insured.approx_income}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            approx_income: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_children_count">
                                    Número de hijos
                                </Label>
                                <Input
                                    id="insured_children_count"
                                    type="number"
                                    placeholder="Número de hijos"
                                    value={insured.children_count}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            children_count: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="insured_address">Dirección</Label>
                            <Textarea
                                id="insured_address"
                                placeholder="Dirección"
                                value={insured.address}
                                onChange={(e) =>
                                    setInsured({
                                        ...insured,
                                        address: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </section>
                    <section className="space-y-3 rounded-lg border p-4">
                        <h3 className="font-semibold">Datos adicionales</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="insured_main_savings_goal">
                                    Meta principal de ahorro
                                </Label>
                                <Input
                                    id="insured_main_savings_goal"
                                    placeholder="Meta principal de ahorro"
                                    value={insured.main_savings_goal}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            main_savings_goal: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="insured_personality">
                                    Personalidad
                                </Label>
                                <Input
                                    id="insured_personality"
                                    placeholder="Personalidad"
                                    value={insured.personality}
                                    onChange={(e) =>
                                        setInsured({
                                            ...insured,
                                            personality: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="insured_medical_history">
                                Historial médico
                            </Label>
                            <Textarea
                                id="insured_medical_history"
                                placeholder="Historial médico"
                                value={insured.medical_history}
                                onChange={(e) =>
                                    setInsured({
                                        ...insured,
                                        medical_history: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="insured_personal_interests">
                                Intereses personales
                            </Label>
                            <Textarea
                                id="insured_personal_interests"
                                placeholder="Intereses personales"
                                value={insured.personal_interests}
                                onChange={(e) =>
                                    setInsured({
                                        ...insured,
                                        personal_interests: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="insured_personal_likes">
                                Gustos personales
                            </Label>
                            <Textarea
                                id="insured_personal_likes"
                                placeholder="Gustos personales"
                                value={insured.personal_likes}
                                onChange={(e) =>
                                    setInsured({
                                        ...insured,
                                        personal_likes: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="flex gap-6 text-sm">
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={Boolean(insured.smokes)}
                                    onCheckedChange={(v) =>
                                        setInsured({
                                            ...insured,
                                            smokes: Boolean(v),
                                        })
                                    }
                                />
                                Fuma
                            </label>
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={Boolean(insured.drinks)}
                                    onCheckedChange={(v) =>
                                        setInsured({
                                            ...insured,
                                            drinks: Boolean(v),
                                        })
                                    }
                                />
                                Bebe alcohol
                            </label>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
