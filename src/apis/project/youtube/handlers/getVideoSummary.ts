import { API_GET_VIDEO_SUMMARY } from '../index';
import { ApiHandlerContext, GetVideoSummaryRequest, GetVideoSummaryResponse } from '../types';
import { AIModelAdapter } from '@/server/ai/baseModelAdapter';
import { DEFAULT_MODEL_ID } from '@/common/ai/models';
import { youtubeCache, YOUTUBE_CACHE_TTL } from '@/server/youtube/youtubeCache';

export const getVideoSummary = async (
    request: GetVideoSummaryRequest,
    _context: ApiHandlerContext
): Promise<GetVideoSummaryResponse> => {
    try {
        if (!request.videoId || !request.transcript) {
            return { error: "videoId and transcript are required" };
        }

        const modelId = DEFAULT_MODEL_ID;
        const adapter = new AIModelAdapter(modelId);

        const prompt = `You are a helpful assistant that summarizes YouTube video content.

Video Title: ${request.title}

Transcript:
${request.transcript}

Please provide a concise summary of this video. Include:
1. A brief overview (2-3 sentences)
2. Key topics and main points discussed
3. Any notable conclusions or takeaways

Keep the summary informative but concise.`;

        const { data, isFromCache } = await youtubeCache.withCache(
            async () => {
                const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
                return {
                    summary: response.result,
                    modelId,
                    cost: response.cost,
                };
            },
            { key: 'video-summary', params: { videoId: request.videoId } },
            { ttl: YOUTUBE_CACHE_TTL, bypassCache: request.bypassCache }
        );

        return {
            summary: data.summary,
            modelId: data.modelId,
            cost: data.cost,
            _isFromCache: isFromCache,
        };
    } catch (error: unknown) {
        console.error("Get video summary error:", error);
        const msg = error instanceof Error ? error.message : "Failed to generate summary";
        return { error: msg };
    }
};

export { API_GET_VIDEO_SUMMARY };
