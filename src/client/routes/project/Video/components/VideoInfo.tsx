import type { YouTubeVideoDetails } from '@/apis/project/youtube/types';

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
                        className="w-9 h-9 rounded-full"
                    />
                )}
                <div>
                    <p className="text-sm font-medium text-foreground">{video.channelTitle}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatCount(video.viewCount)} views
                        {video.likeCount && ` · ${formatCount(video.likeCount)} likes`}
                        {video.publishedAt && ` · ${video.publishedAt}`}
                    </p>
                </div>
            </div>
            {video.description && (
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                    {video.description}
                </p>
            )}
        </div>
    );
};
