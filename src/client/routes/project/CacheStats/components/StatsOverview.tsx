import type { WindowStats } from '@/client/features/project/cache-stats';
import { Card, CardContent } from '@/client/components/template/ui/card';
import { Activity, CheckCircle, XCircle, Percent, AlertTriangle } from 'lucide-react';

interface StatsOverviewProps {
    stats: WindowStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
    const metrics = [
        { label: 'Total Calls', value: stats.total, icon: <Activity size={18} /> },
        { label: 'Cache Hits', value: stats.hits, icon: <CheckCircle size={18} className="text-success" /> },
        { label: 'Cache Misses', value: stats.misses, icon: <XCircle size={18} className="text-warning" /> },
        { label: 'Hit Ratio', value: `${(stats.hitRatio * 100).toFixed(1)}%`, icon: <Percent size={18} /> },
        { label: 'Rate Limited', value: stats.rateLimited, icon: <AlertTriangle size={18} className="text-destructive" /> },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {metrics.map((m) => (
                <Card key={m.label}>
                    <CardContent className="p-4 flex flex-col items-center gap-1">
                        {m.icon}
                        <span className="text-2xl font-bold">{m.value}</span>
                        <span className="text-xs text-muted-foreground">{m.label}</span>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
