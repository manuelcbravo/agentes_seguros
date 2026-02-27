import { Head } from '@inertiajs/react';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { LineChartCard } from '@/components/charts/line-chart-card';
import { PieChartCard } from '@/components/charts/pie-chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

type ChartSet = {
    labels: string[];
    series: number[];
};

type DashboardProps = {
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const formatNumber = (value: number) => new Intl.NumberFormat('es-MX').format(value);

export default function Dashboard({ pies, barras, lineas, kpis }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 p-4">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Visión ejecutiva de tu desempeño comercial y de cartera.</p>
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
