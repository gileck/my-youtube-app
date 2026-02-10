import parseYouTubeChapters from './parseChapters';
import type { Chapter } from '../types';
import { youtubeCache, YOUTUBE_CACHE_TTL } from '../youtubeCache';

export async function fetchChapters(videoId: string): Promise<Chapter[]> {
  try {
    const result = await youtubeCache.withCache(
      async () => {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
          console.error('YouTube API key not found in environment variables');
          return [];
        }

        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`
        );

        if (!response.ok) {
          console.error(`YouTube API returned ${response.status} for video ${videoId}`);
          return [];
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
          return [];
        }

        const description = data.items[0].snippet.description;
        const rawChapters = parseYouTubeChapters(description);

        if (!rawChapters || !Array.isArray(rawChapters) || rawChapters.length === 0) {
          return [];
        }

        return rawChapters.map((chapter, index, array) => {
          const nextChapter = array[index + 1];
          return {
            title: chapter.title,
            startTime: chapter.start,
            endTime: nextChapter ? nextChapter.start : Number.MAX_SAFE_INTEGER,
          };
        });
      },
      { key: 'yt:chapters', params: { videoId } },
      { ttl: YOUTUBE_CACHE_TTL }
    );

    return result.data;
  } catch (error) {
    console.error(`Error fetching chapters for video ${videoId}:`, error);
    return [];
  }
}
