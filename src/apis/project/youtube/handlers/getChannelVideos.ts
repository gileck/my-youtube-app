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

        const result = await youtubeAdapter.getChannelVideos({
            channelId: request.channelId,
            filters: request.filters,
            pageNumber: request.pageNumber,
        } as YouTubeChannelParams);

        if (result.error) {
            return { error: result.error.message };
        }

        return { data: result.data };
    } catch (error: unknown) {
        console.error("Get channel videos error:", error);
        return { error: error instanceof Error ? error.message : "Failed to get channel videos" };
    }
};

export { API_GET_CHANNEL_VIDEOS };
