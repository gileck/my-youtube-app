import { useState } from 'react';
import { Button } from '@/client/components/template/ui/button';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { VideoGrid, VideoGridSkeleton } from '@/client/features/project/video-card';
import type { ViewMode } from '@/client/features/project/video-card';
import { useVideoFeedStore } from './store';
import { useVideoFeed } from './hooks';
import { VideoFeedFilters, ManageSubscriptions } from './components';

const FILTER_LABELS: Record<string, Record<string, string>> = {
    sortBy: { most_viewed: 'Most viewed' },
    uploadDate: { hour: 'Last hour', today: 'Today', week: 'This week', month: 'This month', year: 'This year' },
    duration: { short: 'Under 4 min', medium: '4-20 min', long: 'Over 20 min' },
};

export const VideoFeed = () => {
    const activeTab = useVideoFeedStore((s) => s.activeTab);
    const setActiveTab = useVideoFeedStore((s) => s.setActiveTab);
    const sortBy = useVideoFeedStore((s) => s.sortBy);
    const uploadDate = useVideoFeedStore((s) => s.uploadDate);
    const duration = useVideoFeedStore((s) => s.duration);
    const minViews = useVideoFeedStore((s) => s.minViews);

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for view mode
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const { videos, isLoading, hasError, error, hasSubscriptions } = useVideoFeed({
        sortBy,
        uploadDate,
        duration,
        minViews,
    });

    const activeFilters: string[] = [];
    if (sortBy !== 'newest' && FILTER_LABELS.sortBy[sortBy]) {
        activeFilters.push(`Sort: ${FILTER_LABELS.sortBy[sortBy]}`);
    }
    if (uploadDate !== 'all' && FILTER_LABELS.uploadDate[uploadDate]) {
        activeFilters.push(`Date: ${FILTER_LABELS.uploadDate[uploadDate]}`);
    }
    if (duration !== 'all' && FILTER_LABELS.duration[duration]) {
        activeFilters.push(`Duration: ${FILTER_LABELS.duration[duration]}`);
    }
    if (minViews > 0) {
        activeFilters.push(`Min views: ${minViews.toLocaleString()}`);
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            {/* Tab toggle */}
            <div className="flex gap-1 mb-3">
                <Button
                    variant={activeTab === 'feed' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('feed')}
                >
                    Feed
                </Button>
                <Button
                    variant={activeTab === 'manage' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('manage')}
                >
                    Manage
                </Button>
            </div>

            {activeTab === 'manage' && <ManageSubscriptions />}

            {activeTab === 'feed' && (
                <>
                    {!hasSubscriptions && (
                        <p className="mt-12 text-center text-sm text-muted-foreground">
                            No subscriptions yet. Switch to the Manage tab to add channels or search queries,
                            or subscribe to channels from Search results.
                        </p>
                    )}

                    {hasSubscriptions && (
                        <>
                            <VideoFeedFilters viewMode={viewMode} onViewModeChange={setViewMode} />

                            {isLoading && videos.length === 0 && (
                                <VideoGridSkeleton viewMode={viewMode} />
                            )}

                            {hasError && error && (
                                <div className="mt-6">
                                    <ErrorDisplay error={error} title="Failed to load feed" variant="inline" />
                                </div>
                            )}

                            {!isLoading && !hasError && videos.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                                    {activeFilters.map((filter) => (
                                        <span key={filter} className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
                                            {filter}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {!isLoading && !hasError && videos.length === 0 && (
                                <p className="mt-6 text-center text-sm text-muted-foreground">
                                    No videos found. Try adjusting your filters or adding more subscriptions.
                                </p>
                            )}

                            {videos.length > 0 && (
                                <VideoGrid videos={videos} viewMode={viewMode} />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};
