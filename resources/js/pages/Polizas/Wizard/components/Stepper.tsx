import { cn } from '@/lib/utils';

type Step = { key: number; title: string; description: string };

export default function Stepper({
    steps,
    currentStep,
}: {
    steps: Step[];
    currentStep: number;
}) {
    return (
        <div className="space-y-3">
            {steps.map((step) => (
                <div
                    key={step.key}
                    className={cn(
                        'rounded-lg border p-3',
                        currentStep === step.key &&
                            'border-primary bg-primary/5',
                    )}
                >
                    <p className="text-xs text-muted-foreground">
                        Paso {step.key}
                    </p>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {step.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
