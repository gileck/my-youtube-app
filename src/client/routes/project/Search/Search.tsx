import { useState, useEffect } from 'react';
import { Input } from '@/client/components/template/ui/input';
import { Button } from '@/client/components/template/ui/button';
import { LinearProgress } from '@/client/components/template/ui/linear-progress';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { useRouter } from '@/client/features';
import { Search as SearchIcon } from 'lucide-react';
import { VideoGrid } from '@/client/features/project/video-card';
import type { ViewMode } from '@/client/features/project/video-card';
import type { YouTubeVideoSearchResult } from '@/apis/project/youtube/types';
import { parseRelativeTimeToSeconds } from '@/common/utils/parseRelativeTime';
import { useSearchStore } from './store';
import { useSearchVideos, useSearchChannels } from './hooks';
import { SearchFilters, ChannelCard, RecentSearches } from './components';

const FILTER_LABELS: Record<string, Record<string, string>> = {
    sortBy: { date: 'Upload date', view_count: 'View count', rating: 'Rating' },
    uploadDate: { hour: 'Last hour', today: 'Today', week: 'This week', month: 'This month', year: 'This year' },
    duration: { short: 'Under 4 min', medium: '4–20 min', long: 'Over 20 min' },
};

export const Search = () => {
    const query = useSearchStore((s) => s.query);
    const setQuery = useSearchStore((s) => s.setQuery);
    const sortBy = useSearchStore((s) => s.sortBy);
    const uploadDate = useSearchStore((s) => s.uploadDate);
    const duration = useSearchStore((s) => s.duration);
    const minViews = useSearchStore((s) => s.minViews);
    const searchType = useSearchStore((s) => s.searchType);
    const setSearchType = useSearchStore((s) => s.setSearchType);
    const addRecentSearch = useSearchStore((s) => s.addRecentSearch);
    const recentSearches = useSearchStore((s) => s.recentSearches);

    const { queryParams, navigate } = useRouter();

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral form input before submission
    const [inputValue, setInputValue] = useState(query);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral pagination state tied to search params
    const [pageNumber, setPageNumber] = useState(1);
    // eslint-disable-next-line state-management/prefer-state-architecture -- accumulated results for load-more pagination
    const [accumulatedVideos, setAccumulatedVideos] = useState<YouTubeVideoSearchResult[]>([]);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for view mode
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    // Sync query from URL param
    useEffect(() => {
        const urlQuery = queryParams.q;
        if (urlQuery && urlQuery !== query) {
            setInputValue(urlQuery);
            setQuery(urlQuery);
        }
    }, [queryParams.q, query, setQuery]);

    const { data: videoData, isLoading: videosLoading, error: videosError } = useSearchVideos({
        query,
        sortBy,
        uploadDate,
        duration,
        minViews,
        pageNumber,
        enabled: searchType === 'videos',
    });

    const { data: channelData, isLoading: channelsLoading, error: channelsError } = useSearchChannels(
        query,
        searchType === 'channels',
    );

    const isLoading = searchType === 'videos' ? videosLoading : channelsLoading;
    const error = searchType === 'videos' ? videosError : channelsError;

    // Accumulate videos for load-more
    useEffect(() => {
        if (!videoData) return;
        // Combine primary + filtered videos, re-sort since filteredVideos breaks order
        const pageVideos = [
            ...(videoData.videos ?? []),
            ...(videoData.filteredVideos ?? []),
        ];
        if (sortBy === 'date') {
            pageVideos.sort((a, b) =>
                parseRelativeTimeToSeconds(a.publishedAt) - parseRelativeTimeToSeconds(b.publishedAt)
            );
        }
        if (pageNumber === 1) {
            setAccumulatedVideos(pageVideos);
        } else {
            setAccumulatedVideos((prev) => [...prev, ...pageVideos]);
        }
    }, [videoData, pageNumber, sortBy]);

    const videos = accumulatedVideos;
    const channels = channelData?.channels ?? [];

    const handleSearch = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            setQuery(trimmed);
            setPageNumber(1);
            addRecentSearch(trimmed);
            navigate('/?q=' + encodeURIComponent(trimmed), { replace: true });
        }
    };

    const handleRecentSelect = (recentQuery: string) => {
        setInputValue(recentQuery);
        setQuery(recentQuery);
        setPageNumber(1);
        addRecentSearch(recentQuery);
        navigate('/?q=' + encodeURIComponent(recentQuery), { replace: true });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    // Active filter chips for summary
    const activeFilters: string[] = [];
    if (sortBy !== 'relevance' && FILTER_LABELS.sortBy[sortBy]) {
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
            <div className="flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search YouTube..."
                    className="flex-1"
                />
                <Button onClick={handleSearch} size="icon" aria-label="Search">
                    <SearchIcon size={18} />
                </Button>
            </div>

            {/* Search type toggle */}
            <div className="mt-2 flex gap-1">
                <Button
                    variant={searchType === 'videos' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSearchType('videos')}
                >
                    Videos
                </Button>
                <Button
                    variant={searchType === 'channels' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSearchType('channels')}
                >
                    Channels
                </Button>
            </div>

            {/* Filters (videos only) */}
            {searchType === 'videos' && (
                <div className="mt-2">
                    <SearchFilters viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
            )}

            {/* Loading indicator for first page */}
            {isLoading && pageNumber === 1 && <LinearProgress className="mt-4" />}

            {error && (
                <div className="mt-6">
                    <ErrorDisplay error={error} title={`Failed to search ${searchType}`} variant="inline" />
                </div>
            )}

            {/* Results summary with filter chips (videos mode) */}
            {!isLoading && !error && query && searchType === 'videos' && videos.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                    {activeFilters.map((filter) => (
                        <span key={filter} className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
                            {filter}
                        </span>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && query && searchType === 'videos' && videoData !== undefined && videos.length === 0 && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    No videos found for &quot;{query}&quot;
                </p>
            )}
            {!isLoading && !error && query && searchType === 'channels' && channelData !== undefined && channels.length === 0 && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    No channels found for &quot;{query}&quot;
                </p>
            )}

            {/* No query state - show recent searches or placeholder */}
            {!query && !isLoading && recentSearches.length > 0 && (
                <RecentSearches onSelect={handleRecentSelect} />
            )}
            {!query && !isLoading && recentSearches.length === 0 && (
                <p className="mt-12 text-center text-sm text-muted-foreground">
                    Search for YouTube videos to get started
                </p>
            )}

            {/* Video results */}
            {searchType === 'videos' && videos.length > 0 && (
                <>
                    <VideoGrid
                        videos={videos}
                        viewMode={viewMode}
                        continuation={videoData?.continuation}
                        isLoading={isLoading}
                        onLoadMore={() => setPageNumber((p) => p + 1)}
                    />

                    {/* Loading indicator for subsequent pages */}
                    {isLoading && pageNumber > 1 && <LinearProgress className="mt-4" />}
                </>
            )}

            {/* Channel results */}
            {searchType === 'channels' && channels.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                    {channels.map((channel) => (
                        <ChannelCard key={channel.id} channel={channel} />
                    ))}
                </div>
            )}
        </div>
    );
};
