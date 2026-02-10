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

        const result = await getChaptersTranscripts(request.videoId, {
            overlapOffsetSeconds: request.overlapOffsetSeconds ?? 5,
        });

        if (result.error) {
            return { error: result.error };
        }

        return { result };
    } catch (error: unknown) {
        console.error("Get transcript error:", error);
        return { error: error instanceof Error ? error.message : "Failed to get transcript" };
    }
};

export { API_GET_TRANSCRIPT };
