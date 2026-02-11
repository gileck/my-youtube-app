export interface YTPlayerVars {
    autoplay?: 0 | 1;
    start?: number;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
}

export interface YTPlayerEvents {
    onReady?: (event: { target: YTPlayerInstance }) => void;
    onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
    onError?: (event: { data: number }) => void;
}

export interface YTPlayerOptions {
    videoId: string;
    playerVars?: YTPlayerVars;
    events?: YTPlayerEvents;
}

export interface YTPlayerInstance {
    getCurrentTime(): number;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    playVideo(): void;
    pauseVideo(): void;
    destroy(): void;
    getPlayerState(): number;
}

export const YTPlayerState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
} as const;

declare global {
    interface Window {
        YT?: {
            Player: new (elementId: string, options: YTPlayerOptions) => YTPlayerInstance;
            PlayerState: typeof YTPlayerState;
        };
        onYouTubeIframeAPIReady?: () => void;
    }
}
