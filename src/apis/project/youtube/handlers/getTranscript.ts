import { API_GET_TRANSCRIPT } from '../index';
import { ApiHandlerContext, GetTranscriptRequest, GetTranscriptResponse } from '../types';
import { getChaptersTranscripts } from '@/server/youtube';

export const getTranscript = async (
    request: GetTranscriptRequest,
    _context: ApiHandlerContext
): Promise<GetTranscriptResponse> => {
    try {
        if (!request.videoId) {
            return { error: "videoId is required" };
        }

        const { data, isFromCache } = await getChaptersTranscripts(request.videoId, {
            overlapOffsetSeconds: request.overlapOffsetSeconds ?? 5,
        });

        if (data.error) {
            return { error: data.error };
        }

        return { result: data, _isFromCache: isFromCache };
    } catch (error: unknown) {
        console.error("Get transcript error:", error);
        const msg = error instanceof Error ? error.message : "Failed to get transcript";
        return { error: msg, _isRateLimited: /429|rate.limit|quota/i.test(msg) || undefined };
    }
};

export { API_GET_TRANSCRIPT };
