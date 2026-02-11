import { createStore } from '@/client/stores';

interface VideoUIStateData {
    states: Record<string, Record<string, boolean>>;
    savedTimes: Record<string, number>;
    setState: (videoId: string, key: string, value: boolean) => void;
    setSavedTime: (videoId: string, time: number) => void;
}

export const useVideoUIStateStore = createStore<VideoUIStateData>({
    key: 'video-ui-state',
    label: 'Video UI State',
    creator: (set) => ({
        states: {},
        savedTimes: {},
        setState: (videoId, key, value) =>
            set((prev) => ({
                states: {
                    ...prev.states,
                    [videoId]: {
                        ...prev.states[videoId],
                        [key]: value,
                    },
                },
            })),
        setSavedTime: (videoId, time) =>
            set((prev) => ({
                savedTimes: {
                    ...prev.savedTimes,
                    [videoId]: time,
                },
            })),
    }),
    persistOptions: {
        partialize: (state) => ({ states: state.states, savedTimes: state.savedTimes }),
    },
});
