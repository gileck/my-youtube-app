import { useEffect, useRef, useCallback, useState } from 'react';
import { X, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { useYouTubeIFrameAPI, useVideoPlayerStore, YTPlayerState } from '@/client/features/project/video-player';
import type { YTPlayerInstance } from '@/client/features/project/video-player';
import { useVideoUIStateStore } from '@/client/features/project/video-ui-state';

interface VideoPlayerProps {
    videoId: string;
}

const POLL_INTERVAL = 500;

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const VideoPlayer = ({ videoId }: VideoPlayerProps) => {
    const isAPIReady = useYouTubeIFrameAPI();
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerIdRef = useRef(`yt-player-${videoId}`);
    const sentinelRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for mini player visibility
    const [isOutOfView, setIsOutOfView] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for mini player dismiss
    const [isDismissed, setIsDismissed] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle for mini player minimized mode
    const [isMinimized, setIsMinimized] = useState(false);

    const currentTime = useVideoPlayerStore((s) => s.currentTime);
    const isPlaying = useVideoPlayerStore((s) => s.isPlaying);
    const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
    const setIsPlayerReady = useVideoPlayerStore((s) => s.setIsPlayerReady);
    const setIsPlaying = useVideoPlayerStore((s) => s.setIsPlaying);
    const registerSeekFn = useVideoPlayerStore((s) => s._registerSeekFn);
    const unregisterSeekFn = useVideoPlayerStore((s) => s._unregisterSeekFn);
    const reset = useVideoPlayerStore((s) => s.reset);

    const savedTime = useVideoUIStateStore((s) => s.savedTimes[videoId] ?? 0);
    const setSavedTime = useVideoUIStateStore((s) => s.setSavedTime);
    const savedTimeRef = useRef(savedTime);

    const startPolling = useCallback(() => {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(() => {
            const player = playerRef.current;
            if (player) {
                setCurrentTime(player.getCurrentTime());
            }
        }, POLL_INTERVAL);
    }, [setCurrentTime]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isAPIReady || !window.YT) return;

        containerIdRef.current = `yt-player-${videoId}`;

        const player = new window.YT.Player(containerIdRef.current, {
            videoId,
            playerVars: { playsinline: 1, rel: 0 },
            events: {
                onReady: ({ target }) => {
                    playerRef.current = target;
                    registerSeekFn((seconds: number) => target.seekTo(seconds, true));
                    setIsPlayerReady(true);
                    if (savedTimeRef.current > 0) {
                        target.seekTo(savedTimeRef.current, true);
                        setCurrentTime(savedTimeRef.current);
                    }
                },
                onStateChange: ({ data }) => {
                    const playing = data === YTPlayerState.PLAYING;
                    setIsPlaying(playing);
                    if (playing) {
                        startPolling();
                    } else {
                        stopPolling();
                        if (playerRef.current) {
                            setCurrentTime(playerRef.current.getCurrentTime());
                        }
                    }
                },
            },
        });

        return () => {
            stopPolling();
            unregisterSeekFn();
            reset();
            player.destroy();
            playerRef.current = null;
        };
    }, [isAPIReady, videoId, registerSeekFn, unregisterSeekFn, setIsPlayerReady, setIsPlaying, setCurrentTime, startPolling, stopPolling, reset]);

    // Persist current playback time every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const player = playerRef.current;
            if (player) {
                const time = player.getCurrentTime();
                if (time > 0) {
                    setSavedTime(videoId, time);
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [videoId, setSavedTime]);

    // Save time on unmount
    useEffect(() => {
        return () => {
            const player = playerRef.current;
            if (player) {
                try {
                    const time = player.getCurrentTime();
                    if (time > 0) setSavedTime(videoId, time);
                } catch {
                    // player may already be destroyed
                }
            }
        };
    }, [videoId, setSavedTime]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsOutOfView(!entry.isIntersecting),
            { threshold: 0.5 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    // Reset dismissed state when user scrolls back to the player
    useEffect(() => {
        if (!isOutOfView) {
            setIsDismissed(false);
        }
    }, [isOutOfView]);

    const showMini = isOutOfView && !isDismissed;

    const togglePlayPause = () => {
        const player = playerRef.current;
        if (!player) return;
        if (isPlaying) player.pauseVideo();
        else player.playVideo();
    };

    return (
        <div ref={sentinelRef} className="aspect-video w-full">
            {/* Minimized compact bar */}
            {showMini && isMinimized && (
                <div className="!fixed bottom-20 sm:bottom-4 right-2 sm:right-4 z-50 flex items-center gap-3 sm:gap-2 rounded-lg bg-card px-4 sm:px-3 py-3 sm:py-2 shadow-2xl border border-border">
                    <button onClick={togglePlayPause} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-foreground hover:text-primary">
                        {isPlaying ? <Pause className="size-5 sm:size-4" /> : <Play className="size-5 sm:size-4" />}
                    </button>
                    <span className="text-sm sm:text-xs text-muted-foreground tabular-nums">{formatTimestamp(currentTime)}</span>
                    <button onClick={() => setIsMinimized(false)} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <ChevronUp className="size-5 sm:size-3.5" />
                    </button>
                    <button onClick={() => setIsDismissed(true)} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <X className="size-5 sm:size-3.5" />
                    </button>
                </div>
            )}
            {/* Video player container */}
            <div className={`[&_iframe]:!w-full [&_iframe]:!h-full ${
                showMini
                    ? `!fixed bottom-20 sm:bottom-4 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-80 aspect-video shadow-2xl rounded-lg overflow-hidden ${isMinimized ? 'invisible' : ''}`
                    : 'relative w-full h-full overflow-hidden rounded-lg bg-foreground'
            }`}>
                <div className={`absolute top-2 right-2 sm:top-1 sm:right-1 z-10 flex items-center gap-2 sm:gap-1 ${showMini && !isMinimized ? '' : 'hidden'}`}>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="rounded-full bg-black/60 p-2 sm:p-1 text-white hover:bg-black/80"
                    >
                        <ChevronDown className="size-5 sm:size-3.5" />
                    </button>
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="rounded-full bg-black/60 p-2 sm:p-1 text-white hover:bg-black/80"
                    >
                        <X className="size-5 sm:size-3.5" />
                    </button>
                </div>
                <div id={containerIdRef.current} className="w-full h-full" />
            </div>
        </div>
    );
};
