import { useMemo } from 'react';
import { History as HistoryIcon, X } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { VideoCard, VideoListItem, ViewModeToggle, useViewModeStore } from '@/client/features/project/video-card';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { useHistoryStore } from '@/client/features/project/history';
import type { HistoryVideo } from '@/client/features/project/history';

function toSearchResult(h: HistoryVideo): YouTubeVideoSearchResult {
    return {
        id: h.id,
        title: h.title,
        thumbnailUrl: h.thumbnailUrl,
        channelTitle: h.channelTitle,
        channelId: h.channelId,
        channelThumbnailUrl: h.channelThumbnailUrl,
        publishedAt: h.publishedAt,
        viewCount: h.viewCount,
        duration: h.duration,
        description: '',
    };
}

export const History = () => {
    const history = useHistoryStore((s) => s.history);
    const removeFromHistory = useHistoryStore((s) => s.removeFromHistory);

    const viewMode = useViewModeStore((s) => s.viewMode);
    const setViewMode = useViewModeStore((s) => s.setViewMode);

    const videos = useMemo(
        () => history.map((h) => ({ ...toSearchResult(h), historyId: h.id })),
        [history]
    );

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HistoryIcon size={20} className="text-foreground" />
                    <h1 className="text-lg font-semibold text-foreground">
                        History
                    </h1>
                    {history.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                            ({history.length})
                        </span>
                    )}
                </div>
                <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>

            {history.length === 0 && (
                <div className="mt-16 flex flex-col items-center gap-3 text-center">
                    <HistoryIcon size={40} className="text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        No videos in history yet. Videos you watch will appear here.
                    </p>
                </div>
            )}

            {videos.length > 0 && (
                <div className={viewMode === 'grid'
                    ? 'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'
                    : 'mt-4 flex flex-col gap-2'
                }>
                    {videos.map((video) => (
                        <div key={video.id} className="relative">
                            {viewMode === 'grid' ? (
                                <VideoCard video={video} />
                            ) : (
                                <VideoListItem video={video} />
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 z-10 h-7 w-7 bg-black/60 text-white hover:bg-black/80"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromHistory(video.id);
                                }}
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
