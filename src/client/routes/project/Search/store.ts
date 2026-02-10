import { createStore } from '@/client/stores';

const MAX_RECENT_SEARCHES = 10;

type SearchType = 'videos' | 'channels';

interface SearchState {
    query: string;
    sortBy: string;
    uploadDate: string;
    duration: string;
    minViews: number;
    filtersExpanded: boolean;
    searchType: SearchType;
    recentSearches: string[];
    setQuery: (query: string) => void;
    setSortBy: (sortBy: string) => void;
    setUploadDate: (uploadDate: string) => void;
    setDuration: (duration: string) => void;
    setMinViews: (minViews: number) => void;
    setFiltersExpanded: (expanded: boolean) => void;
    setSearchType: (searchType: SearchType) => void;
    addRecentSearch: (query: string) => void;
    removeRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
}

export const useSearchStore = createStore<SearchState>({
    key: 'youtube-search',
    label: 'YouTube Search',
    creator: (set) => ({
        query: '',
        sortBy: 'relevance',
        uploadDate: 'all',
        duration: 'all',
        minViews: 0,
        filtersExpanded: false,
        searchType: 'videos',
        recentSearches: [],
        setQuery: (query) => set({ query }),
        setSortBy: (sortBy) => set({ sortBy }),
        setUploadDate: (uploadDate) => set({ uploadDate }),
        setDuration: (duration) => set({ duration }),
        setMinViews: (minViews) => set({ minViews }),
        setFiltersExpanded: (expanded) => set({ filtersExpanded: expanded }),
        setSearchType: (searchType) => set({ searchType }),
        addRecentSearch: (query) =>
            set((state) => ({
                recentSearches: [
                    query,
                    ...state.recentSearches.filter((s) => s !== query),
                ].slice(0, MAX_RECENT_SEARCHES),
            })),
        removeRecentSearch: (query) =>
            set((state) => ({
                recentSearches: state.recentSearches.filter((s) => s !== query),
            })),
        clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    persistOptions: {
        partialize: (state) => ({
            query: state.query,
            sortBy: state.sortBy,
            uploadDate: state.uploadDate,
            duration: state.duration,
            minViews: state.minViews,
            searchType: state.searchType,
            recentSearches: state.recentSearches,
        }),
    },
});
