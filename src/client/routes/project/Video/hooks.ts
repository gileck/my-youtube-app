import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVideoDetails, getTranscript, getVideoSummary } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';
import { useSettingsStore } from '@/client/features/template/settings';
import type { AIActionType, GetVideoDetailsResponse, GetTranscriptResponse, GetVideoSummaryResponse, TranscriptSegment, ChapterWithContent } from '@/apis/project/youtube/types';

const TIMESTAMP_INTERVAL_SECONDS = 30;

function formatSeconds(s: number): string {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

function buildTimestampedTranscript(segments: TranscriptSegment[]): string {
    let lastMarker = -TIMESTAMP_INTERVAL_SECONDS;
    return segments.map(s => {
        if (s.start_seconds - lastMarker >= TIMESTAMP_INTERVAL_SECONDS) {
            lastMarker = s.start_seconds;
            return `\n[${formatSeconds(s.start_seconds)}] ${s.text}`;
        }
        return s.text;
    }).join(' ');
}

export function useVideoDetails(videoId: string) {
    const queryDefaults = useQueryDefaults();

    return useQuery({
        queryKey: ['youtube', 'video', videoId],
        queryFn: async (): Promise<GetVideoDetailsResponse> => {
            try {
                const response = await getVideoDetails({ videoId });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getVideoDetails', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('getVideoDetails', !!(error as Error & { _isRateLimited?: boolean })?._isRateLimited);
                throw error;
            }
        },
        enabled: !!videoId,
        ...queryDefaults,
    });
}

export function useTranscript(videoId: string) {
    const queryDefaults = useQueryDefaults();
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => ['youtube', 'transcript', videoId], [videoId]);

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<GetTranscriptResponse> => {
            try {
                const response = await getTranscript({ videoId });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getTranscript', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('getTranscript', !!(error as Error & { _isRateLimited?: boolean })?._isRateLimited);
                throw error;
            }
        },
        enabled: !!videoId,
        ...queryDefaults,
    });

    const hardRefresh = useCallback(async () => {
        queryClient.removeQueries({ queryKey });
        await queryClient.refetchQueries({ queryKey });
    }, [queryClient, queryKey]);

    return { ...query, hardRefresh };
}

function useVideoAIAction(actionType: AIActionType, videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, chapters: ChapterWithContent[] | undefined, description?: string) {
    const queryDefaults = useQueryDefaults();
    const queryClient = useQueryClient();
    const aiModel = useSettingsStore((s) => s.settings.aiModel);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral loading indicator
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isEnabled, setIsEnabled] = useVideoUIToggle(videoId, `aiAction:${actionType}`, false);

    const transcript = segments
        ? (actionType === 'topics'
            ? buildTimestampedTranscript(segments)
            : segments.map(s => s.text).join(' '))
        : '';
    const AI_OVERLAP_SECONDS = 5;
    const chapterData = useMemo(
        () => chapters?.map((c, i) => {
            const overlapStart = Math.max(0, c.startTime - AI_OVERLAP_SECONDS);
            const overlapEnd = (chapters[i + 1]?.startTime ?? c.endTime) + AI_OVERLAP_SECONDS;
            const aiSegments = segments?.filter(s =>
                s.start_seconds >= overlapStart && s.start_seconds < overlapEnd
            ) ?? c.segments;
            return {
                title: c.title,
                startTime: c.startTime,
                content: actionType === 'topics'
                    ? buildTimestampedTranscript(aiSegments)
                    : aiSegments.map(s => s.text).join(' '),
            };
        }),
        [chapters, segments, actionType]
    );
    const queryKey = ['youtube', actionType, videoId];

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            try {
                const response = await getVideoSummary({ videoId, transcript, title: title ?? '', chapters: chapterData, actionType, modelId: aiModel, description });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getVideoSummary', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('getVideoSummary', false);
                throw error;
            }
        },
        enabled: isEnabled && !!videoId && !!segments && segments.length > 0,
        ...queryDefaults,
    });

    const generate = useCallback(() => {
        setIsEnabled(true);
    }, [setIsEnabled]);

    const disable = useCallback(() => {
        setIsEnabled(false);
    }, [setIsEnabled]);

    const regenerate = useCallback(async () => {
        setIsRegenerating(true);
        queryClient.setQueryData(queryKey, undefined);
        try {
            const response = await getVideoSummary({ videoId, transcript, title: title ?? '', chapters: chapterData, bypassCache: true, actionType, modelId: aiModel, description });
            if (response.data?.error) {
                throw new Error(response.data.error);
            }
            recordApiCall('getVideoSummary', false);
            queryClient.setQueryData(queryKey, response.data);
        } catch {
            recordApiError('getVideoSummary', false);
        } finally {
            setIsRegenerating(false);
        }
    }, [videoId, transcript, title, queryClient, chapterData, actionType, aiModel, description]);

    return { ...query, isEnabled, generate, disable, isRegenerating, regenerate };
}

