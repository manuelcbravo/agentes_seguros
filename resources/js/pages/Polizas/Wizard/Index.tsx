import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import type { BreadcrumbItem, SharedData } from '@/types';
import StepHeader from './components/StepHeader';
import Stepper from './components/Stepper';
import Step1Contratante from './steps/Step1Contratante';
import Step2Asegurado from './steps/Step2Asegurado';
import Step3Poliza from './steps/Step3Poliza';
import Step4Beneficiarios from './steps/Step4Beneficiarios';

const steps = [
    { key: 1, title: 'Contratante', description: 'Selecciona cliente' },
    { key: 2, title: 'Asegurado', description: 'Define asegurado' },
    { key: 3, title: 'Póliza', description: 'Datos comerciales y vigencia' },
    { key: 4, title: 'Beneficiarios', description: 'Distribución al 100%' },
];

export default function PolicyWizardPage({
    policy,
    clients,
    insureds,
    relationships,
    paymentChannels,
    currencies,
}: any) {
    const [step, setStep] = useState(1);
    const [sameAsClient, setSameAsClient] = useState(true);
    const [beneficiaries, setBeneficiaries] = useState(
        policy?.beneficiaries ?? [],
    );
    const { flash } = usePage<SharedData>().props;

    const form = useForm({
        policy_id: policy?.id ?? '',
        client_id: policy?.client_id ?? '',
        insured_id: policy?.insured_id ?? '',
        payment_channel: policy?.payment_channel ?? '',
        product: policy?.product ?? '',
        coverage_start: policy?.coverage_start ?? '',
        risk_premium: policy?.risk_premium ?? '',
        fractional_premium: policy?.fractional_premium ?? '',
        periodicity: policy?.periodicity ?? '',
        month: policy?.month ?? '',
        currency: policy?.currency ?? '',
        currency_id: policy?.currency_id ?? '',
        same_as_client: true,
        insured: {
            email: policy?.insured?.email ?? '',
            phone: policy?.insured?.phone ?? '',
            rfc: policy?.insured?.rfc ?? '',
            birthday: policy?.insured?.birthday ?? '',
            occupation: policy?.insured?.occupation ?? '',
            company_name: policy?.insured?.company_name ?? '',
        },
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    const clientOptions = useMemo(
        () =>
            clients.map((c: any) => ({
                ...c,
                full_name: [
                    c.first_name,
                    c.middle_name,
                    c.last_name,
                    c.second_last_name,
                ]
                    .filter(Boolean)
                    .join(' '),
            })),
        [clients],
    );
    const contratante = clientOptions.find(
        (c: any) => c.id === form.data.client_id,
    );
    const totalPercent = beneficiaries.reduce(
        (sum: number, b: any) => sum + Number(b.benefit_percentage || 0),
        0,
    );

    const saveCurrentStep = () => {
        if (step === 1)
            return form.post(route('polizas.wizard.step1'), {
                preserveScroll: true,
            });
        if (step === 2) {
            form.setData('same_as_client', sameAsClient as any);
            return form.post(route('polizas.wizard.step2'), {
                preserveScroll: true,
            });
        }
        if (step === 3)
            return form.post(route('polizas.wizard.step3'), {
                preserveScroll: true,
            });
        return router.post(
            route('polizas.wizard.step4'),
            { policy_id: form.data.policy_id, beneficiaries },
            { preserveScroll: true },
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pólizas', href: route('polizas.index') },
        { title: 'Wizard', href: route('polizas.wizard.create') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wizard de póliza" />
            <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
                <StepHeader
                    title={policy ? 'Editar Póliza' : 'Nueva Póliza'}
                    description="Completa los 4 pasos para terminar la póliza"
                    status={policy?.status ?? 'borrador'}
                />
                <Card className="grid gap-0 md:grid-cols-[280px_1fr]">
                    <CardHeader className="border-r bg-muted/20">
                        <Stepper steps={steps} currentStep={step} />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progreso</span>
                                <span>{step}/4</span>
                            </div>
                            <Progress value={(step / 4) * 100} />
                        </div>
                        {step === 1 && (
                            <Step1Contratante
                                clients={clientOptions}
                                selectedId={form.data.client_id}
                                setSelectedId={(v) =>
                                    form.setData('client_id', v)
                                }
                            />
                        )}
                        {step === 2 && (
                            <Step2Asegurado
                                contratante={contratante}
                                sameAsClient={sameAsClient}
                                setSameAsClient={setSameAsClient}
                                insured={form.data.insured}
                                setInsured={(insured: any) =>
                                    form.setData('insured', insured)
                                }
                                insureds={insureds}
                            />
                        )}
                        {step === 3 && (
                            <Step3Poliza
                                data={form.data}
                                setData={form.setData}
                                paymentChannels={paymentChannels}
                                currencies={currencies}
                            />
                        )}
                        {step === 4 && (
                            <Step4Beneficiarios
                                beneficiaries={beneficiaries}
                                setBeneficiaries={setBeneficiaries}
                                relationships={relationships}
                            />
                        )}
                    </CardContent>
                    <CardFooter className="sticky bottom-0 col-span-full flex justify-between border-t bg-background py-4">
                        <Button
                            variant="outline"
                            disabled={!form.data.policy_id}
                            onClick={() =>
                                form.data.policy_id &&
                                router.post(
                                    route(
                                        'polizas.wizard.save-exit',
                                        form.data.policy_id,
                                    ),
                                )
                            }
                        >
                            Guardar y salir
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                disabled={step === 1}
                                onClick={() => setStep((s) => s - 1)}
                            >
                                Atrás
                            </Button>
                            {step < 4 ? (
                                <Button
                                    onClick={() => {
                                        saveCurrentStep();
                                        setStep((s) => Math.min(4, s + 1));
                                    }}
                                >
                                    Siguiente
                                </Button>
                            ) : (
                                <Button
                                    disabled={
                                        totalPercent !== 100 ||
                                        !form.data.policy_id
                                    }
                                    onClick={() =>
                                        router.post(
                                            route(
                                                'polizas.wizard.finish',
                                                form.data.policy_id,
                                            ),
                                        )
                                    }
                                >
                                    Terminar
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
