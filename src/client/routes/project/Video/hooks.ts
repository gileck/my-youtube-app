import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVideoDetails, getTranscript, getVideoSummary } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';
import { useSettingsStore } from '@/client/features/template/settings';
import { useAIOptionsStore } from '@/client/features/project/ai-options';
import type { AIActionType, AIOptions, GetVideoDetailsResponse, GetTranscriptResponse, GetVideoSummaryResponse, TranscriptSegment, ChapterWithContent } from '@/apis/project/youtube/types';

const TIMESTAMP_INTERVAL_SECONDS = 10;

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

const AI_OVERLAP_SECONDS = 5;

function buildChapterTranscript(
    actionType: AIActionType,
    chapter: ChapterWithContent,
    nextChapterStart: number | undefined,
    segments: TranscriptSegment[] | undefined,
) {
    const overlapStart = Math.max(0, chapter.startTime - AI_OVERLAP_SECONDS);
    const overlapEnd = (nextChapterStart ?? chapter.endTime) + AI_OVERLAP_SECONDS;
    const aiSegments = segments?.filter(s =>
        s.start_seconds >= overlapStart && s.start_seconds < overlapEnd
    ) ?? chapter.segments;
    return (actionType === 'topics' || actionType === 'explain' || actionType === 'deep-explain')
        ? buildTimestampedTranscript(aiSegments)
        : aiSegments.map(s => s.text).join(' ');
}

function useAIOptions(): AIOptions {
    const length = useAIOptionsStore((s) => s.options.aiLength);
    const level = useAIOptionsStore((s) => s.options.aiLevel);
    const style = useAIOptionsStore((s) => s.options.aiStyle);
    return useMemo(() => ({ length, level, style }), [length, level, style]);
}

function optionsCacheSegment(options: AIOptions): string {
    const parts: string[] = [];
    if (options.length !== 'medium') parts.push(options.length ?? '');
    if (options.level !== 'intermediate') parts.push(options.level ?? '');
    if (options.style !== 'conversational') parts.push(options.style ?? '');
    return parts.filter(Boolean).join(':') || 'default';
}

function useVideoAIAction(actionType: AIActionType, videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, chapters: ChapterWithContent[] | undefined, description?: string) {
    const queryDefaults = useQueryDefaults();
    const queryClient = useQueryClient();
    const aiModel = useSettingsStore((s) => s.settings.aiModel);
    const aiOptions = useAIOptions();
    const optsSeg = optionsCacheSegment(aiOptions);
    const [isEnabled, setIsEnabled] = useVideoUIToggle(videoId, `aiAction:${actionType}:${aiModel}:${optsSeg}`, false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral counter to trigger bypass cache on regenerate
    const [regenVersion, setRegenVersion] = useState(0);

    const transcript = segments
        ? ((actionType === 'topics' || actionType === 'explain' || actionType === 'deep-explain')
            ? buildTimestampedTranscript(segments)
            : segments.map(s => s.text).join(' '))
        : '';
    const chapterData = useMemo(
        () => chapters?.map((c, i) => ({
            title: c.title,
            startTime: c.startTime,
            content: buildChapterTranscript(actionType, c, chapters[i + 1]?.startTime, segments),
        })),
        [chapters, segments, actionType]
    );

    // Auto-load: check S3 cache on mount (cacheOnly, no generation)
    const cacheCheckKey = useMemo(() => ['youtube', actionType, videoId, aiModel, optsSeg, 'cacheCheck'], [actionType, videoId, aiModel, optsSeg]);
    const cacheCheck = useQuery({
        queryKey: cacheCheckKey,
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            try {
                const response = await getVideoSummary({ videoId, transcript, title: title ?? '', actionType, modelId: aiModel, description, aiOptions, cacheOnly: true });
                return response.data;
            } catch {
                return { _noCache: true };
            }
        },
        enabled: !!videoId && !!segments && segments.length > 0,
        ...queryDefaults,
        staleTime: 60_000,
    });

    const hasCachedData = cacheCheck.data && !cacheCheck.data._noCache && !cacheCheck.data.error;

    // Main query: fires when explicitly enabled OR when cache was found
    const queryKey = useMemo(() => ['youtube', actionType, videoId, aiModel, optsSeg], [actionType, videoId, aiModel, optsSeg]);

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            const bypassCache = regenVersion > 0;
            try {
                const response = await getVideoSummary({ videoId, transcript, title: title ?? '', actionType, modelId: aiModel, description, aiOptions, bypassCache });
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
        enabled: (isEnabled || !!hasCachedData) && !!videoId && !!segments && segments.length > 0,
        ...(hasCachedData ? { initialData: cacheCheck.data! } : {}),
        ...queryDefaults,
    });

    const generate = useCallback(() => {
        setIsEnabled(true);
    }, [setIsEnabled]);

    const disable = useCallback(() => {
        setIsEnabled(false);
    }, [setIsEnabled]);

    const regenerate = useCallback(() => {
        setRegenVersion(v => v + 1);
        queryClient.removeQueries({ queryKey: ['youtube', actionType, videoId, 'chapter', aiModel, optsSeg] });
        queryClient.setQueryData(queryKey, undefined);
        queryClient.refetchQueries({ queryKey });
    }, [queryClient, queryKey, actionType, videoId, aiModel, optsSeg]);

    const effectiveEnabled = isEnabled || !!hasCachedData;

    return { ...query, isEnabled: effectiveEnabled, generate, disable, regenerate, chapterData, regenVersion };
}

