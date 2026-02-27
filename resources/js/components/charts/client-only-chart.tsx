import type { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';
import type { ApexAxisChartSeries, ApexNonAxisChartSeries } from 'react-apexcharts';

type ClientOnlyChartProps = {
    options: ApexOptions;
    series: ApexAxisChartSeries | ApexNonAxisChartSeries;
    type: 'line' | 'bar' | 'pie';
    height?: number;
};

type ChartRendererProps = {
    options: ApexOptions;
    series: ApexAxisChartSeries | ApexNonAxisChartSeries;
    type: 'line' | 'bar' | 'pie';
    height: number;
};

type ReactApexChartComponent = (props: ChartRendererProps) => JSX.Element;

export function ClientOnlyChart({ options, series, type, height = 300 }: ClientOnlyChartProps) {
    const [ChartComponent, setChartComponent] = useState<ReactApexChartComponent | null>(null);

    useEffect(() => {
        let mounted = true;

        void import('react-apexcharts').then((module) => {
            if (mounted) {
                setChartComponent(() => module.default as unknown as ReactApexChartComponent);
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    if (!ChartComponent) {
        return <div className="h-[300px] animate-pulse rounded-xl bg-muted/50" />;
    }

    return <ChartComponent options={options} series={series} type={type} height={height} />;
}
