import { useState, useEffect, useCallback } from 'react';
import { useVideoPlayerStore } from './store';
import type { VideoTopic, TopicKeyPoint, ChapterWithContent } from '@/apis/project/youtube/types';

export function useYouTubeIFrameAPI(): boolean {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral loading state for external script
    const [isReady, setIsReady] = useState(() => !!window.YT?.Player);

    useEffect(() => {
        if (window.YT?.Player) {
            setIsReady(true);
            return;
        }

        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            setIsReady(true);
        };

        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(script);
        }
    }, []);

    return isReady;
}

function findActive<T>(items: T[], getStart: (item: T) => number, currentTime: number): T | null {
    if (items.length === 0) return null;
    for (let i = items.length - 1; i >= 0; i--) {
        if (currentTime >= getStart(items[i])) return items[i];
    }
    return null;
}

export function useActiveTopic(topics: VideoTopic[] | undefined): VideoTopic | null {
    const currentTime = useVideoPlayerStore((s) => s.currentTime);
    if (!topics || topics.length === 0) return null;
    return findActive(topics, (t) => t.timestamp, currentTime);
}

export function useActiveKeyPoint(keyPoints: TopicKeyPoint[] | undefined): TopicKeyPoint | null {
    const currentTime = useVideoPlayerStore((s) => s.currentTime);
    if (!keyPoints || keyPoints.length === 0) return null;
    return findActive(keyPoints, (kp) => kp.timestamp, currentTime);
}

export function useActiveChapter(chapters: ChapterWithContent[] | undefined): ChapterWithContent | null {
    const currentTime = useVideoPlayerStore((s) => s.currentTime);
    if (!chapters || chapters.length === 0) return null;
    return findActive(chapters, (c) => c.startTime, currentTime);
}

export function useSeekTo(): (seconds: number) => void {
    const seekTo = useVideoPlayerStore((s) => s.seekTo);
    return useCallback(
        (seconds: number) => seekTo(seconds),
        [seekTo]
    );
}
