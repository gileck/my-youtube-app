import { useEffect, useRef } from 'react';
import type { YouTubeVideoDetails } from '@/apis/project/youtube/types';
import { useHistoryStore } from './store';
import type { HistoryVideo } from './types';

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
