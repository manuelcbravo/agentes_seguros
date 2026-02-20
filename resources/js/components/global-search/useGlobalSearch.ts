import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useEffect, useMemo, useRef, useState } from 'react';

export type GlobalSearchItem = {
    type: 'client' | 'insured' | 'beneficiary' | 'policy';
    id: string;
    title: string;
    subtitle: string;
    badges: string[];
    url: string;
    highlight?: {
        title?: string;
        subtitle?: string;
    };
};

export type GlobalSearchGroup = {
    key: string;
    label: string;
    icon: string;
    count: number;
    items: GlobalSearchItem[];
};

type GlobalSearchResponse = {
    query: string;
    took_ms: number;
    total: number;
    groups: GlobalSearchGroup[];
};

export function useGlobalSearch(open: boolean) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<GlobalSearchGroup[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [total, setTotal] = useState(0);
    const [tookMs, setTookMs] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    const normalizedQuery = query.trim();

    const flatItems = useMemo(
        () =>
            groups.flatMap((group) =>
                group.items.map((item) => ({ ...item, groupKey: group.key })),
            ),
        [groups],
    );

    useEffect(() => {
        if (!open) {
            abortRef.current?.abort();
            setLoading(false);
            setGroups([]);
            setActiveIndex(-1);
            setTotal(0);
            setTookMs(0);
            return;
        }

        if (normalizedQuery.length < 3) {
            abortRef.current?.abort();
            setLoading(false);
            setGroups([]);
            setActiveIndex(-1);
            setTotal(0);
            setTookMs(0);
            return;
        }

        const timeout = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoading(true);

            try {
                const response = await fetch(
                    route('search.global', { q: normalizedQuery }),
                    {
                        method: 'GET',
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error('No se pudo realizar la búsqueda global.');
                }

                const payload = (await response.json()) as GlobalSearchResponse;
                setGroups(payload.groups ?? []);
                setTotal(payload.total ?? 0);
                setTookMs(payload.took_ms ?? 0);
                setActiveIndex((current) => {
                    const nextLength =
                        payload.groups?.reduce(
                            (acc, group) => acc + group.items.length,
                            0,
                        ) ?? 0;

                    if (nextLength === 0) return -1;
                    return current < 0 || current >= nextLength ? 0 : current;
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setGroups([]);
                    setTotal(0);
                    setTookMs(0);
                }
            } finally {
                setLoading(false);
            }
        }, 280);

        return () => clearTimeout(timeout);
    }, [normalizedQuery, open]);

    const openItem = (item: GlobalSearchItem) => {
        router.visit(item.url);
    };

    return {
        query,
        setQuery,
        loading,
        groups,
        flatItems,
        activeIndex,
        setActiveIndex,
        openItem,
        total,
        tookMs,
        minLengthMet: normalizedQuery.length >= 3,
        normalizedQuery,
    };
}