export function useVideoSummary(videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, chapters: ChapterWithContent[] | undefined) {
    return useVideoAIAction('summary', videoId, segments, title, chapters);
}

export function useVideoKeyPoints(videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, chapters: ChapterWithContent[] | undefined) {
    return useVideoAIAction('keypoints', videoId, segments, title, chapters);
}

export function useVideoTopics(videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, chapters: ChapterWithContent[] | undefined) {
    return useVideoAIAction('topics', videoId, segments, title, chapters);
}

export function useVideoExplain(videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, description: string | undefined, chapters: ChapterWithContent[] | undefined) {
    return useVideoAIAction('explain', videoId, segments, title, chapters, description);
}

export function useTopicExpansion(videoId: string, topicTitle: string, segments: TranscriptSegment[] | undefined, videoTitle: string | undefined, chapterSegments?: TranscriptSegment[], storeKey?: string) {
    const queryDefaults = useQueryDefaults();
    const aiModel = useSettingsStore((s) => s.settings.aiModel);
    const [storedEnabled, setStoredEnabled] = useVideoUIToggle(videoId, storeKey ?? '', false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral trigger flag
    const [localEnabled, setLocalEnabled] = useState(false);

    const isEnabled = storeKey ? storedEnabled : localEnabled;
    const setIsEnabled = storeKey ? setStoredEnabled : setLocalEnabled;

    const effectiveSegments = chapterSegments ?? segments;
    const transcript = effectiveSegments ? effectiveSegments.map(s => s.text).join(' ') : '';

    const query = useQuery({
        queryKey: ['youtube', 'topic-expand', videoId, topicTitle],
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            try {
                const response = await getVideoSummary({
                    videoId, transcript, title: videoTitle ?? '',
                    actionType: 'topic-expand', topicTitle, modelId: aiModel,
                });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getVideoSummary', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('getVideoSummary', false);
                throw error;
            }
        },
        enabled: isEnabled && !!videoId && !!effectiveSegments && effectiveSegments.length > 0,
        ...queryDefaults,
    });

    const expand = useCallback(() => { setIsEnabled(true); }, [setIsEnabled]);

    return { ...query, isExpanded: isEnabled, expand };
}

export function useSubtopicExpansion(videoId: string, subtopicTitle: string, chapterSegments: TranscriptSegment[] | undefined, startTime: number, endTime: number, videoTitle: string | undefined, storeKey?: string) {
    const queryDefaults = useQueryDefaults();
    const aiModel = useSettingsStore((s) => s.settings.aiModel);
    const [storedEnabled, setStoredEnabled] = useVideoUIToggle(videoId, storeKey ?? '', false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral trigger flag
    const [localEnabled, setLocalEnabled] = useState(false);

    const isEnabled = storeKey ? storedEnabled : localEnabled;
    const setIsEnabled = storeKey ? setStoredEnabled : setLocalEnabled;

    const transcript = useMemo(() => {
        if (!chapterSegments) return '';
        return chapterSegments
            .filter(s => s.start_seconds >= startTime && s.start_seconds < endTime)
            .map(s => s.text)
            .join(' ');
    }, [chapterSegments, startTime, endTime]);

    const query = useQuery({
        queryKey: ['youtube', 'subtopic-expand', videoId, subtopicTitle],
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            try {
                const response = await getVideoSummary({
                    videoId, transcript, title: videoTitle ?? '',
                    actionType: 'subtopic-expand', topicTitle: subtopicTitle, modelId: aiModel,
                });
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getVideoSummary', response.data?._isFromCache ?? false);
                return response.data;
            } catch (error) {
                recordApiError('getVideoSummary', false);
                throw error;
            }
        },
        enabled: isEnabled && !!videoId && !!transcript,
        ...queryDefaults,
    });

    const expand = useCallback(() => { setIsEnabled(true); }, [setIsEnabled]);

    return { ...query, isExpanded: isEnabled, expand };
}
