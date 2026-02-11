import { createStore } from '@/client/stores';
import type { HistoryVideo } from './types';

interface HistoryState {
    history: HistoryVideo[];
    addToHistory: (video: HistoryVideo) => void;
    removeFromHistory: (videoId: string) => void;
}

export const useHistoryStore = createStore<HistoryState>({
    key: 'video-history',
    label: 'Video History',
    creator: (set) => ({
        history: [],
        addToHistory: (video) =>
            set((state) => ({
                history: [
                    video,
                    ...state.history.filter((h) => h.id !== video.id),
                ],
            })),
        removeFromHistory: (videoId) =>
            set((state) => ({
                history: state.history.filter((h) => h.id !== videoId),
            })),
    }),
    persistOptions: {
        partialize: (state) => ({
            history: state.history,
        }),
    },
});
