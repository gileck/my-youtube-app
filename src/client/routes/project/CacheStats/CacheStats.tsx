import { useState } from 'react';
import { useCacheStatsStore, getStatsForWindow, getStatsPerEndpoint, TIME_WINDOWS } from '@/client/features/project/cache-stats';
import { TimeWindowSelector, StatsOverview, EndpointBreakdown } from './components';
import { Button } from '@/client/components/template/ui/button';
import { Trash2, Database } from 'lucide-react';

export function CacheStats() {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI state for time window selection
    const [windowMs, setWindowMs] = useState<number>(TIME_WINDOWS[3].ms);
    const calls = useCacheStatsStore((s) => s.calls);
    const clearStats = useCacheStatsStore((s) => s.clearStats);

    const stats = getStatsForWindow(calls, windowMs);
    const perEndpoint = getStatsPerEndpoint(calls, windowMs);

    return (
        <div className="p-4 space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database size={20} />
                    <h1 className="text-lg font-semibold">Cache Stats</h1>
                </div>
                <Button variant="outline" size="sm" onClick={clearStats} disabled={calls.length === 0}>
                    <Trash2 size={14} className="mr-1" />
                    Clear
                </Button>
            </div>

            <TimeWindowSelector selected={windowMs} onSelect={setWindowMs} />

            {calls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Database size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No API calls recorded yet.</p>
                    <p className="text-sm mt-1">Search for videos to start collecting stats.</p>
                </div>
            ) : (
                <>
                    <StatsOverview stats={stats} />
                    <EndpointBreakdown statsPerEndpoint={perEndpoint} />
                </>
            )}
        </div>
    );
}
