import type { ApexOptions } from 'apexcharts';
import { ClientOnlyChart } from '@/components/charts/client-only-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PieChartCardProps = {
    title: string;
    labels: string[];
    series: number[];
};

export function PieChartCard({ title, labels, series }: PieChartCardProps) {
    const options: ApexOptions = {
        labels,
        chart: { toolbar: { show: false } },
        dataLabels: { enabled: false },
        legend: { position: 'bottom' },
    };

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ClientOnlyChart options={options} series={series} type="pie" height={280} />
            </CardContent>
        </Card>
    );
}
