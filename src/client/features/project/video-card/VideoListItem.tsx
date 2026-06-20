import { useRouter } from '@/client/features';
import { ExternalLink, Bookmark, BookmarkCheck, CircleCheck, Circle } from 'lucide-react';
import { useBookmarkToggle } from '@/client/features/project/bookmarks/hooks';
import { useWatchedToggle } from '@/client/features/project/history';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { formatDuration, formatViewCount, formatPublishedDate } from './formatUtils';
import { useVideoProgress } from './hooks';

interface VideoListItemProps {
    video: YouTubeVideoSearchResult;
}

export const VideoListItem = ({ video }: VideoListItemProps) => {
    const { navigate } = useRouter();
    const { isBookmarked, toggle } = useBookmarkToggle(video);
    const { isWatched, toggle: toggleWatched } = useWatchedToggle(video);
    const progress = useVideoProgress(video.id, video.duration);

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
                            {formatDuration(video.duration)}
                        </span>
                    )}
                    {progress >= 1 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/30">
                            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
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
                    <button
                        className="ml-auto flex-shrink-0 hover:text-foreground p-2 -m-2"
                        aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                        onClick={(e) => { e.stopPropagation(); toggleWatched(); }}
                    >
                        {isWatched ? <CircleCheck size={14} className="text-primary" /> : <Circle size={14} />}
                    </button>
                    <button
                        className="flex-shrink-0 hover:text-foreground p-2 -m-2"
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        onClick={(e) => { e.stopPropagation(); toggle(); }}
                    >
                        {isBookmarked ? <BookmarkCheck size={14} className="text-primary" /> : <Bookmark size={14} />}
                    </button>
                    <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open on YouTube"
                        className="flex-shrink-0 hover:text-foreground p-2 -m-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={14} />
                    </a>
                </p>
            </div>
        </div>
    );
};
