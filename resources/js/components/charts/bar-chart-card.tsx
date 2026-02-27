import type { ApexOptions } from 'apexcharts';
import { ClientOnlyChart } from '@/components/charts/client-only-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BarSeries = {
    name: string;
    data: number[];
};

type BarChartCardProps = {
    title: string;
    categories: string[];
    series: BarSeries[];
};

export function BarChartCard({ title, categories, series }: BarChartCardProps) {
    const options: ApexOptions = {
        chart: { toolbar: { show: false } },
        dataLabels: { enabled: false },
        legend: { position: 'bottom' },
        xaxis: { categories },
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '50%',
            },
        },
    };

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ClientOnlyChart options={options} series={series} type="bar" height={300} />
            </CardContent>
        </Card>
    );
}
