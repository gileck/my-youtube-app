export function formatDuration(duration: string): string {
    if (!duration) return '';
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) return duration;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${minutes}:${pad(seconds)}`;
}

export function formatViewCount(viewCount: string): string {
    const num = parseInt(viewCount.replace(/[,\s]/g, ''), 10);
    if (isNaN(num)) return viewCount;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K views`;
    return `${num} views`;
}

/**
 * Parse a video duration into seconds. Accepts ISO 8601 (`PT1H2M3S`),
 * colon-separated (`1:02:03` / `2:03`), or a plain seconds string.
 */
export function parseDurationToSeconds(duration: string): number {
    if (!duration) return 0;
    const iso = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (iso) {
        return parseInt(iso[1] || '0', 10) * 3600
            + parseInt(iso[2] || '0', 10) * 60
            + parseInt(iso[3] || '0', 10);
    }
    if (duration.includes(':')) {
        const parts = duration.split(':').map((p) => parseInt(p, 10) || 0);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0] ?? 0;
    }
    const seconds = parseInt(duration, 10);
    return isNaN(seconds) ? 0 : seconds;
}

export function formatPublishedDate(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('ago')) return dateStr;
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}
