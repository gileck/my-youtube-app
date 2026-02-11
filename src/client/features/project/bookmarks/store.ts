import { createStore } from '@/client/stores';
import type { BookmarkedVideo } from './types';

interface BookmarksState {
    bookmarks: BookmarkedVideo[];
    addBookmark: (video: BookmarkedVideo) => void;
    removeBookmark: (videoId: string) => void;
    isBookmarked: (videoId: string) => boolean;
}

export const useBookmarksStore = createStore<BookmarksState>({
    key: 'bookmarked-videos',
    label: 'Bookmarked Videos',
    creator: (set, get) => ({
        bookmarks: [],
        addBookmark: (video) =>
            set((state) => {
                if (state.bookmarks.some((b) => b.id === video.id)) return state;
                return { bookmarks: [...state.bookmarks, video] };
            }),
        removeBookmark: (videoId) =>
            set((state) => ({
                bookmarks: state.bookmarks.filter((b) => b.id !== videoId),
            })),
        isBookmarked: (videoId) => get().bookmarks.some((b) => b.id === videoId),
    }),
    persistOptions: {
        partialize: (state) => ({
            bookmarks: state.bookmarks,
        }),
    },
});
