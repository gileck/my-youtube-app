import { Button } from '@/client/components/template/ui/button';
import { useSubscriptionsStore } from '@/client/features/project/subscriptions';
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
    const channels = useSubscriptionsStore((s) => s.channels);
    const subscribeChannel = useSubscriptionsStore((s) => s.subscribeChannel);
    const unsubscribeChannel = useSubscriptionsStore((s) => s.unsubscribeChannel);
    const isSubscribed = channels.some((c) => c.id === channel.id);

    const handleToggleSubscribe = () => {
        if (isSubscribed) {
            unsubscribeChannel(channel.id);
        } else {
            subscribeChannel({
                id: channel.id,
                title: channel.title,
                thumbnailUrl: channel.thumbnailUrl,
            });
        }
    };

    return (
        <div className="flex items-start gap-4 mb-4">
            {channel.thumbnailUrl && (
                <img
                    src={channel.thumbnailUrl}
                    alt={channel.title}
                    className="w-16 h-16 rounded-full flex-shrink-0"
                />
            )}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-foreground truncate">
                        {channel.title}
                    </h1>
                    {channel.isVerified && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">✓</span>
                    )}
                    <Button
                        variant={isSubscribed ? 'outline' : 'default'}
                        size="sm"
                        className="ml-auto flex-shrink-0"
                        onClick={handleToggleSubscribe}
                    >
                        {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </Button>
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
