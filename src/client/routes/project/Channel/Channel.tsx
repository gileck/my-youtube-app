import { useState, useMemo } from 'react';
import { useRouter } from '@/client/features';
import { LinearProgress } from '@/client/components/template/ui/linear-progress';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { VideoGrid } from '@/client/features/project/video-card';
import type { ViewMode } from '@/client/features/project/video-card';
import { useChannelVideos } from './hooks';
import { ChannelHeader, ChannelFilters } from './components';
import type { ChannelFilterValues } from './components';
import type { ChannelVideoFilters } from '@/apis/project/youtube/types';

const DEFAULT_FILTERS: ChannelFilterValues = {
    sortBy: 'upload_date',
    uploadDate: 'all',
    duration: 'all',
    minViews: 0,
};

export const Channel = () => {
    const { routeParams } = useRouter();
    const channelId = routeParams.channelId ?? '';

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral pagination state tied to channel view
    const [pageNumber, setPageNumber] = useState(1);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral filter state tied to channel view
    const [filterValues, setFilterValues] = useState<ChannelFilterValues>(DEFAULT_FILTERS);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for view mode
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const apiFilters = useMemo((): ChannelVideoFilters | undefined => {
        const f: ChannelVideoFilters = {};
        if (filterValues.sortBy !== 'upload_date') f.sort_by = filterValues.sortBy;
        if (filterValues.uploadDate !== 'all') f.upload_date = filterValues.uploadDate;
        if (filterValues.duration !== 'all') f.duration = filterValues.duration;
        if (filterValues.minViews > 0) f.minViews = filterValues.minViews;
        return Object.keys(f).length > 0 ? f : undefined;
    }, [filterValues]);

    const { data, isLoading, error } = useChannelVideos({ channelId, pageNumber, filters: apiFilters });

    const videos = data?.data?.videos;
    const channelInfo = data?.data?.channelInfo;

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            {isLoading && !data && <LinearProgress />}

            {error && (
                <div className="mt-6">
                    <ErrorDisplay error={error} title="Failed to load channel" variant="inline" />
                </div>
            )}

            {channelInfo && <ChannelHeader channel={channelInfo} />}

            <div className="mt-2">
                <ChannelFilters
                    filters={filterValues}
                    filtersExpanded={filtersExpanded}
                    viewMode={viewMode}
                    onFiltersExpandedChange={setFiltersExpanded}
                    onSortByChange={(sortBy) => { setFilterValues((f) => ({ ...f, sortBy })); setPageNumber(1); }}
                    onUploadDateChange={(uploadDate) => { setFilterValues((f) => ({ ...f, uploadDate })); setPageNumber(1); }}
                    onDurationChange={(duration) => { setFilterValues((f) => ({ ...f, duration })); setPageNumber(1); }}
                    onMinViewsChange={(minViews) => { setFilterValues((f) => ({ ...f, minViews })); setPageNumber(1); }}
                    onViewModeChange={setViewMode}
                />
            </div>

            {isLoading && data && <LinearProgress className="mt-2" />}

            {!isLoading && !error && videos !== undefined && videos.length === 0 && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    No videos found for this channel
                </p>
            )}

            {videos && videos.length > 0 && (
                <VideoGrid
                    videos={videos}
                    viewMode={viewMode}
                    continuation={data?.data?.continuation}
                    isLoading={isLoading}
                    onLoadMore={() => setPageNumber((p) => p + 1)}
                />
            )}
        </div>
    );
};
