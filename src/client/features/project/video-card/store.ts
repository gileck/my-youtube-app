import { createStore } from '@/client/stores';
import type { ViewMode } from './ViewModeToggle';

interface ViewModeState {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

export const useViewModeStore = createStore<ViewModeState>({
    key: 'view-mode',
    label: 'View Mode',
    creator: (set) => ({
        viewMode: 'grid',
        setViewMode: (mode) => set({ viewMode: mode }),
    }),
    persistOptions: {
        partialize: (state) => ({ viewMode: state.viewMode }),
    },
});
