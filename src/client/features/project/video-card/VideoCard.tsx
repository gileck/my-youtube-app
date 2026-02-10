import { useRouter } from '@/client/features';
import { ExternalLink } from 'lucide-react';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { formatViewCount, formatPublishedDate } from './formatUtils';

interface VideoCardProps {
    video: YouTubeVideoSearchResult;
}

export const VideoCard = ({ video }: VideoCardProps) => {
    const { navigate } = useRouter();

    const handleChannelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/channel/${video.channelId}`);
    };

    return (
        <div
            className="cursor-pointer rounded-lg overflow-hidden bg-card transition-colors hover:bg-accent/50"
            onClick={() => navigate(`/video/${video.id}`)}
        >
            <div className="relative aspect-video">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {video.duration && (
                    <span className="absolute bottom-1 right-1 bg-foreground/80 text-background text-xs px-1.5 py-0.5 rounded">
                        {video.duration}
                    </span>
                )}
            </div>
            <div className="p-3 flex gap-3">
                {video.channelThumbnailUrl && (
                    <img
                        src={video.channelThumbnailUrl}
                        alt={video.channelTitle}
                        className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80"
                        loading="lazy"
                        onClick={handleChannelClick}
                    />
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                        {video.title}
                    </h3>
                    <p
                        className="text-xs text-muted-foreground mt-1 cursor-pointer hover:text-foreground"
                        onClick={handleChannelClick}
                    >
                        {video.channelTitle}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>
                            {formatViewCount(video.viewCount)}
                            {video.publishedAt && ` · ${formatPublishedDate(video.publishedAt)}`}
                        </span>
                        <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto flex-shrink-0 hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink size={12} />
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};
