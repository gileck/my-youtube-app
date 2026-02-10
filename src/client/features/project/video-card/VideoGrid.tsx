import { useState } from 'react';
import { Button } from '@/client/components/template/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { VideoCard } from './VideoCard';
import { VideoListItem } from './VideoListItem';

interface VideoGridProps {
    videos: YouTubeVideoSearchResult[];
    continuation?: boolean;
    isLoading?: boolean;
    onLoadMore?: () => void;
}

export const VideoGrid = ({ videos, continuation, isLoading, onLoadMore }: VideoGridProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for view mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <>
            <div className="mt-4 flex justify-end">
                <div className="flex gap-1">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewMode('grid')}
                        aria-label="Grid view"
                    >
                        <LayoutGrid size={16} />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewMode('list')}
                        aria-label="List view"
                    >
                        <List size={16} />
                    </Button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="mt-2 flex flex-col gap-2">
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
