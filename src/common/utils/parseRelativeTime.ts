const TIME_UNITS: Record<string, number> = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2592000,
    year: 31536000,
};

/**
 * Parse a relative time string like "2 days ago" or "3 weeks ago" into
 * seconds-ago. Returns Infinity for unparseable strings so they sort last.
 * Also handles ISO date strings as a fallback.
 */
export function parseRelativeTimeToSeconds(text: string): number {
    if (!text) return Infinity;
    const match = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/i);
    if (!match) {
        const ms = new Date(text).getTime();
        return isNaN(ms) ? Infinity : (Date.now() - ms) / 1000;
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    return amount * (TIME_UNITS[unit] ?? Infinity);
}
