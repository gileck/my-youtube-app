import { API_GET_VIDEO_SUMMARY } from '../index';
import { ApiHandlerContext, GetVideoSummaryRequest, GetVideoSummaryResponse } from '../types';
import { AIModelAdapter } from '@/server/template/ai/baseModelAdapter';
import { DEFAULT_MODEL_ID } from '@/common/ai/models';
import { youtubeCache, YOUTUBE_CACHE_TTL } from '@/server/youtube/youtubeCache';
import { AI_ACTIONS } from './ai-actions';

export const getVideoSummary = async (
    request: GetVideoSummaryRequest,
    _context: ApiHandlerContext
): Promise<GetVideoSummaryResponse> => {
    try {
        if (!request.videoId || !request.transcript) {
            return { error: "videoId and transcript are required" };
        }

        const actionType = request.actionType ?? 'summary';
        const action = AI_ACTIONS[actionType];
        if (!action) {
            return { error: `Unknown action type: ${actionType}` };
        }

        const validationError = action.validate?.(request);
        if (validationError) {
            return { error: validationError };
        }

        const modelId = request.modelId || DEFAULT_MODEL_ID;

        // cacheOnly mode: check cache without generating
        if (request.cacheOnly) {
            // First try model-specific cache
            const modelParams = { ...action.cacheParams(request) };
            const modelCacheResult = await youtubeCache.withCache(
                async () => null,
                { key: action.cacheKey, params: modelParams },
                { ttl: YOUTUBE_CACHE_TTL, disableCache: false }
            );
            if (modelCacheResult.isFromCache && modelCacheResult.data) {
                return { ...modelCacheResult.data as GetVideoSummaryResponse, _isFromCache: true };
            }

            // Fall back to "latest" cache (without modelId)
            const latestParams = { ...action.cacheParams({ ...request, modelId: undefined }) };
            const latestCacheResult = await youtubeCache.withCache(
                async () => null,
                { key: action.cacheKey, params: latestParams },
                { ttl: YOUTUBE_CACHE_TTL, disableCache: false }
            );
            if (latestCacheResult.isFromCache && latestCacheResult.data) {
                return { ...latestCacheResult.data as GetVideoSummaryResponse, _isFromCache: true };
            }

            return { _noCache: true };
        }

        const adapter = new AIModelAdapter(modelId);

        // Generate with model-specific cache key
        const { data, isFromCache } = await youtubeCache.withCache(
            () => action.execute({ request, adapter, modelId }),
            { key: action.cacheKey, params: action.cacheParams(request) },
            { ttl: YOUTUBE_CACHE_TTL, bypassCache: request.bypassCache }
        );

        // Also write to "latest" cache (without modelId) so other users auto-load it
        if (!isFromCache && data) {
            const latestParams = { ...action.cacheParams({ ...request, modelId: undefined }) };
            await youtubeCache.withCache(
                async () => data,
                { key: action.cacheKey, params: latestParams },
                { ttl: YOUTUBE_CACHE_TTL, bypassCache: true }
            );
        }

        return { ...data, _isFromCache: isFromCache };
    } catch (error: unknown) {
        console.error("Get video summary error:", error);
        const msg = error instanceof Error ? error.message : "Failed to generate summary";
        return { error: msg };
    }
};

export { API_GET_VIDEO_SUMMARY };
