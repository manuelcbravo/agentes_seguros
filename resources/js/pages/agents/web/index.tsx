import { Head, Link, useForm } from '@inertiajs/react';
import { ExternalLink, Save } from 'lucide-react';
import { route } from 'ziggy-js';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { LineChartCard } from '@/components/charts/line-chart-card';
import { PieChartCard } from '@/components/charts/pie-chart-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ChartSet = {
    labels: string[];
    series: number[];
};

type Props = {
    profile: {
        public_slug: string;
        is_public_enabled: boolean;
        contact_form_enabled: boolean;
        show_licenses: boolean;
    };
    pies: {
        leads: ChartSet;
        polizas: ChartSet;
        comisiones: ChartSet;
    };
    barras: {
        categories: string[];
        series: { name: string; data: number[] }[];
    };
    lineas: {
        meses: string[];
        nuevas: number[];
        metaNuevas: number[];
        persistencia: number[];
        metaPers: number[];
    };
    kpis: {
        polizas_total: number;
        contratantes_total: number;
        asegurados_total: number;
        beneficiarios_total: number;
        vistas_30d: number;
        leads_30d: number;
        conversion_30d: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Web', href: route('agents.web.edit') }];

const formatNumber = (value: number) => new Intl.NumberFormat('es-MX').format(value);

export default function AgentWebDashboardPage({ profile, pies, barras, lineas, kpis }: Props) {
    const form = useForm({
        is_public_enabled: profile.is_public_enabled,
        contact_form_enabled: profile.contact_form_enabled,
        show_licenses: profile.show_licenses,
        _method: 'put' as const,
    });

    const siteHref = profile.is_public_enabled ? route('public-agent-profile.show', profile.public_slug) : route('public-agent-profile.preview', profile.public_slug);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Web" />

            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Web</h1>
                        <p className="text-sm text-muted-foreground">Resumen del desempeño de tu perfil y tus oportunidades.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline">
                            <Link href={siteHref} target="_blank">
                                <ExternalLink className="mr-2 size-4" />
                                Abrir sitio
                            </Link>
                        </Button>
                        <Label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-normal">
                            <Checkbox checked={form.data.is_public_enabled} onCheckedChange={(value) => form.setData('is_public_enabled', Boolean(value))} />
                            Publicar
                        </Label>
                        <Button onClick={() => form.put(route('agents.web.update'))} disabled={form.processing}>
                            <Save className="mr-2 size-4" />
                            Guardar
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pólizas</CardTitle></CardHeader>
                        <CardContent className="pt-2"><p className="text-3xl font-semibold">{formatNumber(kpis.polizas_total)}</p></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contratantes</CardTitle></CardHeader>
                        <CardContent className="pt-2"><p className="text-3xl font-semibold">{formatNumber(kpis.contratantes_total)}</p></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Asegurados</CardTitle></CardHeader>
                        <CardContent className="pt-2"><p className="text-3xl font-semibold">{formatNumber(kpis.asegurados_total)}</p></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Beneficiarios</CardTitle></CardHeader>
                        <CardContent className="pt-2"><p className="text-3xl font-semibold">{formatNumber(kpis.beneficiarios_total)}</p></CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vistas 30 días</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-semibold">{formatNumber(kpis.vistas_30d)}</p></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Leads 30 días</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-semibold">{formatNumber(kpis.leads_30d)}</p></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conversión 30 días</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-semibold">{kpis.conversion_30d}%</p></CardContent>
                    </Card>
                </div>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Indicadores del agente</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <PieChartCard title="Leads por estatus" labels={pies.leads.labels} series={pies.leads.series} />
                        <PieChartCard title="Pólizas por estatus" labels={pies.polizas.labels} series={pies.polizas.series} />
                        <PieChartCard title="Comisiones" labels={pies.comisiones.labels} series={pies.comisiones.series} />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Desempeño</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <BarChartCard title="Leads convertidos" categories={barras.categories} series={[barras.series[0]]} />
                        <BarChartCard title="Pólizas nuevas" categories={barras.categories} series={[barras.series[1]]} />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Tendencias</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <LineChartCard
                            title="Nuevas vs meta"
                            categories={lineas.meses}
                            series={[
                                { name: 'Nuevas', data: lineas.nuevas },
                                { name: 'Meta nuevas', data: lineas.metaNuevas },
                            ]}
                        />
                        <LineChartCard
                            title="Persistencia vs meta"
                            categories={lineas.meses}
                            series={[
                                { name: 'Persistencia', data: lineas.persistencia },
                                { name: 'Meta persistencia', data: lineas.metaPers },
                            ]}
                        />
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
