import { Button } from '@/client/components/template/ui/button';
import { Input } from '@/client/components/template/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/client/components/template/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import { useSearchStore } from '../store';

export const SearchFilters = () => {
    const filtersExpanded = useSearchStore((s) => s.filtersExpanded);
    const setFiltersExpanded = useSearchStore((s) => s.setFiltersExpanded);
    const sortBy = useSearchStore((s) => s.sortBy);
    const setSortBy = useSearchStore((s) => s.setSortBy);
    const uploadDate = useSearchStore((s) => s.uploadDate);
    const setUploadDate = useSearchStore((s) => s.setUploadDate);
    const duration = useSearchStore((s) => s.duration);
    const setDuration = useSearchStore((s) => s.setDuration);
    const minViews = useSearchStore((s) => s.minViews);
    const setMinViews = useSearchStore((s) => s.setMinViews);

    return (
        <div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="gap-1.5 text-muted-foreground"
            >
                <SlidersHorizontal size={16} />
                Filters
            </Button>

            {filtersExpanded && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Sort by</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="relevance">Relevance</SelectItem>
                                <SelectItem value="date">Upload date</SelectItem>
                                <SelectItem value="view_count">View count</SelectItem>
                                <SelectItem value="rating">Rating</SelectItem>
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
                                <SelectItem value="medium">4–20 min</SelectItem>
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
