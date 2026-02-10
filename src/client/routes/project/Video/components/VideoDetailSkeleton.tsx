import { Skeleton } from '@/client/components/template/ui/skeleton';

export const VideoDetailSkeleton = () => {
    return (
        <div>
            {/* Video player placeholder */}
            <Skeleton className="aspect-video w-full rounded-lg" />

            {/* Title */}
            <div className="mt-3 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
            </div>

            {/* Channel info */}
            <div className="mt-3 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>

            {/* Description */}
            <div className="mt-3 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
            </div>
        </div>
    );
};
