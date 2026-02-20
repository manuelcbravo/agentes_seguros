import {
    FileText,
    HeartHandshake,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GlobalSearchItem } from './useGlobalSearch';

const typeIcons = {
    client: Users,
    lead: Users,
    insured: ShieldCheck,
    beneficiary: HeartHandshake,
    policy: FileText,
};

function highlightText(text: string, query: string) {
    if (!query) return text;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(`(${escaped})`, 'ig');
    const parts = text.split(matcher);

    return parts.map((part, index) => {
        const matches = part.toLowerCase() === query.toLowerCase();

        return matches ? (
            <mark
                key={`${part}-${index}`}
                className="rounded-sm bg-primary/15 px-0.5 text-foreground"
            >
                {part}
            </mark>
        ) : (
            <span key={`${part}-${index}`}>{part}</span>
        );
    });
}

type ResultCardProps = {
    item: GlobalSearchItem;
    query: string;
    active?: boolean;
    onOpen: (item: GlobalSearchItem) => void;
};

export function ResultCard({
    item,
    query,
    active = false,
    onOpen,
}: ResultCardProps) {
    const Icon = typeIcons[item.type] ?? Search;

    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            className={cn(
                'group w-full rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all',
                'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
                'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none',
                active && 'border-primary/40 ring-2 ring-primary/40',
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                        {highlightText(item.title, query)}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                        {highlightText(item.subtitle ?? '', query)}
                    </p>

                    {item.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {item.badges.map((badge) => (
                                <Badge
                                    key={`${item.id}-${badge}`}
                                    variant="secondary"
                                    className="rounded-full text-[10px]"
                                >
                                    {badge}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}
