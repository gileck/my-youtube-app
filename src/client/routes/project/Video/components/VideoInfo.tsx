import { useRouter } from '@/client/features';
import { ExternalLink, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import type { YouTubeVideoDetails } from '@/apis/project/youtube/types';
import { useBookmarkToggle } from '@/client/features/project/bookmarks';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';

function formatCount(count: string): string {
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
}

interface VideoInfoProps {
    video: YouTubeVideoDetails;
}

export const VideoInfo = ({ video }: VideoInfoProps) => {
    const { navigate } = useRouter();
    const { isBookmarked, toggle: toggleBookmark } = useBookmarkToggle(video);
    const [descExpanded, setDescExpanded] = useVideoUIToggle(video.id, 'descExpanded', false);

    const handleChannelClick = () => {
        navigate(`/channel/${video.channelId}`);
    };

    return (
        <div className="mt-3">
            <h1 className="text-lg font-semibold text-foreground leading-snug">
                {video.title}
            </h1>

            <div className="mt-2 flex items-center gap-3">
                {video.channelImage && (
                    <img
                        src={video.channelImage}
                        alt={video.channelTitle}
                        className="w-9 h-9 rounded-full cursor-pointer hover:opacity-80"
                        onClick={handleChannelClick}
                    />
                )}
                <div>
                    <p
                        className="text-sm font-medium text-foreground cursor-pointer hover:underline"
                        onClick={handleChannelClick}
                    >
                        {video.channelTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatCount(video.viewCount)} views
                        {video.likeCount && ` · ${formatCount(video.likeCount)} likes`}
                        {video.publishedAt && ` · ${video.publishedAt}`}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleBookmark}
                    className="gap-1.5 rounded-full"
                >
                    {isBookmarked ? (
                        <BookmarkCheck size={14} className="text-primary" />
                    ) : (
                        <Bookmark size={14} />
                    )}
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full"
                    asChild
                >
                    <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink size={14} />
                        YouTube
                    </a>
                </Button>
            </div>

            {video.description && (
                <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-3 w-full text-left rounded-lg bg-muted/30 p-3"
                >
                    <p className={`text-sm text-muted-foreground whitespace-pre-line ${descExpanded ? '' : 'line-clamp-3'}`}>
                        {video.description}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                        {descExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {descExpanded ? 'Show less' : 'Show more'}
                    </div>
                </button>
            )}
        </div>
    );
};
