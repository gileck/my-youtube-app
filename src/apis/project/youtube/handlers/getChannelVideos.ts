import { API_GET_CHANNEL_VIDEOS } from '../index';
import { ApiHandlerContext, GetChannelVideosRequest, GetChannelVideosResponse } from '../types';
import { youtubeAdapter } from '@/server/youtube';
import type { YouTubeChannelParams } from '@/server/youtube/types';

export const getChannelVideos = async (
    request: GetChannelVideosRequest,
    _context: ApiHandlerContext
): Promise<GetChannelVideosResponse> => {
    try {
        if (!request.channelId) {
            return { error: "channelId is required" };
        }

        const cacheResult = await youtubeAdapter.getChannelVideos({
            channelId: request.channelId,
            filters: request.filters,
            pageNumber: request.pageNumber,
        } as YouTubeChannelParams);

        if (cacheResult.data.error) {
            return { error: cacheResult.data.error.message };
        }

        return { data: cacheResult.data.data, _isFromCache: cacheResult.isFromCache };
    } catch (error: unknown) {
        console.error("Get channel videos error:", error);
        const msg = error instanceof Error ? error.message : "Failed to get channel videos";
        return { error: msg, _isRateLimited: /429|rate.limit|quota/i.test(msg) || undefined };
    }
};

export { API_GET_CHANNEL_VIDEOS };
