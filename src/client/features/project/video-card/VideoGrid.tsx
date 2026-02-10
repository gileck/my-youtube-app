import { Button } from '@/client/components/template/ui/button';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
    videos: YouTubeVideoSearchResult[];
    continuation?: boolean;
    isLoading?: boolean;
    onLoadMore?: () => void;
}

export const VideoGrid = ({ videos, continuation, isLoading, onLoadMore }: VideoGridProps) => {
    return (
        <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>

            {continuation && onLoadMore && (
                <div className="mt-6 flex justify-center">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={isLoading}
                    >
                        Load more
                    </Button>
                </div>
            )}
        </>
    );
};
