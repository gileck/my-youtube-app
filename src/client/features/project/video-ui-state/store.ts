import { createStore } from '@/client/stores';

interface VideoUIStateData {
    states: Record<string, Record<string, boolean>>;
    savedTimes: Record<string, number>;
    savedPlaying: Record<string, boolean>;
    activeTab: Record<string, string>;
    setState: (videoId: string, key: string, value: boolean) => void;
    setSavedTime: (videoId: string, time: number) => void;
    setSavedPlaying: (videoId: string, playing: boolean) => void;
    setActiveTab: (videoId: string, tab: string) => void;
}

export const useVideoUIStateStore = createStore<VideoUIStateData>({
    key: 'video-ui-state',
    label: 'Video UI State',
    creator: (set) => ({
        states: {},
        savedTimes: {},
        savedPlaying: {},
        activeTab: {},
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
        setSavedPlaying: (videoId, playing) =>
            set((prev) => ({
                savedPlaying: {
                    ...prev.savedPlaying,
                    [videoId]: playing,
                },
            })),
        setActiveTab: (videoId, tab) =>
            set((prev) => ({
                activeTab: {
                    ...prev.activeTab,
                    [videoId]: tab,
                },
            })),
    }),
    persistOptions: {
        partialize: (state) => ({ states: state.states, savedTimes: state.savedTimes, savedPlaying: state.savedPlaying, activeTab: state.activeTab }),
    },
});
