import type { Types } from 'youtubei.js';

// ==========================================
// Request/Param Types
// ==========================================

export type YouTubeSortOption = Types.SortBy;

export interface YouTubeSearchParams {
  query: string;
  sortBy?: YouTubeSortOption;
  upload_date?: Types.UploadDate;
  type?: Types.SearchType;
  duration?: Types.Duration;
  features?: Types.Feature[];
  minViews?: number;
  pageNumber?: number;
}

export interface YouTubeChannelSearchParams {
  query: string;
}

export interface YouTubeVideoParams {
  videoId: string;
}

export interface YouTubeChannelParams {
  channelId: string;
  filters?: YouTubeSearchFilters;
  pageNumber?: number;
}

// ==========================================
// Data Types
// ==========================================

export interface YouTubeVideoSearchResult {
  id: string;
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  duration: string;
  channelThumbnailUrl?: string;
}

export interface YouTubeVideoDetails extends YouTubeVideoSearchResult {
  tags: string[];
  category: string;
  likeCount: string;
  commentCount: string;
  channelImage?: string;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
  isVerified?: boolean;
}

export interface YouTubeChannelSearchResult {
  id: string;
  channelShortId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  isVerified: boolean;
}

// ==========================================
// Response Types
// ==========================================

export interface YouTubeSearchVideosResponse<T = YouTubeVideoSearchResult[]> {
  videos?: T;
  filteredVideos?: T;
  continuation?: boolean;
  estimatedResults?: number;
}

export interface YouTubeSearchChannelsResponse<T = YouTubeChannelSearchResult[]> {
  channels?: T;
}

export interface YouTubeChannelResponse {
  data?: {
    videos: YouTubeVideoSearchResult[];
    channelInfo: YouTubeChannelInfo;
    continuation: boolean;
    estimatedResults: number;
  };
  error?: YouTubeApiError;
}

export interface YouTubeApiError {
  message: string;
  code: string;
}

// ==========================================
// Filter Types
// ==========================================

export interface YouTubeSearchFilters {
  sort_by?: YouTubeSortOption;
  upload_date?: Types.UploadDate;
  type?: Types.SearchType;
  duration?: Types.Duration;
  features?: Types.Feature[];
  minViews?: number;
}

// ==========================================
// Transcript & Chapter Types
// ==========================================

export interface TranscriptSegment {
  start_seconds: number;
  end_seconds: number;
  text: string;
  start_time_text: string;
}

export interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

export interface ChapterWithContent {
  title: string;
  startTime: number;
  endTime: number;
  content: string;
  segments: TranscriptSegment[];
}

export interface CombinedTranscriptChapters {
  videoId: string;
  metadata: {
    totalDuration: number;
    chapterCount: number;
    transcriptItemCount: number;
    overlapOffsetSeconds: number;
  };
  chapters: ChapterWithContent[];
  transcript: TranscriptSegment[];
  error?: string;
}

// ==========================================
// Adapter Interface
// ==========================================

export interface YouTubeApiAdapter {
  searchVideos(params: YouTubeSearchParams): Promise<YouTubeSearchVideosResponse>;
  searchChannels(params: YouTubeChannelSearchParams): Promise<YouTubeSearchChannelsResponse>;
  getVideoDetails(params: YouTubeVideoParams): Promise<YouTubeVideoDetails | null>;
  getChannelVideos(params: YouTubeChannelParams): Promise<YouTubeChannelResponse>;
}
