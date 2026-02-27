import type { ApexOptions } from 'apexcharts';
import { ClientOnlyChart } from '@/components/charts/client-only-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type LineSeries = {
    name: string;
    data: number[];
};

type LineChartCardProps = {
    title: string;
    categories: string[];
    series: LineSeries[];
};

export function LineChartCard({ title, categories, series }: LineChartCardProps) {
    const options: ApexOptions = {
        chart: { toolbar: { show: false } },
        dataLabels: { enabled: false },
        legend: { position: 'bottom' },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories },
    };

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ClientOnlyChart options={options} series={series} type="line" height={300} />
            </CardContent>
        </Card>
    );
}
