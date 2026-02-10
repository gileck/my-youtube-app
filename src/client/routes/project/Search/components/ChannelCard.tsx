import { useRouter } from '@/client/features';
import type { YouTubeChannelSearchResult } from '@/apis/project/youtube/types';
import { BadgeCheck } from 'lucide-react';

function formatCount(count: string): string {
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return `${num}`;
}

interface ChannelCardProps {
    channel: YouTubeChannelSearchResult;
}

export const ChannelCard = ({ channel }: ChannelCardProps) => {
    const { navigate } = useRouter();

    return (
        <div
            className="flex items-center gap-3 p-3 rounded-lg bg-card cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate(`/channel/${channel.id}`)}
        >
            <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                className="w-14 h-14 rounded-full flex-shrink-0 object-cover"
                loading="lazy"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-medium text-foreground truncate">
                        {channel.title}
                    </h3>
                    {channel.isVerified && (
                        <BadgeCheck size={14} className="flex-shrink-0 text-muted-foreground" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCount(channel.subscriberCount)} subscribers · {formatCount(channel.videoCount)} videos
                </p>
                {channel.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {channel.description}
                    </p>
                )}
            </div>
        </div>
    );
};
