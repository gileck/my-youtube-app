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

        const video = await youtubeAdapter.getVideoDetails({
            videoId: request.videoId,
        });

        if (!video) {
            return { error: "Video not found" };
        }

        return { video };
    } catch (error: unknown) {
        console.error("Get video details error:", error);
        return { error: error instanceof Error ? error.message : "Failed to get video details" };
    }
};

export { API_GET_VIDEO_DETAILS };
