import { useVideoUIStateStore } from '@/client/features/project/video-ui-state';
import { parseDurationToSeconds } from './formatUtils';

/**
 * Returns how far the user has watched a video, as a percentage (0–100),
 * based on the playback position persisted by the video player. Returns 0
 * when there's no saved position or the duration is unknown.
 */
export function useVideoProgress(videoId: string, duration: string): number {
    const savedTime = useVideoUIStateStore((s) => s.savedTimes[videoId] ?? 0);
    const total = parseDurationToSeconds(duration);
    if (total <= 0 || savedTime <= 0) return 0;
    return Math.min(100, (savedTime / total) * 100);
}
