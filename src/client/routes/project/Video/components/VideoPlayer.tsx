import { useEffect, useRef, useCallback } from 'react';
import { useYouTubeIFrameAPI, useVideoPlayerStore, YTPlayerState } from '@/client/features/project/video-player';
import type { YTPlayerInstance } from '@/client/features/project/video-player';

interface VideoPlayerProps {
    videoId: string;
}

const POLL_INTERVAL = 500;

export const VideoPlayer = ({ videoId }: VideoPlayerProps) => {
    const isAPIReady = useYouTubeIFrameAPI();
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerIdRef = useRef(`yt-player-${videoId}`);

    const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
    const setIsPlayerReady = useVideoPlayerStore((s) => s.setIsPlayerReady);
    const setIsPlaying = useVideoPlayerStore((s) => s.setIsPlaying);
    const registerSeekFn = useVideoPlayerStore((s) => s._registerSeekFn);
    const unregisterSeekFn = useVideoPlayerStore((s) => s._unregisterSeekFn);
    const reset = useVideoPlayerStore((s) => s.reset);

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

    return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-foreground">
            <div id={containerIdRef.current} className="w-full h-full" />
        </div>
    );
};
