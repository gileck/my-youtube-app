import { useState, useMemo } from 'react';
import { Bookmark, Search } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { Input } from '@/client/components/template/ui/input';
import { VideoGrid, ViewModeToggle, useViewModeStore } from '@/client/features/project/video-card';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { useBookmarksStore } from '@/client/features/project/bookmarks';
import type { BookmarkedVideo } from '@/client/features/project/bookmarks';

type SortOption = 'recently-added' | 'recently-published' | 'most-views';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'recently-added', label: 'Recently Added' },
    { value: 'recently-published', label: 'Recently Published' },
    { value: 'most-views', label: 'Most Views' },
];

function toSearchResult(b: BookmarkedVideo): YouTubeVideoSearchResult {
    return {
        id: b.id,
        title: b.title,
        thumbnailUrl: b.thumbnailUrl,
        channelTitle: b.channelTitle,
        channelId: b.channelId,
        channelThumbnailUrl: b.channelThumbnailUrl,
        publishedAt: b.publishedAt,
        viewCount: b.viewCount,
        duration: b.duration,
        description: '',
    };
}

function sortBookmarks(bookmarks: BookmarkedVideo[], sort: SortOption): BookmarkedVideo[] {
    const sorted = [...bookmarks];
    switch (sort) {
        case 'recently-added':
            return sorted.sort((a, b) => b.bookmarkedAt - a.bookmarkedAt);
        case 'recently-published':
            return sorted.sort((a, b) => {
                const dateA = new Date(a.publishedAt).getTime() || 0;
                const dateB = new Date(b.publishedAt).getTime() || 0;
                return dateB - dateA;
            });
        case 'most-views': {
            const parseViews = (v: string) => parseInt(v.replace(/[^0-9]/g, ''), 10) || 0;
            return sorted.sort((a, b) => parseViews(b.viewCount) - parseViews(a.viewCount));
        }
    }
}

export const Bookmarks = () => {
    const bookmarks = useBookmarksStore((s) => s.bookmarks);

    const viewMode = useViewModeStore((s) => s.viewMode);
    const setViewMode = useViewModeStore((s) => s.setViewMode);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for sort
    const [sortBy, setSortBy] = useState<SortOption>('recently-added');
    // eslint-disable-next-line state-management/prefer-state-architecture -- text input value
    const [query, setQuery] = useState('');

    const sortedVideos = useMemo(
        () => sortBookmarks(bookmarks, sortBy).map(toSearchResult),
        [bookmarks, sortBy]
    );

    const filteredVideos = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return sortedVideos;
        return sortedVideos.filter(
            (v) => v.title.toLowerCase().includes(q) || v.channelTitle.toLowerCase().includes(q)
        );
    }, [sortedVideos, query]);

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bookmark size={20} className="text-foreground" />
                    <h1 className="text-lg font-semibold text-foreground">
                        Bookmarks
                    </h1>
                    {bookmarks.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                            ({bookmarks.length})
                        </span>
                    )}
                </div>
                <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>

            {bookmarks.length > 0 && (
                <>
                    <div className="relative mt-3">
                        <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search bookmarks"
                            aria-label="Search bookmarks"
                            className="h-9 pl-8"
                        />
                    </div>
                    <div className="mt-3 flex items-center gap-1 flex-wrap">
                        {SORT_OPTIONS.map((opt) => (
                            <Button
                                key={opt.value}
                                variant={sortBy === opt.value ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setSortBy(opt.value)}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </>
            )}

            {bookmarks.length === 0 && (
                <div className="mt-16 flex flex-col items-center gap-3 text-center">
                    <Bookmark size={40} className="text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        No bookmarked videos yet. Tap the bookmark icon on any video to save it here.
                    </p>
                </div>
            )}

            {bookmarks.length > 0 && filteredVideos.length === 0 && (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                    No bookmarks match &ldquo;{query.trim()}&rdquo;.
                </p>
            )}

            {filteredVideos.length > 0 && (
                <VideoGrid videos={filteredVideos} viewMode={viewMode} />
            )}
        </div>
    );
};
