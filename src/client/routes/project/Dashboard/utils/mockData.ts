/**
 * Mock Data Utilities
 *
 * Utility functions for formatting and transforming dashboard data.
 */

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
        return `${seconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDurationSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (minutes === 0) {
        return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
}

/**
 * Format date for chart axis labels
 */
export function formatChartDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format week start date for chart labels
 */
export function formatWeekLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

/**
 * Get display name for agent type
 */
export function getAgentDisplayName(agentType: string): string {
    const displayNames: Record<string, string> = {
        'tech-design': 'Tech Design',
        implement: 'Implement',
        'pr-review': 'PR Review',
        other: 'Other',
    };
    return displayNames[agentType] || agentType;
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status: string): string {
    const displayNames: Record<string, string> = {
        new: 'New',
        in_progress: 'In Progress',
        done: 'Done',
        rejected: 'Rejected',
        investigating: 'Investigating',
        resolved: 'Resolved',
        closed: 'Closed',
    };
    return displayNames[status] || status;
}

/**
 * Format timestamp as relative time with absolute fallback
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const formatAbsolute = (d: Date) => {
        const thisYear = now.getFullYear();
        const dateYear = d.getFullYear();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        if (dateYear === thisYear) {
            return `${month} ${day} at ${time}`;
        }
        return `${month} ${day}, ${dateYear} at ${time}`;
    };

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
        return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
        return formatAbsolute(date);
    }
}
