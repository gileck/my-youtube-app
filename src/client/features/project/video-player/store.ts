import { createStore } from '@/client/stores';

type SeekFn = (seconds: number) => void;

interface VideoPlayerState {
    currentTime: number;
    isPlayerReady: boolean;
    isPlaying: boolean;
    _seekFn: SeekFn | null;
    setCurrentTime: (time: number) => void;
    setIsPlayerReady: (ready: boolean) => void;
    setIsPlaying: (playing: boolean) => void;
    seekTo: (seconds: number) => void;
    _registerSeekFn: (fn: SeekFn) => void;
    _unregisterSeekFn: () => void;
    reset: () => void;
}

export const useVideoPlayerStore = createStore<VideoPlayerState>({
    key: 'video-player',
    label: 'Video Player',
    inMemoryOnly: true,
    creator: (set, get) => ({
        currentTime: 0,
        isPlayerReady: false,
        isPlaying: false,
        _seekFn: null,

        setCurrentTime: (time) => set({ currentTime: time }),
        setIsPlayerReady: (ready) => set({ isPlayerReady: ready }),
        setIsPlaying: (playing) => set({ isPlaying: playing }),

        seekTo: (seconds) => {
            const fn = get()._seekFn;
            if (fn) {
                fn(seconds);
                set({ currentTime: seconds });
            }
        },

        _registerSeekFn: (fn) => set({ _seekFn: fn }),
        _unregisterSeekFn: () => set({ _seekFn: null }),

        reset: () =>
            set({
                currentTime: 0,
                isPlayerReady: false,
                isPlaying: false,
                _seekFn: null,
            }),
    }),
});
