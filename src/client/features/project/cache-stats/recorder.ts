import { useCacheStatsStore } from './store';

export function recordApiCall(endpoint: string, isFromCache: boolean) {
    useCacheStatsStore.getState().recordCall({
        endpoint,
        isFromCache,
        isError: false,
        isRateLimited: false,
    });
}

export function recordApiError(endpoint: string, isRateLimited: boolean) {
    useCacheStatsStore.getState().recordCall({
        endpoint,
        isFromCache: false,
        isError: true,
        isRateLimited,
    });
}
