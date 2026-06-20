import { useCallback, useEffect, useRef } from 'react';
import type { YouTubeVideoDetails, YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { useHistoryStore } from './store';
import type { HistoryVideo } from './types';

/**
 * Toggle a video's "watched" state. A watched video is simply one present in
 * history, so marking watched adds it (with `visitedAt = now`) and un-marking
 * removes it. Mirrors `useBookmarkToggle`.
 */
export function useWatchedToggle(video: YouTubeVideoSearchResult) {
    const isWatched = useHistoryStore((s) => s.history.some((h) => h.id === video.id));
    const addToHistory = useHistoryStore((s) => s.addToHistory);
    const removeFromHistory = useHistoryStore((s) => s.removeFromHistory);

    const toggle = useCallback(() => {
        if (isWatched) {
            removeFromHistory(video.id);
            return;
        }
        addToHistory({
            id: video.id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            channelTitle: video.channelTitle,
            channelId: video.channelId,
            channelThumbnailUrl: video.channelThumbnailUrl,
            publishedAt: video.publishedAt,
            viewCount: video.viewCount,
            duration: video.duration,
            visitedAt: Date.now(),
        });
    }, [isWatched, video, addToHistory, removeFromHistory]);

    return { isWatched, toggle };
}

export function useAddToHistory(video: YouTubeVideoDetails | undefined) {
    const addToHistory = useHistoryStore((s) => s.addToHistory);
    const addedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!video || addedRef.current === video.id) return;
        addedRef.current = video.id;

        const entry: HistoryVideo = {
            id: video.id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            channelTitle: video.channelTitle,
            channelId: video.channelId,
            channelThumbnailUrl: video.channelThumbnailUrl,
            publishedAt: video.publishedAt,
            viewCount: video.viewCount,
            duration: video.duration,
            visitedAt: Date.now(),
        };
        addToHistory(entry);
    }, [video, addToHistory]);
}
