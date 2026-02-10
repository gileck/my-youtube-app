import { Button } from '@/client/components/template/ui/button';
import { Input } from '@/client/components/template/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/client/components/template/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import { ViewModeToggle } from '@/client/features/project/video-card';
import type { ViewMode } from '@/client/features/project/video-card';

export interface ChannelFilterValues {
    sortBy: string;
    uploadDate: string;
    duration: string;
    minViews: number;
}

interface ChannelFiltersProps {
    filters: ChannelFilterValues;
    filtersExpanded: boolean;
    viewMode: ViewMode;
    onFiltersExpandedChange: (expanded: boolean) => void;
    onSortByChange: (sortBy: string) => void;
    onUploadDateChange: (uploadDate: string) => void;
    onDurationChange: (duration: string) => void;
    onMinViewsChange: (minViews: number) => void;
    onViewModeChange: (mode: ViewMode) => void;
}

export const ChannelFilters = ({
    filters,
    filtersExpanded,
    viewMode,
    onFiltersExpandedChange,
    onSortByChange,
    onUploadDateChange,
    onDurationChange,
    onMinViewsChange,
    onViewModeChange,
}: ChannelFiltersProps) => {
    return (
        <div>
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersExpandedChange(!filtersExpanded)}
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
                        <Select value={filters.sortBy} onValueChange={onSortByChange}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="upload_date">Upload date</SelectItem>
                                <SelectItem value="view_count">View count</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Upload date</label>
                        <Select value={filters.uploadDate} onValueChange={onUploadDateChange}>
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
                        <Select value={filters.duration} onValueChange={onDurationChange}>
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
                            value={filters.minViews || ''}
                            onChange={(e) => onMinViewsChange(parseInt(e.target.value, 10) || 0)}
                            placeholder="0"
                            className="h-9 text-xs"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
