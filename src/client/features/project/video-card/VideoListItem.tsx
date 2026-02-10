import { useRouter } from '@/client/features';
import { ExternalLink } from 'lucide-react';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { formatViewCount, formatPublishedDate } from './formatUtils';

interface VideoListItemProps {
    video: YouTubeVideoSearchResult;
}

export const VideoListItem = ({ video }: VideoListItemProps) => {
    const { navigate } = useRouter();

    const handleChannelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/channel/${video.channelId}`);
    };

    return (
        <div
            className="cursor-pointer flex gap-3 p-2 rounded-lg bg-card transition-colors hover:bg-accent/50"
            onClick={() => navigate(`/video/${video.id}`)}
        >
            <div className="relative flex-shrink-0 w-40 sm:w-44">
                <div className="relative aspect-video rounded overflow-hidden">
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    {video.duration && (
                        <span className="absolute bottom-0.5 right-0.5 bg-foreground/80 text-background text-[10px] px-1 py-0.5 rounded">
                            {video.duration}
                        </span>
                    )}
                </div>
            </div>
            <div className="min-w-0 flex-1 py-0.5">
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
                        className="flex-shrink-0 hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={12} />
                    </a>
                </p>
            </div>
        </div>
    );
};
