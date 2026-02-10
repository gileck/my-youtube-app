import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getChannelVideos, searchVideos } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
import { useSubscriptionsStore } from '@/client/features/project/subscriptions';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { deduplicateVideos, filterVideos, sortVideos } from './utils';

interface FeedFilters {
    sortBy: 'newest' | 'most_viewed';
    uploadDate: string;
    duration: string;
    minViews: number;
}

export function useVideoFeed(filters: FeedFilters) {
    const channels = useSubscriptionsStore((s) => s.channels);
    const searchQueries = useSubscriptionsStore((s) => s.searchQueries);
    const queryDefaults = useQueryDefaults();

    const uploadDateParam = filters.uploadDate !== 'all' ? filters.uploadDate : undefined;

    const channelQueryConfigs = channels.map((channel) => ({
        queryKey: ['youtube', 'feed', 'channel', channel.id, uploadDateParam],
        queryFn: async () => {
            try {
                const response = await getChannelVideos({
                    channelId: channel.id,
                    filters: uploadDateParam ? { upload_date: uploadDateParam } : undefined,
                });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getChannelVideos', response.data?._isFromCache ?? false);
                return response.data?.data?.videos ?? [];
            } catch (error) {
                recordApiError('getChannelVideos', !!(error as Error & { _isRateLimited?: boolean })?._isRateLimited);
                throw error;
            }
        },
        enabled: !!channel.id,
        ...queryDefaults,
    }));

    const searchQueryConfigs = searchQueries.map((query) => ({
        queryKey: ['youtube', 'feed', 'search', query, uploadDateParam],
        queryFn: async () => {
            try {
                const response = await searchVideos({
                    query,
                    upload_date: uploadDateParam,
                });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('searchVideos', response.data?._isFromCache ?? false);
                return [
                    ...(response.data?.videos ?? []),
                    ...(response.data?.filteredVideos ?? []),
                ];
            } catch (error) {
                recordApiError('searchVideos', !!(error as Error & { _isRateLimited?: boolean })?._isRateLimited);
                throw error;
            }
        },
        enabled: !!query.trim(),
        ...queryDefaults,
    }));

    const allQueryConfigs = [...channelQueryConfigs, ...searchQueryConfigs];

    const results = useQueries({ queries: allQueryConfigs });

    const isLoading = results.some((r) => r.isLoading && !r.data);
    const hasError = results.some((r) => r.error);
    const firstError = results.find((r) => r.error)?.error ?? null;

    const dataKey = results.map((r) => r.dataUpdatedAt).join(',');

    const videos = useMemo((): YouTubeVideoSearchResult[] => {
        const allVideos: YouTubeVideoSearchResult[] = [];
        for (const result of results) {
            if (result.data) {
                allVideos.push(...(result.data as YouTubeVideoSearchResult[]));
            }
        }
        const deduped = deduplicateVideos(allVideos);
        const filtered = filterVideos(deduped, {
            duration: filters.duration,
            minViews: filters.minViews,
        });
        return sortVideos(filtered, filters.sortBy);
    }, [dataKey, filters.sortBy, filters.duration, filters.minViews]);

    const hasSubscriptions = channels.length > 0 || searchQueries.length > 0;

    return { videos, isLoading, hasError, error: firstError, hasSubscriptions };
}
