import { Button } from '@/client/components/template/ui/button';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { VideoCard } from './VideoCard';
import { VideoListItem } from './VideoListItem';
import type { ViewMode } from './ViewModeToggle';

interface VideoGridProps {
    videos: YouTubeVideoSearchResult[];
    viewMode?: ViewMode;
    continuation?: boolean;
    isLoading?: boolean;
    onLoadMore?: () => void;
}

export const VideoGrid = ({ videos, viewMode = 'grid', continuation, isLoading, onLoadMore }: VideoGridProps) => {
    return (
        <>
            {viewMode === 'grid' ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="mt-4 flex flex-col gap-2">
                    {videos.map((video) => (
                        <VideoListItem key={video.id} video={video} />
                    ))}
                </div>
            )}

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
