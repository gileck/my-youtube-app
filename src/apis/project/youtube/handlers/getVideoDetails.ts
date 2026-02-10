import { API_GET_VIDEO_DETAILS } from '../index';
import { ApiHandlerContext, GetVideoDetailsRequest, GetVideoDetailsResponse } from '../types';
import { youtubeAdapter } from '@/server/youtube';

export const getVideoDetails = async (
    request: GetVideoDetailsRequest,
    _context: ApiHandlerContext
): Promise<GetVideoDetailsResponse> => {
    try {
        if (!request.videoId) {
            return { error: "videoId is required" };
        }

        const cacheResult = await youtubeAdapter.getVideoDetails({
            videoId: request.videoId,
        });

        if (!cacheResult.data) {
            return { error: "Video not found" };
        }

        return { video: cacheResult.data, _isFromCache: cacheResult.isFromCache };
    } catch (error: unknown) {
        console.error("Get video details error:", error);
        const msg = error instanceof Error ? error.message : "Failed to get video details";
        return { error: msg, _isRateLimited: /429|rate.limit|quota/i.test(msg) || undefined };
    }
};

export { API_GET_VIDEO_DETAILS };
