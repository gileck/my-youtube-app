import { useMemo, useState } from 'react';
import { History as HistoryIcon, X, Search } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { Input } from '@/client/components/template/ui/input';
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
    // eslint-disable-next-line state-management/prefer-state-architecture -- text input value
    const [query, setQuery] = useState('');

    const videos = useMemo(
        () => history.map((h) => ({ ...toSearchResult(h), historyId: h.id })),
        [history]
    );

    const filteredVideos = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return videos;
        return videos.filter(
            (v) => v.title.toLowerCase().includes(q) || v.channelTitle.toLowerCase().includes(q)
        );
    }, [videos, query]);

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

            {history.length > 0 && (
                <div className="relative mt-3">
                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search history"
                        aria-label="Search history"
                        className="h-9 pl-8"
                    />
                </div>
            )}

            {history.length === 0 && (
                <div className="mt-16 flex flex-col items-center gap-3 text-center">
                    <HistoryIcon size={40} className="text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        No videos in history yet. Videos you watch will appear here.
                    </p>
                </div>
            )}

            {history.length > 0 && filteredVideos.length === 0 && (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                    No history matches &ldquo;{query.trim()}&rdquo;.
                </p>
            )}

            {filteredVideos.length > 0 && (
                <div className={viewMode === 'grid'
                    ? 'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'
                    : 'mt-4 flex flex-col gap-2'
                }>
                    {filteredVideos.map((video) => (
                        <div key={video.id} className="relative">
                            {viewMode === 'grid' ? (
                                <VideoCard video={video} />
                            ) : (
                                <VideoListItem video={video} />
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remove from history"
                                className="absolute top-1 right-1 z-10 h-8 w-8 border border-border bg-background/70 text-foreground backdrop-blur-sm hover:bg-background"
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
