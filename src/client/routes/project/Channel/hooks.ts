import { useQuery } from '@tanstack/react-query';
import { getChannelVideos } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
import type { GetChannelVideosResponse } from '@/apis/project/youtube/types';

interface ChannelVideosParams {
    channelId: string;
    pageNumber: number;
}

export function useChannelVideos({ channelId, pageNumber }: ChannelVideosParams) {
    const queryDefaults = useQueryDefaults();

    return useQuery({
        queryKey: ['youtube', 'channel', channelId, pageNumber],
        queryFn: async (): Promise<GetChannelVideosResponse> => {
            try {
                const response = await getChannelVideos({
                    channelId,
                    pageNumber: pageNumber > 1 ? pageNumber : undefined,
                });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getChannelVideos', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('getChannelVideos', !!(error as Error & { _isRateLimited?: boolean })?._isRateLimited);
                throw error;
            }
        },
        enabled: !!channelId,
        ...queryDefaults,
    });
}
