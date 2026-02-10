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
            const ageA = parseRelativeTimeToSeconds(a.publishedAt);
            const ageB = parseRelativeTimeToSeconds(b.publishedAt);
            return ageA - ageB; // smaller age = more recent = should come first
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

const TIME_UNITS: Record<string, number> = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2592000,
    year: 31536000,
};

function parseRelativeTimeToSeconds(text: string): number {
    if (!text) return Infinity;
    const match = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/i);
    if (!match) {
        // Fallback: try parsing as a real date
        const ms = new Date(text).getTime();
        return isNaN(ms) ? Infinity : (Date.now() - ms) / 1000;
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    return amount * (TIME_UNITS[unit] ?? Infinity);
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
