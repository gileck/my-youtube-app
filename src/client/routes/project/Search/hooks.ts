import { useQuery } from '@tanstack/react-query';
import { searchVideos, searchChannels } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
import type { SearchVideosResponse, SearchChannelsResponse } from '@/apis/project/youtube/types';

interface SearchParams {
    query: string;
    sortBy: string;
    uploadDate: string;
    duration: string;
    minViews: number;
    pageNumber: number;
}

export function useSearchVideos(params: SearchParams & { enabled?: boolean }) {
    const queryDefaults = useQueryDefaults();
    const { enabled = true, ...searchParams } = params;

    return useQuery({
        queryKey: ['youtube', 'search', searchParams],
        queryFn: async (): Promise<SearchVideosResponse> => {
            try {
                const response = await searchVideos({
                    query: searchParams.query,
                    sortBy: searchParams.sortBy !== 'relevance' ? searchParams.sortBy : undefined,
                    upload_date: searchParams.uploadDate !== 'all' ? searchParams.uploadDate : undefined,
                    duration: searchParams.duration !== 'all' ? searchParams.duration : undefined,
                    minViews: searchParams.minViews > 0 ? searchParams.minViews : undefined,
                    pageNumber: searchParams.pageNumber > 1 ? searchParams.pageNumber : undefined,
                });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('searchVideos', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('searchVideos', !!(error as Error & { _isRateLimited?: boolean })?._isRateLimited);
                throw error;
            }
        },
        enabled: enabled && !!searchParams.query.trim(),
        ...queryDefaults,
    });
}

export function useSearchChannels(query: string, enabled: boolean) {
    const queryDefaults = useQueryDefaults();

    return useQuery({
        queryKey: ['youtube', 'searchChannels', { query }],
        queryFn: async (): Promise<SearchChannelsResponse> => {
            try {
                const response = await searchChannels({ query });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('searchChannels', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('searchChannels', !!(error as Error & { _isRateLimited?: boolean })?._isRateLimited);
                throw error;
            }
        },
        enabled: enabled && !!query.trim(),
        ...queryDefaults,
    });
}
