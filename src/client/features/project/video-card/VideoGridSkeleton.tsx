import { VideoCardSkeleton, VideoListItemSkeleton } from './VideoCardSkeleton';
import type { ViewMode } from './ViewModeToggle';

interface VideoGridSkeletonProps {
    count?: number;
    viewMode?: ViewMode;
}

export const VideoGridSkeleton = ({ count = 6, viewMode = 'grid' }: VideoGridSkeletonProps) => {
    const items = Array.from({ length: count }, (_, i) => i);

    if (viewMode === 'list') {
        return (
            <div className="mt-4 flex flex-col gap-2">
                {items.map((i) => (
                    <VideoListItemSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((i) => (
                <VideoCardSkeleton key={i} />
            ))}
        </div>
    );
};
