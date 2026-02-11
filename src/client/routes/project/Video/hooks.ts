import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVideoDetails, getTranscript, getVideoSummary } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import { recordApiCall, recordApiError } from '@/client/features/project/cache-stats';
import type { GetVideoDetailsResponse, GetTranscriptResponse, GetVideoSummaryResponse, TranscriptSegment } from '@/apis/project/youtube/types';

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

export function useVideoSummary(videoId: string, segments: TranscriptSegment[] | undefined, title: string | undefined) {
    const queryDefaults = useQueryDefaults();
    const queryClient = useQueryClient();
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral loading indicator
    const [isRegenerating, setIsRegenerating] = useState(false);

    const transcript = segments ? segments.map(s => s.text).join(' ') : '';
    const queryKey = ['youtube', 'summary', videoId];

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<GetVideoSummaryResponse> => {
            try {
                const response = await getVideoSummary({ videoId, transcript, title: title ?? '' });
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
        enabled: !!videoId && !!segments && segments.length > 0,
        ...queryDefaults,
    });

    const regenerate = useCallback(async () => {
        setIsRegenerating(true);
        try {
            const response = await getVideoSummary({ videoId, transcript, title: title ?? '', bypassCache: true });
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
    }, [videoId, transcript, title, queryClient]);

    return { ...query, isRegenerating, regenerate };
}
