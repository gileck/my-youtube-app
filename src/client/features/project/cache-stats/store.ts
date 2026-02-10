import { createStore } from '@/client/stores';

const MAX_RECORDS = 1000;

export interface ApiCallRecord {
    timestamp: number;
    endpoint: string;
    isFromCache: boolean;
    isError: boolean;
    isRateLimited: boolean;
}

interface CacheStatsState {
    calls: ApiCallRecord[];
    recordCall: (record: Omit<ApiCallRecord, 'timestamp'>) => void;
    clearStats: () => void;
}

export const useCacheStatsStore = createStore<CacheStatsState>({
    key: 'cache-stats',
    label: 'Cache Stats',
    inMemoryOnly: true,
    creator: (set) => ({
        calls: [],

        recordCall: (record) => {
            set((state) => {
                const newCalls = [...state.calls, { ...record, timestamp: Date.now() }];
                if (newCalls.length > MAX_RECORDS) {
                    return { calls: newCalls.slice(-MAX_RECORDS) };
                }
                return { calls: newCalls };
            });
        },

        clearStats: () => {
            set({ calls: [] });
        },
    }),
});
