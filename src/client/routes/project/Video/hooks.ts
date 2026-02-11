import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVideoDetails, getTranscript, getVideoSummary } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
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

    return useQuery({
        queryKey: ['youtube', 'transcript', videoId],
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
}

function useVideoAIAction(actionType: AIActionType, videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, chapters: ChapterWithContent[] | undefined) {
    const queryDefaults = useQueryDefaults();
    const queryClient = useQueryClient();
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral loading indicator
    const [isRegenerating, setIsRegenerating] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral trigger flag
    const [isEnabled, setIsEnabled] = useState(false);

    const transcript = segments
        ? (actionType === 'topics'
            ? buildTimestampedTranscript(segments)
            : segments.map(s => s.text).join(' '))
        : '';
    const chapterData = useMemo(
        () => chapters?.map(c => ({
            title: c.title,
            startTime: c.startTime,
            content: actionType === 'topics'
                ? buildTimestampedTranscript(c.segments)
                : c.content,
        })),
        [chapters, actionType]
    );
    const queryKey = ['youtube', actionType, videoId];

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            try {
                const response = await getVideoSummary({ videoId, transcript, title: title ?? '', chapters: chapterData, actionType });
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
    }, []);

    const regenerate = useCallback(async () => {
        setIsRegenerating(true);
        queryClient.setQueryData(queryKey, undefined);
        try {
            const response = await getVideoSummary({ videoId, transcript, title: title ?? '', chapters: chapterData, bypassCache: true, actionType });
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
    }, [videoId, transcript, title, queryClient, chapterData, actionType]);

    return { ...query, isEnabled, generate, isRegenerating, regenerate };
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

export function useTopicExpansion(videoId: string, topicTitle: string, segments: TranscriptSegment[] | undefined, videoTitle: string | undefined) {
    const queryDefaults = useQueryDefaults();
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral trigger flag
    const [isEnabled, setIsEnabled] = useState(false);

    const transcript = segments ? segments.map(s => s.text).join(' ') : '';

    const query = useQuery({
        queryKey: ['youtube', 'topic-expand', videoId, topicTitle],
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            try {
                const response = await getVideoSummary({
                    videoId, transcript, title: videoTitle ?? '',
                    actionType: 'topic-expand', topicTitle,
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
        enabled: isEnabled && !!videoId && !!segments && segments.length > 0,
        ...queryDefaults,
    });

    const expand = useCallback(() => { setIsEnabled(true); }, []);

    return { ...query, isExpanded: isEnabled, expand };
}
