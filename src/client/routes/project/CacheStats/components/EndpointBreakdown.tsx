import type { WindowStats } from '@/client/features/project/cache-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/template/ui/card';

interface EndpointBreakdownProps {
    statsPerEndpoint: Record<string, WindowStats>;
}

export function EndpointBreakdown({ statsPerEndpoint }: EndpointBreakdownProps) {
    const entries = Object.entries(statsPerEndpoint);

    if (entries.length === 0) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Per Endpoint</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entries.map(([endpoint, stats]) => (
                    <Card key={endpoint}>
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm font-mono">{endpoint}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div>
                                    <div className="font-bold text-lg">{stats.total}</div>
                                    <div className="text-muted-foreground">Total</div>
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-success">{stats.hits}</div>
                                    <div className="text-muted-foreground">Hits</div>
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-warning">{stats.misses}</div>
                                    <div className="text-muted-foreground">Misses</div>
                                </div>
                            </div>
                            {stats.hitRatio > 0 && (
                                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-success rounded-full"
                                        style={{ width: `${stats.hitRatio * 100}%` }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
