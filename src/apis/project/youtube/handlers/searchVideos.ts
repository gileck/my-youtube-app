import { API_SEARCH_VIDEOS } from '../index';
import { ApiHandlerContext, SearchVideosRequest, SearchVideosResponse } from '../types';
import { youtubeAdapter } from '@/server/youtube';
import type { YouTubeSearchParams } from '@/server/youtube/types';

export const searchVideos = async (
    request: SearchVideosRequest,
    _context: ApiHandlerContext
): Promise<SearchVideosResponse> => {
    try {
        if (!request.query) {
            return { error: "Query is required" };
        }

        const cacheResult = await youtubeAdapter.searchVideos({
            query: request.query,
            sortBy: request.sortBy,
            upload_date: request.upload_date,
            duration: request.duration,
            features: request.features,
            minViews: request.minViews,
            pageNumber: request.pageNumber,
        } as YouTubeSearchParams);

        return {
            videos: cacheResult.data.videos,
            filteredVideos: cacheResult.data.filteredVideos,
            continuation: cacheResult.data.continuation,
            estimatedResults: cacheResult.data.estimatedResults,
            _isFromCache: cacheResult.isFromCache,
        };
    } catch (error: unknown) {
        console.error("Search videos error:", error);
        const msg = error instanceof Error ? error.message : "Failed to search videos";
        return { error: msg, _isRateLimited: /429|rate.limit|quota/i.test(msg) || undefined };
    }
};

export { API_SEARCH_VIDEOS };
