import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';

export function deduplicateVideos(videos: YouTubeVideoSearchResult[]): YouTubeVideoSearchResult[] {
    const seen = new Set<string>();
    return videos.filter((video) => {
        if (seen.has(video.id)) return false;
        seen.add(video.id);
        return true;
    });
}

export function sortVideos(
    videos: YouTubeVideoSearchResult[],
    sortBy: 'newest' | 'most_viewed'
): YouTubeVideoSearchResult[] {
    const sorted = [...videos];
    if (sortBy === 'newest') {
        sorted.sort((a, b) => {
            const dateA = new Date(a.publishedAt).getTime();
            const dateB = new Date(b.publishedAt).getTime();
            if (isNaN(dateA) || isNaN(dateB)) return 0;
            return dateB - dateA;
        });
    } else {
        sorted.sort((a, b) => {
            const viewsA = parseViewCount(a.viewCount);
            const viewsB = parseViewCount(b.viewCount);
            return viewsB - viewsA;
        });
    }
    return sorted;
}

function parseViewCount(viewCount: string): number {
    const cleaned = viewCount.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
}

export function parseDurationToSeconds(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
        return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
    }
    if (parts.length === 2) {
        return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
    }
    return parts[0] ?? 0;
}

export function filterVideos(
    videos: YouTubeVideoSearchResult[],
    filters: { duration: string; minViews: number }
): YouTubeVideoSearchResult[] {
    return videos.filter((video) => {
        if (filters.duration !== 'all') {
            const seconds = parseDurationToSeconds(video.duration);
            if (filters.duration === 'short' && seconds >= 240) return false;
            if (filters.duration === 'medium' && (seconds < 240 || seconds > 1200)) return false;
            if (filters.duration === 'long' && seconds <= 1200) return false;
        }
        if (filters.minViews > 0) {
            const views = parseViewCount(video.viewCount);
            if (views < filters.minViews) return false;
        }
        return true;
    });
}
