import type { YouTubeChannelInfo } from '@/apis/project/youtube/types';

function formatCount(count: string): string {
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
}

interface ChannelHeaderProps {
    channel: YouTubeChannelInfo;
}

export const ChannelHeader = ({ channel }: ChannelHeaderProps) => {
    return (
        <div className="flex items-start gap-4 mb-4">
            {channel.thumbnailUrl && (
                <img
                    src={channel.thumbnailUrl}
                    alt={channel.title}
                    className="w-16 h-16 rounded-full flex-shrink-0"
                />
            )}
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-foreground truncate">
                        {channel.title}
                    </h1>
                    {channel.isVerified && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">✓</span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {channel.subscriberCount && `${formatCount(channel.subscriberCount)} subscribers`}
                    {channel.subscriberCount && channel.videoCount && ' · '}
                    {channel.videoCount && `${formatCount(channel.videoCount)} videos`}
                </p>
                {channel.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {channel.description}
                    </p>
                )}
            </div>
        </div>
    );
};
