export function formatViewCount(viewCount: string): string {
    const num = parseInt(viewCount.replace(/[,\s]/g, ''), 10);
    if (isNaN(num)) return viewCount;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K views`;
    return `${num} views`;
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
