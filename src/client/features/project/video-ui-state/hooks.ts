import { useCallback } from 'react';
import { useVideoUIStateStore } from './store';

export function useVideoUIToggle(
    videoId: string,
    key: string,
    defaultValue: boolean
): [boolean, (v: boolean) => void] {
    const value = useVideoUIStateStore(
        (s) => s.states[videoId]?.[key] ?? defaultValue
    );
    const setStoreState = useVideoUIStateStore((s) => s.setState);

    const setValue = useCallback(
        (v: boolean) => setStoreState(videoId, key, v),
        [setStoreState, videoId, key]
    );

    return [value, setValue];
}
