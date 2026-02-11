// Must re-export all exports from index.ts
export * from './index';

// Import API name constants from index.ts
import { API_SEARCH_VIDEOS, API_SEARCH_CHANNELS, API_GET_VIDEO_DETAILS, API_GET_CHANNEL_VIDEOS, API_GET_TRANSCRIPT, API_GET_VIDEO_SUMMARY } from './index';

// Import handlers
import { searchVideos } from './handlers/searchVideos';
import { searchChannels } from './handlers/searchChannels';
import { getVideoDetails } from './handlers/getVideoDetails';
import { getChannelVideos } from './handlers/getChannelVideos';
import { getTranscript } from './handlers/getTranscript';
import { getVideoSummary } from './handlers/getVideoSummary';

// Export consolidated handlers object
export const youtubeApiHandlers = {
    [API_SEARCH_VIDEOS]: { process: searchVideos },
    [API_SEARCH_CHANNELS]: { process: searchChannels },
    [API_GET_VIDEO_DETAILS]: { process: getVideoDetails },
    [API_GET_CHANNEL_VIDEOS]: { process: getChannelVideos },
    [API_GET_TRANSCRIPT]: { process: getTranscript },
    [API_GET_VIDEO_SUMMARY]: { process: getVideoSummary },
};
