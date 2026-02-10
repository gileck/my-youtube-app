import { X } from 'lucide-react';
import { useSearchStore } from '../store';

interface RecentSearchesProps {
    onSelect: (query: string) => void;
}

export const RecentSearches = ({ onSelect }: RecentSearchesProps) => {
    const recentSearches = useSearchStore((s) => s.recentSearches);
    const removeRecentSearch = useSearchStore((s) => s.removeRecentSearch);
    const clearRecentSearches = useSearchStore((s) => s.clearRecentSearches);

    if (recentSearches.length === 0) return null;

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Recent searches</h3>
                <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Clear all
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                    <span
                        key={search}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent text-sm text-accent-foreground cursor-pointer hover:bg-accent/80"
                        onClick={() => onSelect(search)}
                    >
                        {search}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeRecentSearch(search);
                            }}
                            className="ml-0.5 hover:text-foreground"
                            aria-label={`Remove ${search}`}
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};
