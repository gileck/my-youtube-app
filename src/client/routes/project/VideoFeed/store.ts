import { createStore } from '@/client/stores';

type FeedTab = 'feed' | 'manage';

interface VideoFeedState {
    sortBy: 'newest' | 'most_viewed';
    uploadDate: string;
    duration: string;
    minViews: number;
    hideWatched: boolean;
    filtersExpanded: boolean;
    activeTab: FeedTab;
    setSortBy: (sortBy: 'newest' | 'most_viewed') => void;
    setUploadDate: (uploadDate: string) => void;
    setDuration: (duration: string) => void;
    setMinViews: (minViews: number) => void;
    setHideWatched: (hideWatched: boolean) => void;
    setFiltersExpanded: (expanded: boolean) => void;
    setActiveTab: (tab: FeedTab) => void;
}

export const useVideoFeedStore = createStore<VideoFeedState>({
    key: 'video-feed',
    label: 'Video Feed',
    creator: (set) => ({
        sortBy: 'newest',
        uploadDate: 'all',
        duration: 'all',
        minViews: 0,
        hideWatched: false,
        filtersExpanded: false,
        activeTab: 'feed',
        setSortBy: (sortBy) => set({ sortBy }),
        setUploadDate: (uploadDate) => set({ uploadDate }),
        setDuration: (duration) => set({ duration }),
        setMinViews: (minViews) => set({ minViews }),
        setHideWatched: (hideWatched) => set({ hideWatched }),
        setFiltersExpanded: (expanded) => set({ filtersExpanded: expanded }),
        setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    persistOptions: {
        partialize: (state) => ({
            sortBy: state.sortBy,
            uploadDate: state.uploadDate,
            duration: state.duration,
            minViews: state.minViews,
            hideWatched: state.hideWatched,
            activeTab: state.activeTab,
        }),
    },
});
