import { Badge } from '@/components/ui/badge';

type Props = {
    title: string;
    description: string;
    status?: 'borrador' | 'activo' | 'caducada';
};

export default function StepHeader({
    title,
    description,
    status = 'borrador',
}: Props) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            <Badge
                variant={
                    status === 'activo'
                        ? 'default'
                        : status === 'caducada'
                          ? 'destructive'
                          : 'secondary'
                }
            >
                {status === 'activo'
                    ? 'Activo'
                    : status === 'caducada'
                      ? 'Caducada'
                      : 'Borrador'}
            </Badge>
        </div>
    );
}
