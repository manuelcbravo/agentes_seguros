import { cn } from '@/lib/utils';
import { FileText, HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import { ResultCard } from './ResultCard';
import type { GlobalSearchGroup, GlobalSearchItem } from './useGlobalSearch';

const groupIcons = {
    clients: Users,
    insureds: ShieldCheck,
    beneficiaries: HeartHandshake,
    policies: FileText,
};

type ResultGroupProps = {
    group: GlobalSearchGroup;
    query: string;
    activeIndex: number;
    startIndex: number;
    onOpen: (item: GlobalSearchItem) => void;
};

export function ResultGroup({
    group,
    query,
    activeIndex,
    startIndex,
    onOpen,
}: ResultGroupProps) {
    const HeaderIcon =
        groupIcons[group.key as keyof typeof groupIcons] ?? Users;

    return (
        <section className="space-y-2">
            <header className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-border/50 bg-background/90 px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <HeaderIcon className="size-4 text-primary" />
                    <span>{group.label}</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {group.count}
                </span>
            </header>

            <div className={cn('space-y-2')}>
                {group.items.map((item, index) => (
                    <ResultCard
                        key={`${group.key}-${item.id}`}
                        item={item}
                        query={query}
                        onOpen={onOpen}
                        active={activeIndex === startIndex + index}
                    />
                ))}
            </div>
        </section>
    );
}
