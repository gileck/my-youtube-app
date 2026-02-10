import { Skeleton } from '@/client/components/template/ui/skeleton';

export const VideoCardSkeleton = () => {
    return (
        <div className="rounded-lg overflow-hidden bg-card">
            <Skeleton className="aspect-video w-full" />
            <div className="p-3 flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        </div>
    );
};

export const VideoListItemSkeleton = () => {
    return (
        <div className="flex gap-3 p-2 rounded-lg bg-card">
            <Skeleton className="flex-shrink-0 w-40 sm:w-44 aspect-video rounded" />
            <div className="flex-1 py-0.5 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
    );
};
