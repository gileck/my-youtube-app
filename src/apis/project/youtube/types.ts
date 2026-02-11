import type {
    YouTubeVideoSearchResult,
    YouTubeVideoDetails,
    YouTubeChannelSearchResult,
    YouTubeChannelInfo,
    CombinedTranscriptChapters,
    TranscriptSegment,
    ChapterWithContent,
} from '@/server/youtube/types';

// Re-export data types for client usage
export type {
    YouTubeVideoSearchResult,
    YouTubeVideoDetails,
    YouTubeChannelSearchResult,
    YouTubeChannelInfo,
    CombinedTranscriptChapters,
    TranscriptSegment,
    ChapterWithContent,
};

// Search Videos
export interface SearchVideosRequest {
    query: string;
    sortBy?: string;
    upload_date?: string;
    duration?: string;
    features?: string[];
    minViews?: number;
    pageNumber?: number;
}

export interface SearchVideosResponse {
    videos?: YouTubeVideoSearchResult[];
    filteredVideos?: YouTubeVideoSearchResult[];
    continuation?: boolean;
    estimatedResults?: number;
    error?: string;
    _isFromCache?: boolean;
    _isRateLimited?: boolean;
}

// Search Channels
export interface SearchChannelsRequest {
    query: string;
}

export interface SearchChannelsResponse {
    channels?: YouTubeChannelSearchResult[];
    error?: string;
    _isFromCache?: boolean;
    _isRateLimited?: boolean;
}

// Get Video Details
export interface GetVideoDetailsRequest {
    videoId: string;
}

export interface GetVideoDetailsResponse {
    video?: YouTubeVideoDetails;
    error?: string;
    _isFromCache?: boolean;
    _isRateLimited?: boolean;
}

// Channel video filters (client-safe, no server-only dependencies)
export interface ChannelVideoFilters {
    sort_by?: string;
    upload_date?: string;
    type?: string;
    duration?: string;
    features?: string[];
    minViews?: number;
}

// Get Channel Videos
export interface GetChannelVideosRequest {
    channelId: string;
    filters?: ChannelVideoFilters;
    pageNumber?: number;
}

export interface GetChannelVideosResponse {
    data?: {
        videos: YouTubeVideoSearchResult[];
        channelInfo: YouTubeChannelInfo;
        continuation: boolean;
        estimatedResults: number;
    };
    error?: string;
    _isFromCache?: boolean;
    _isRateLimited?: boolean;
}

// Get Transcript
export interface GetTranscriptRequest {
    videoId: string;
    overlapOffsetSeconds?: number;
}

export interface GetTranscriptResponse {
    result?: CombinedTranscriptChapters;
    error?: string;
    _isFromCache?: boolean;
    _isRateLimited?: boolean;
}

// Get Video Summary
export interface GetVideoSummaryRequest {
    videoId: string;
    transcript: string;
    title: string;
    bypassCache?: boolean;
}

export interface GetVideoSummaryResponse {
    summary?: string;
    modelId?: string;
    cost?: { totalCost: number };
    error?: string;
    _isFromCache?: boolean;
}

export interface ApiHandlerContext {
    userId?: string;
}
