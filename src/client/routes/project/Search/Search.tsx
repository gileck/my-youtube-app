import { useState } from 'react';
import { Input } from '@/client/components/template/ui/input';
import { Button } from '@/client/components/template/ui/button';
import { LinearProgress } from '@/client/components/template/ui/linear-progress';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { Search as SearchIcon } from 'lucide-react';
import { VideoCard } from '@/client/features/project/video-card';
import { useSearchStore } from './store';
import { useSearchVideos } from './hooks';
import { SearchFilters } from './components';

export const Search = () => {
    const query = useSearchStore((s) => s.query);
    const setQuery = useSearchStore((s) => s.setQuery);
    const sortBy = useSearchStore((s) => s.sortBy);
    const uploadDate = useSearchStore((s) => s.uploadDate);
    const duration = useSearchStore((s) => s.duration);
    const minViews = useSearchStore((s) => s.minViews);

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral form input before submission
    const [inputValue, setInputValue] = useState(query);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral pagination state tied to search params
    const [pageNumber, setPageNumber] = useState(1);

    const { data, isLoading, error } = useSearchVideos({
        query,
        sortBy,
        uploadDate,
        duration,
        minViews,
        pageNumber,
    });

    const handleSearch = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            setQuery(trimmed);
            setPageNumber(1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const videos = data?.filteredVideos ?? data?.videos;

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search YouTube videos..."
                    className="flex-1"
                />
                <Button onClick={handleSearch} size="icon" aria-label="Search">
                    <SearchIcon size={18} />
                </Button>
            </div>

            <div className="mt-2">
                <SearchFilters />
            </div>

            {isLoading && <LinearProgress className="mt-4" />}

            {error && (
                <div className="mt-6">
                    <ErrorDisplay error={error} title="Failed to search videos" variant="inline" />
                </div>
            )}

            {!isLoading && !error && query && videos !== undefined && videos.length === 0 && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    No videos found for &quot;{query}&quot;
                </p>
            )}

            {!query && !isLoading && (
                <p className="mt-12 text-center text-sm text-muted-foreground">
                    Search for YouTube videos to get started
                </p>
            )}

            {videos && videos.length > 0 && (
                <>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {videos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>

                    {data?.continuation && (
                        <div className="mt-6 flex justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setPageNumber((p) => p + 1)}
                                disabled={isLoading}
                            >
                                Load more
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
