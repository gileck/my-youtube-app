import { Button } from '@/client/components/template/ui/button';
import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface ViewModeToggleProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
    return (
        <div className="flex gap-1">
            <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onViewModeChange('grid')}
                aria-label="Grid view"
            >
                <LayoutGrid size={16} />
            </Button>
            <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onViewModeChange('list')}
                aria-label="List view"
            >
                <List size={16} />
            </Button>
        </div>
    );
};