export function useChapterAIAction(
    actionType: AIActionType,
    videoId: string,
    chapterTitle: string,
    chapterContent: string,
    videoTitle: string,
    enabled: boolean,
    description?: string,
    bypassCache?: boolean,
) {
    const queryDefaults = useQueryDefaults();
    const queryClient = useQueryClient();
    const aiModel = useSettingsStore((s) => s.settings.aiModel);
    const aiOptions = useAIOptions();
    const optsSeg = optionsCacheSegment(aiOptions);
    const bypassRef = useRef(bypassCache ?? false);
    if (bypassCache) bypassRef.current = true;
    const queryKey = useMemo(() => ['youtube', actionType, videoId, 'chapter', aiModel, optsSeg, chapterTitle], [actionType, videoId, aiModel, optsSeg, chapterTitle]);

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<GetVideoSummaryResponse & { _duration?: number }> => {
            const shouldBypass = bypassRef.current;
            bypassRef.current = false;
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out — try regenerating')), 120_000)
            );
            const start = Date.now();
            try {
                const response = await Promise.race([
                    getVideoSummary({
                        videoId,
                        transcript: chapterContent,
                        title: videoTitle,
                        actionType,
                        modelId: aiModel,
                        chapterTitle,
                        description,
                        aiOptions,
                        bypassCache: shouldBypass,
                    }),
                    timeout,
                ]);
                if (response.data?.error) {
                    throw new Error(response.data.error);
                }
                recordApiCall('getVideoSummary', response.data?._isFromCache ?? false);
                return { ...response.data, _duration: Date.now() - start };
            } catch (error) {
                recordApiError('getVideoSummary', false);
                throw error;
            }
        },
        enabled: enabled && !!chapterContent,
        retry: 1,
        ...queryDefaults,
    });

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral loading indicator for chapter regeneration
    const [isRegenerating, setIsRegenerating] = useState(false);

    const regenerate = useCallback(async () => {
        setIsRegenerating(true);
        queryClient.setQueryData(queryKey, undefined);
        try {
            const response = await getVideoSummary({
                videoId,
                transcript: chapterContent,
                title: videoTitle,
                actionType,
                modelId: aiModel,
                chapterTitle,
                description,
                aiOptions,
                bypassCache: true,
            });
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
    }, [queryClient, queryKey, videoId, chapterContent, videoTitle, actionType, aiModel, chapterTitle, description, aiOptions]);

    return { ...query, isRegenerating, regenerate };
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

export function useVideoDeepExplain(videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined, description: string | undefined, chapters: ChapterWithContent[] | undefined) {
    return useVideoAIAction('deep-explain', videoId, segments, title, chapters, description);
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
