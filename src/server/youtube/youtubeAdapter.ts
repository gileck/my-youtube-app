import { Innertube, YTNodes } from 'youtubei.js';
import type { Types } from 'youtubei.js';
import type {
  YouTubeApiAdapter,
  YouTubeSearchParams,
  YouTubeVideoParams,
  YouTubeChannelParams,
  YouTubeChannelSearchParams,
  YouTubeVideoSearchResult,
  YouTubeVideoDetails,
  YouTubeChannelSearchResult,
  YouTubeChannelInfo,
  YouTubeChannelResponse,
  YouTubeSearchVideosResponse,
  YouTubeSearchChannelsResponse,
} from './types';
import { youtubeCache, YOUTUBE_CACHE_TTL } from './youtubeCache';

export const createYouTubeAdapter = (): YouTubeApiAdapter => {
  let innertubePromise: Promise<Innertube> | null = null;

  const getInnertube = async (): Promise<Innertube> => {
    if (!innertubePromise) {
      innertubePromise = Innertube.create();
    }
    return innertubePromise;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let result = 'PT';
    if (hours > 0) result += `${hours}H`;
    if (minutes > 0) result += `${minutes}M`;
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
      result += `${remainingSeconds}S`;
    }
    return result;
  };

  const transformVideoResult = (video: YTNodes.Video): YouTubeVideoSearchResult => {
    return {
      id: video.id || '',
      title: video.title?.text || '',
      description: video.description || '',
      thumbnailUrl: video.thumbnails?.[0]?.url || '',
      channelTitle: video.author?.name || '',
      channelId: video.author?.id || '',
      publishedAt: video.published?.text || '',
      viewCount: video.view_count?.text || '0',
      duration: video.duration?.text || 'PT0S',
      channelThumbnailUrl: video.author?.thumbnails?.[0]?.url || '',
    };
  };

  const transformChannelResult = (channel: YTNodes.Channel): YouTubeChannelSearchResult => {
    return {
      id: channel.id || '',
      title: channel.author?.name || '',
      description: channel.description_snippet?.text || '',
      thumbnailUrl: channel.author?.thumbnails?.[0]?.url || '',
      subscriberCount: channel.video_count?.text || '',
      channelShortId: channel.subscriber_count?.text || '',
      videoCount: channel.video_count?.text || '',
      isVerified: channel.author?.is_verified || false,
    };
  };

  const videoHasAtLeastMinViews = (video: YTNodes.Video, minViews: number): boolean => {
    const viewCountText = video.view_count?.text || '0';
    const viewCount = parseInt(viewCountText.replace(/[^0-9]/g, ''), 10) || 0;
    return viewCount >= minViews;
  };

  function parseVideoDuration(duration: string): number {
    if (duration.match(/^\d+:\d+:\d+$/)) {
      const [hours, minutes, seconds] = duration.split(':').map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    } else if (duration.match(/^\d+:\d+$/)) {
      const [minutes, seconds] = duration.split(':').map(Number);
      return minutes * 60 + seconds;
    } else if (duration.match(/^\d+$/)) {
      return parseInt(duration, 10);
    }
    return 0;
  }

  function applyFilters(video: YouTubeVideoSearchResult, filters: YouTubeChannelParams['filters']): boolean {
    if (!filters) return true;
    if (filters.duration === 'long') {
      const durationInSeconds = parseVideoDuration(video.duration);
      return durationInSeconds >= 60 * 30;
    }
    return true;
  }

  return {
    async searchVideos(params: YouTubeSearchParams): Promise<YouTubeSearchVideosResponse> {
      const { query, minViews = 0, pageNumber = 1 } = params;

      const result = await youtubeCache.withCache(
        async () => {
          const youtube = await getInnertube();

          const searchOptions: Types.SearchFilters = {
            type: 'video',
            sort_by: params.sortBy,
            upload_date: params.upload_date,
            duration: params.duration,
            features: params.features || ['hd'],
          };

          if (params.upload_date && params.upload_date !== 'all') {
            searchOptions.upload_date = params.upload_date;
          }
          if (params.type && params.type !== 'all') {
            searchOptions.type = params.type;
          }
          if (params.duration && params.duration !== 'all') {
            searchOptions.duration = params.duration;
          }
          if (params.features && params.features.length > 0) {
            searchOptions.features = params.features;
          }

          let searchResults = await youtube.search(query, searchOptions);

          if (pageNumber > 1) {
            for (let i = 2; i <= pageNumber; i++) {
              searchResults = await searchResults.getContinuation();
            }
          }

          const videos: YouTubeVideoSearchResult[] = [];
          const filteredVideos: YouTubeVideoSearchResult[] = [];

          for (const result of searchResults.results) {
            if (result.type === 'Video') {
              const video = result as YTNodes.Video;
              if (
                (video.title.text?.toLowerCase().includes(query.toLowerCase()) ||
                  video.description_snippet?.text?.toLowerCase().includes(query.toLowerCase()) ||
                  video.author.name?.toLowerCase().includes(query.toLowerCase())) &&
                videoHasAtLeastMinViews(video, minViews)
              ) {
                videos.push(transformVideoResult(video));
              } else {
                filteredVideos.push(transformVideoResult(video));
              }
            }
          }

          const hasMorePages = typeof searchResults.getContinuation === 'function';

          return {
            videos,
            filteredVideos,
            continuation: hasMorePages ? true : false,
            estimatedResults: searchResults.estimated_results,
          };
        },
        { key: 'yt:searchVideos', params: { query, sortBy: params.sortBy, upload_date: params.upload_date, duration: params.duration, pageNumber } },
        { ttl: YOUTUBE_CACHE_TTL }
      );

      return result.data;
    },

    async searchChannels(params: YouTubeChannelSearchParams): Promise<YouTubeSearchChannelsResponse> {
      const { query } = params;

      const result = await youtubeCache.withCache(
        async () => {
          const youtube = await getInnertube();

          const searchResults = await youtube.search(query, { type: 'channel' });

          const channels: YouTubeChannelSearchResult[] = [];
          for (const result of searchResults.results) {
            if (result.type === 'Channel') {
              const item = transformChannelResult(result as YTNodes.Channel);
              if (item.isVerified && item.title.toLowerCase().includes(query.toLowerCase())) {
                channels.push(item);
              }
            }
          }

          return { channels };
        },
        { key: 'yt:searchChannels', params: { query } },
        { ttl: YOUTUBE_CACHE_TTL }
      );

      return result.data;
    },

    async getVideoDetails(params: YouTubeVideoParams): Promise<YouTubeVideoDetails | null> {
      try {
        const { videoId } = params;

        const result = await youtubeCache.withCache(
          async () => {
            const youtube = await getInnertube();
            const videoInfo = await youtube.getInfo(videoId);

            let channelImage: string | undefined = undefined;
            if (videoInfo.basic_info.channel?.id) {
              try {
                const channelInfo = await youtube.getChannel(videoInfo.basic_info.channel.id);
                channelImage = channelInfo?.metadata?.avatar?.[0]?.url || undefined;
              } catch {
                // If channel fetch fails, leave channelImage undefined
              }
            }

            const title = videoInfo.primary_info?.title?.text || videoInfo.basic_info.title || '';
            const viewCount =
              videoInfo.primary_info?.view_count?.view_count?.text ||
              String(videoInfo.basic_info.view_count || '0');

            return {
              id: videoInfo.basic_info.id || videoId,
              title,
              description:
                videoInfo.secondary_info?.description?.text ||
                String(videoInfo.basic_info.short_description || ''),
              thumbnailUrl: videoInfo.basic_info.thumbnail?.[0]?.url || '',
              channelTitle:
                videoInfo.secondary_info?.owner?.author?.name ||
                videoInfo.basic_info.channel?.name || '',
              channelId:
                videoInfo.secondary_info?.owner?.author?.id ||
                videoInfo.basic_info.channel?.id || '',
              publishedAt: videoInfo.primary_info?.published?.text || '',
              viewCount,
              duration:
                typeof videoInfo.basic_info.duration === 'number'
                  ? formatDuration(videoInfo.basic_info.duration)
                  : 'PT0S',
              tags: videoInfo.basic_info.tags || [],
              category: videoInfo.basic_info.category || '',
              likeCount: String(videoInfo.basic_info.like_count || '0'),
              commentCount: '0',
              channelImage,
            };
          },
          { key: 'yt:videoDetails', params: { videoId } },
          { ttl: YOUTUBE_CACHE_TTL }
        );

        return result.data;
      } catch {
        return null;
      }
    },

    async getChannelVideos(params: YouTubeChannelParams): Promise<YouTubeChannelResponse> {
      try {
        const { channelId, filters, pageNumber } = params;

        const result = await youtubeCache.withCache(
          async () => {
            const youtube = await getInnertube();

            const channel = await youtube.getChannel(channelId);

            const channelInfo: YouTubeChannelInfo = {
              id: channelId,
              title: channel.metadata?.title || '',
              description: channel.metadata?.description || '',
              thumbnailUrl:
                channel.metadata?.avatar?.[0]?.url || channel.metadata?.thumbnail?.[0]?.url || '',
              subscriberCount: '',
              videoCount: '',
              isVerified: false,
            };

            async function getVideos() {
              const channelVideos = await channel.getVideos();
              let currentVideos = channelVideos.videos;
              let hasContinuation = channelVideos.has_continuation;

              if (pageNumber && pageNumber > 1) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let currentFeed: any = channelVideos;
                for (let i = 2; i <= pageNumber; i++) {
                  if (hasContinuation) {
                    const feed = await currentFeed.getContinuation();
                    currentVideos = feed.videos;
                    hasContinuation = feed.has_continuation;
                    currentFeed = feed;
                  } else {
                    break;
                  }
                }
              }

              return { videos: currentVideos, hasContinuation };
            }

            const { videos: channelVideos, hasContinuation } = await getVideos();

            const videos: YouTubeVideoSearchResult[] = [];
            for (const video of channelVideos) {
              if (video.type === 'Video') {
                const videoResult = transformVideoResult(video as YTNodes.Video);
                videoResult.channelTitle = channelInfo.title;
                videoResult.channelId = channelId;
                videoResult.channelThumbnailUrl = channelInfo.thumbnailUrl || '';
                if (applyFilters(videoResult, filters)) {
                  videos.push(videoResult);
                }
              }
            }

            const sortedVideos = videos.sort((a, b) => {
              const sortBy = filters?.sort_by || 'upload_date';
              if (sortBy === 'upload_date') {
                return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
              }
              if (sortBy === 'view_count') {
                const viewCountA = Number(a.viewCount.replace(/,/g, '').replace(' views', ''));
                const viewCountB = Number(b.viewCount.replace(/,/g, '').replace(' views', ''));
                return viewCountB - viewCountA;
              }
              return 0;
            });

            return {
              data: {
                videos: sortedVideos,
                channelInfo,
                continuation: hasContinuation,
                estimatedResults: channelVideos.length,
              },
            };
          },
          { key: 'yt:channelVideos', params: { channelId, filters, pageNumber } },
          { ttl: YOUTUBE_CACHE_TTL }
        );

        return result.data;
      } catch (error) {
        return {
          error: {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'YOUTUBE_CHANNEL_VIDEOS_ERROR',
          },
        };
      }
    },
  };
};
