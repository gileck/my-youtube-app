import type { ApiCallRecord } from './store';

export const TIME_WINDOWS = [
    { label: '1h', ms: 3_600_000 },
    { label: '6h', ms: 21_600_000 },
    { label: '24h', ms: 86_400_000 },
    { label: 'All', ms: Infinity },
] as const;

export interface WindowStats {
    total: number;
    hits: number;
    misses: number;
    errors: number;
    rateLimited: number;
    hitRatio: number;
}

function filterByWindow(calls: ApiCallRecord[], windowMs: number): ApiCallRecord[] {
    if (windowMs === Infinity) return calls;
    const cutoff = Date.now() - windowMs;
    return calls.filter((c) => c.timestamp >= cutoff);
}

export function getStatsForWindow(calls: ApiCallRecord[], windowMs: number): WindowStats {
    const filtered = filterByWindow(calls, windowMs);
    const errors = filtered.filter((c) => c.isError).length;
    const hits = filtered.filter((c) => !c.isError && c.isFromCache).length;
    const misses = filtered.filter((c) => !c.isError && !c.isFromCache).length;
    const rateLimited = filtered.filter((c) => c.isRateLimited).length;
    const total = filtered.length;
    const hitRatio = total - errors > 0 ? hits / (total - errors) : 0;

    return { total, hits, misses, errors, rateLimited, hitRatio };
}

export function getStatsPerEndpoint(calls: ApiCallRecord[], windowMs: number): Record<string, WindowStats> {
    const filtered = filterByWindow(calls, windowMs);
    const endpoints = [...new Set(filtered.map((c) => c.endpoint))];
    const result: Record<string, WindowStats> = {};
    for (const ep of endpoints) {
        const epCalls = filtered.filter((c) => c.endpoint === ep);
        result[ep] = getStatsForWindow(epCalls, Infinity);
    }
    return result;
}
