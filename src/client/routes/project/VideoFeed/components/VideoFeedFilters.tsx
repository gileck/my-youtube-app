import { Button } from '@/client/components/template/ui/button';
import { Input } from '@/client/components/template/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/client/components/template/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import { ViewModeToggle } from '@/client/features/project/video-card';
import type { ViewMode } from '@/client/features/project/video-card';
import { useVideoFeedStore } from '../store';

interface VideoFeedFiltersProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const VideoFeedFilters = ({ viewMode, onViewModeChange }: VideoFeedFiltersProps) => {
    const filtersExpanded = useVideoFeedStore((s) => s.filtersExpanded);
    const setFiltersExpanded = useVideoFeedStore((s) => s.setFiltersExpanded);
    const sortBy = useVideoFeedStore((s) => s.sortBy);
    const setSortBy = useVideoFeedStore((s) => s.setSortBy);
    const uploadDate = useVideoFeedStore((s) => s.uploadDate);
    const setUploadDate = useVideoFeedStore((s) => s.setUploadDate);
    const duration = useVideoFeedStore((s) => s.duration);
    const setDuration = useVideoFeedStore((s) => s.setDuration);
    const minViews = useVideoFeedStore((s) => s.minViews);
    const setMinViews = useVideoFeedStore((s) => s.setMinViews);

    return (
        <div>
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="gap-1.5 text-muted-foreground"
                >
                    <SlidersHorizontal size={16} />
                    Filters
                </Button>
                <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            </div>

            {filtersExpanded && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Sort by</label>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'most_viewed')}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest first</SelectItem>
                                <SelectItem value="most_viewed">Most viewed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Upload date</label>
                        <Select value={uploadDate} onValueChange={setUploadDate}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any time</SelectItem>
                                <SelectItem value="hour">Last hour</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This week</SelectItem>
                                <SelectItem value="month">This month</SelectItem>
                                <SelectItem value="year">This year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any</SelectItem>
                                <SelectItem value="short">Under 4 min</SelectItem>
                                <SelectItem value="medium">4-20 min</SelectItem>
                                <SelectItem value="long">Over 20 min</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Min views</label>
                        <Input
                            type="number"
                            min={0}
                            value={minViews || ''}
                            onChange={(e) => setMinViews(parseInt(e.target.value, 10) || 0)}
                            placeholder="0"
                            className="h-9 text-xs"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
