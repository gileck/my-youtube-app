import { useQuery } from '@tanstack/react-query';
import { searchVideos } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
import type { SearchVideosResponse } from '@/apis/project/youtube/types';

interface SearchParams {
    query: string;
    sortBy: string;
    uploadDate: string;
    duration: string;
    minViews: number;
    pageNumber: number;
}

export function useSearchVideos(params: SearchParams) {
    const queryDefaults = useQueryDefaults();

    return useQuery({
        queryKey: ['youtube', 'search', params],
        queryFn: async (): Promise<SearchVideosResponse> => {
            try {
                const response = await searchVideos({
                    query: params.query,
                    sortBy: params.sortBy !== 'relevance' ? params.sortBy : undefined,
                    upload_date: params.uploadDate !== 'all' ? params.uploadDate : undefined,
                    duration: params.duration !== 'all' ? params.duration : undefined,
                    minViews: params.minViews > 0 ? params.minViews : undefined,
                    pageNumber: params.pageNumber > 1 ? params.pageNumber : undefined,
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
        enabled: !!params.query.trim(),
        ...queryDefaults,
    });
}
