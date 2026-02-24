import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
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
    initialStep = 1,
    preselectedClient,
    insureds,
    relationships,
    paymentChannels,
    currencies,
    periodicities,
    insuranceCompanies,
    products,
}: any) {
    const [step, setStep] = useState(initialStep);
    const [sameAsClient, setSameAsClient] = useState(true);
    const [isNewClient, setIsNewClient] = useState(
        !Boolean(preselectedClient ?? policy?.client_id),
    );
    const [beneficiaries, setBeneficiaries] = useState(
        policy?.beneficiaries ?? [],
    );
    const [selectedClient, setSelectedClient] = useState<any>(
        preselectedClient ?? policy?.client ?? null,
    );
    const [clientForm, setClientForm] = useState({
        first_name: preselectedClient?.first_name ?? '',
        middle_name: preselectedClient?.middle_name ?? '',
        last_name: preselectedClient?.last_name ?? '',
        second_last_name: preselectedClient?.second_last_name ?? '',
        email: preselectedClient?.email ?? '',
        phone: preselectedClient?.phone ?? '',
        rfc: preselectedClient?.rfc ?? '',
        address: preselectedClient?.address ?? '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeAction, setActiveAction] = useState<
        'next' | 'finish' | 'save-exit' | null
    >(null);
    const { flash } = usePage<SharedData>().props;

    const form = useForm({
        policy_id: policy?.id ?? '',
        client_id: policy?.client_id ?? preselectedClient?.id ?? '',
        insured_id: policy?.insured_id ?? '',
        payment_channel: policy?.payment_channel ?? '',
        insurance_company_id: policy?.insurance_company_id ?? '',
        product_id: policy?.product_id ?? '',
        coverage_start: policy?.coverage_start ?? '',
        risk_premium: policy?.risk_premium ?? '',
        fractional_premium: policy?.fractional_premium ?? '',
        periodicity_id: policy?.periodicity_id ?? '',
        month: policy?.month ?? '',
        currency_id: policy?.currency_id ?? '',
        same_as_client: true,
        client: clientForm,
        insured: {
            first_name: policy?.insured?.first_name ?? '',
            middle_name: policy?.insured?.middle_name ?? '',
            last_name: policy?.insured?.last_name ?? '',
            second_last_name: policy?.insured?.second_last_name ?? '',
            email: policy?.insured?.email ?? '',
            phone: policy?.insured?.phone ?? '',
            rfc: policy?.insured?.rfc ?? '',
            birthday: policy?.insured?.birthday ?? '',
            age_current: policy?.insured?.age_current ?? '',
            address: policy?.insured?.address ?? '',
            occupation: policy?.insured?.occupation ?? '',
            company_name: policy?.insured?.company_name ?? '',
            approx_income: policy?.insured?.approx_income ?? '',
            medical_history: policy?.insured?.medical_history ?? '',
            main_savings_goal: policy?.insured?.main_savings_goal ?? '',
            personal_interests: policy?.insured?.personal_interests ?? '',
            personal_likes: policy?.insured?.personal_likes ?? '',
            smokes: Boolean(policy?.insured?.smokes),
            drinks: Boolean(policy?.insured?.drinks),
            personality: policy?.insured?.personality ?? '',
            children_count: policy?.insured?.children_count ?? '',
        },
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    useEffect(() => {
        form.setData('client', clientForm as any);
    }, [clientForm]);

    useEffect(() => {
        if (policy?.id && form.data.policy_id !== policy.id) {
            form.setData('policy_id', policy.id as any);
        }
    }, [form, policy?.id]);

    const totalPercent = beneficiaries.reduce(
        (sum: number, b: any) => sum + Number(b.benefit_percentage || 0),
        0,
    );

    const hasExistingInsured = insureds.some(
        (item: any) => String(item.client_id) === String(form.data.client_id),
    );

    const saveCurrentStep = (onSuccess?: () => void) => {
        setIsSubmitting(true);
        setActiveAction('next');

        const visitOptions = {
            preserveScroll: true,
            onSuccess,
            onFinish: () => {
                setIsSubmitting(false);
                setActiveAction(null);
            },
        };

        if (step === 1) {
            if (isNewClient) {
                form.setData('client_id', '');
            }

            return form.post(route('polizas.wizard.step1'), visitOptions);
        }
        if (step === 2) {
            form.setData(
                'same_as_client',
                (hasExistingInsured ? sameAsClient : false) as any,
            );
            return form.post(route('polizas.wizard.step2'), visitOptions);
        }
        if (step === 3) {
            return form.post(route('polizas.wizard.step3'), visitOptions);
        }

        return router.post(
            route('polizas.wizard.step4'),
            { policy_id: form.data.policy_id, beneficiaries },
            visitOptions,
        );
    };

    const handleSaveAndExit = () => {
        setIsSubmitting(true);
        setActiveAction('save-exit');

        router.post(
            route('polizas.wizard.save-exit'),
            {
                policy_id: form.data.policy_id,
                current_step: step,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setActiveAction(null);
                },
            },
        );
    };

    const handleFinish = () => {
        setIsSubmitting(true);
        setActiveAction('finish');

        router.post(
            route('polizas.wizard.finish', form.data.policy_id),
            {},
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setActiveAction(null);
                },
            },
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pólizas', href: route('polizas.index') },
        { title: 'Wizard', href: route('polizas.wizard.create') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wizard de póliza" />
            <div className="mx-auto w-full max-w-6xl space-y-4 p-4">
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
                                preselectedClient={preselectedClient}
                                selectedId={form.data.client_id}
                                setSelectedId={(v: string) =>
                                    form.setData('client_id', v)
                                }
                                clientForm={clientForm}
                                setClientForm={setClientForm}
                                onClientSelected={setSelectedClient}
                                isNewClient={isNewClient}
                                setIsNewClient={setIsNewClient}
                            />
                        )}
                        {step === 2 && (
                            <Step2Asegurado
                                contratante={selectedClient}
                                sameAsClient={sameAsClient}
                                setSameAsClient={setSameAsClient}
                                insured={form.data.insured}
                                setInsured={(insured: any) =>
                                    form.setData('insured', insured)
                                }
                                insureds={insureds}
                                hasExistingInsured={hasExistingInsured}
                            />
                        )}
                        {step === 3 && (
                            <Step3Poliza
                                data={form.data}
                                setData={form.setData}
                                paymentChannels={paymentChannels}
                                currencies={currencies}
                                periodicities={periodicities}
                                insuranceCompanies={insuranceCompanies}
                                products={products}
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
                            disabled={isSubmitting}
                            onClick={handleSaveAndExit}
                        >
                            {isSubmitting && activeAction === 'save-exit' ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />{' '}
                                    Guardando...
                                </>
                            ) : (
                                'Guardar y salir'
                            )}
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                disabled={step === 1 || isSubmitting}
                                onClick={() => setStep((s: number) => s - 1)}
                            >
                                Atrás
                            </Button>
                            {step < 4 ? (
                                <Button
                                    disabled={isSubmitting}
                                    onClick={() =>
                                        saveCurrentStep(() =>
                                            setStep((s: number) =>
                                                Math.min(4, s + 1),
                                            ),
                                        )
                                    }
                                >
                                    {isSubmitting && activeAction === 'next' ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />{' '}
                                            Guardando...
                                        </>
                                    ) : (
                                        'Siguiente'
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    disabled={
                                        totalPercent !== 100 ||
                                        !form.data.policy_id ||
                                        isSubmitting
                                    }
                                    onClick={handleFinish}
                                >
                                    {isSubmitting &&
                                    activeAction === 'finish' ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />{' '}
                                            Finalizando...
                                        </>
                                    ) : (
                                        'Terminar'
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
