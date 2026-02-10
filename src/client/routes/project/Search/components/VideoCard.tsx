import { useRouter } from '@/client/features';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';

function formatViewCount(viewCount: string): string {
    const num = parseInt(viewCount, 10);
    if (isNaN(num)) return viewCount;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K views`;
    return `${num} views`;
}

function formatPublishedDate(dateStr: string): string {
    if (!dateStr) return '';
    // If it's already a relative string like "2 months ago", return as-is
    if (dateStr.includes('ago')) return dateStr;
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

interface VideoCardProps {
    video: YouTubeVideoSearchResult;
}

export const VideoCard = ({ video }: VideoCardProps) => {
    const { navigate } = useRouter();

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
                        className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                        loading="lazy"
                    />
                )}
                <div className="min-w-0">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                        {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        {video.channelTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatViewCount(video.viewCount)}
                        {video.publishedAt && ` · ${formatPublishedDate(video.publishedAt)}`}
                    </p>
                </div>
            </div>
        </div>
    );
};
