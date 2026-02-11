import { useCallback } from 'react';
import type { YouTubeVideoSearchResult, YouTubeVideoDetails } from '@/apis/project/youtube/types';
import { useBookmarksStore } from './store';
import type { BookmarkedVideo } from './types';

export function useBookmarkToggle(video: YouTubeVideoSearchResult | YouTubeVideoDetails) {
    const isBookmarked = useBookmarksStore((s) => s.bookmarks.some((b) => b.id === video.id));
    const addBookmark = useBookmarksStore((s) => s.addBookmark);
    const removeBookmark = useBookmarksStore((s) => s.removeBookmark);

    const toggle = useCallback(() => {
        if (isBookmarked) {
            removeBookmark(video.id);
        } else {
            const bookmarked: BookmarkedVideo = {
                id: video.id,
                title: video.title,
                thumbnailUrl: video.thumbnailUrl,
                channelTitle: video.channelTitle,
                channelId: video.channelId,
                channelThumbnailUrl: video.channelThumbnailUrl,
                publishedAt: video.publishedAt,
                viewCount: video.viewCount,
                duration: video.duration,
                bookmarkedAt: Date.now(),
            };
            addBookmark(bookmarked);
        }
    }, [isBookmarked, video, addBookmark, removeBookmark]);

    return { isBookmarked, toggle };
}
