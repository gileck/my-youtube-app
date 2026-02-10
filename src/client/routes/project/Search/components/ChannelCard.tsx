import { useRouter } from '@/client/features';
import type { YouTubeChannelSearchResult } from '@/apis/project/youtube/types';
import { BadgeCheck } from 'lucide-react';

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
                    {channel.subscriberCount} · {channel.videoCount}
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
