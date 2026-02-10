import { API_SEARCH_CHANNELS } from '../index';
import { ApiHandlerContext, SearchChannelsRequest, SearchChannelsResponse } from '../types';
import { youtubeAdapter } from '@/server/youtube';

export const searchChannels = async (
    request: SearchChannelsRequest,
    _context: ApiHandlerContext
): Promise<SearchChannelsResponse> => {
    try {
        if (!request.query) {
            return { error: "Query is required" };
        }

        const cacheResult = await youtubeAdapter.searchChannels({
            query: request.query,
        });

        return { channels: cacheResult.data.channels, _isFromCache: cacheResult.isFromCache };
    } catch (error: unknown) {
        console.error("Search channels error:", error);
        const msg = error instanceof Error ? error.message : "Failed to search channels";
        return { error: msg, _isRateLimited: /429|rate.limit|quota/i.test(msg) || undefined };
    }
};

export { API_SEARCH_CHANNELS };
