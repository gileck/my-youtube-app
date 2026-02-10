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

        const result = await youtubeAdapter.searchChannels({
            query: request.query,
        });

        return { channels: result.channels };
    } catch (error: unknown) {
        console.error("Search channels error:", error);
        return { error: error instanceof Error ? error.message : "Failed to search channels" };
    }
};

export { API_SEARCH_CHANNELS };
