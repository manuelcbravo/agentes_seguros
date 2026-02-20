import { Badge } from '@/components/ui/badge';

type Props = {
    title: string;
    description: string;
    estatus?: 'borrador' | 'activo' | 'caducada';
};

export default function StepHeader({
    title,
    description,
    estatus = 'borrador',
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
                    estatus === 'activo'
                        ? 'default'
                        : estatus === 'caducada'
                          ? 'destructive'
                          : 'secondary'
                }
            >
                {estatus === 'activo'
                    ? 'Activo'
                    : estatus === 'caducada'
                      ? 'Caducada'
                      : 'Borrador'}
            </Badge>
        </div>
    );
}
