import { createStore } from '@/client/stores';

interface SearchState {
    query: string;
    sortBy: string;
    uploadDate: string;
    duration: string;
    minViews: number;
    filtersExpanded: boolean;
    setQuery: (query: string) => void;
    setSortBy: (sortBy: string) => void;
    setUploadDate: (uploadDate: string) => void;
    setDuration: (duration: string) => void;
    setMinViews: (minViews: number) => void;
    setFiltersExpanded: (expanded: boolean) => void;
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
        setQuery: (query) => set({ query }),
        setSortBy: (sortBy) => set({ sortBy }),
        setUploadDate: (uploadDate) => set({ uploadDate }),
        setDuration: (duration) => set({ duration }),
        setMinViews: (minViews) => set({ minViews }),
        setFiltersExpanded: (expanded) => set({ filtersExpanded: expanded }),
    }),
    persistOptions: {
        partialize: (state) => ({
            query: state.query,
            sortBy: state.sortBy,
            uploadDate: state.uploadDate,
            duration: state.duration,
            minViews: state.minViews,
        }),
    },
});
