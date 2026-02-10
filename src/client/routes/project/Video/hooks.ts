import { useQuery } from '@tanstack/react-query';
import { getVideoDetails, getTranscript } from '@/apis/project/youtube/client';
import { useQueryDefaults } from '@/client/query/defaults';
import type { GetVideoDetailsResponse, GetTranscriptResponse } from '@/apis/project/youtube/types';

export function useVideoDetails(videoId: string) {
    const queryDefaults = useQueryDefaults();

    return useQuery({
        queryKey: ['youtube', 'video', videoId],
        queryFn: async (): Promise<GetVideoDetailsResponse> => {
            const response = await getVideoDetails({ videoId });
            if (response.data?.error) {
                throw new Error(response.data.error);
            }
            return response.data;
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
            const response = await getTranscript({ videoId });
            if (response.data?.error) {
                throw new Error(response.data.error);
            }
            return response.data;
        },
        enabled: !!videoId,
        ...queryDefaults,
    });
}
