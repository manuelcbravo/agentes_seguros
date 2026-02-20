import { Activity } from 'lucide-react';
import { TrackingPanel } from '@/components/tracking/TrackingPanel';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

type CatalogItem = { id: number; key: string; name: string };

export function TrackingDrawer({
    open,
    onOpenChange,
    trackableType,
    trackableId,
    trackableLabel,
    catalogs,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trackableType: string;
    trackableId: string | number;
    trackableLabel: string;
    catalogs: {
        activityTypes: CatalogItem[];
        channels: CatalogItem[];
        statuses: CatalogItem[];
        priorities: CatalogItem[];
        outcomes: CatalogItem[];
    };
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full overflow-y-auto sm:max-w-2xl"
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Activity className="size-4" /> Seguimiento
                    </SheetTitle>
                    <SheetDescription>
                        Historial y próximos pasos de{' '}
                        <span className="font-medium">{trackableLabel}</span>.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                    <TrackingPanel
                        trackableType={trackableType}
                        trackableId={trackableId}
                        catalogs={catalogs}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
