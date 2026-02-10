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

        const result = await youtubeAdapter.searchVideos({
            query: request.query,
            sortBy: request.sortBy,
            upload_date: request.upload_date,
            duration: request.duration,
            features: request.features,
            minViews: request.minViews,
            pageNumber: request.pageNumber,
        } as YouTubeSearchParams);

        return {
            videos: result.videos,
            filteredVideos: result.filteredVideos,
            continuation: result.continuation,
            estimatedResults: result.estimatedResults,
        };
    } catch (error: unknown) {
        console.error("Search videos error:", error);
        return { error: error instanceof Error ? error.message : "Failed to search videos" };
    }
};

export { API_SEARCH_VIDEOS };
