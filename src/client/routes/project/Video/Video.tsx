import { useRouter } from '@/client/features';
import { Button } from '@/client/components/template/ui/button';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { ArrowLeft } from 'lucide-react';
import { useVideoDetails, useTranscript } from './hooks';
import { VideoPlayer, VideoInfo, VideoDetailSkeleton, TranscriptSection, ChaptersSection } from './components';

export const Video = () => {
    const { routeParams, navigate } = useRouter();
    const videoId = routeParams.videoId ?? '';

    const { data: detailsData, isLoading: detailsLoading, error: detailsError } = useVideoDetails(videoId);
    const { data: transcriptData, isLoading: transcriptLoading } = useTranscript(videoId);

    const video = detailsData?.video;
    const transcript = transcriptData?.result;

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-1.5 mb-3 -ml-2"
            >
                <ArrowLeft size={16} />
                Back
            </Button>

            {detailsLoading && !video && <VideoDetailSkeleton />}

            {detailsError && (
                <div className="mt-6">
                    <ErrorDisplay error={detailsError} title="Failed to load video details" variant="inline" />
                </div>
            )}

            {video && (
                <>
                    <VideoPlayer videoId={videoId} />
                    <VideoInfo video={video} />

                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                        {transcriptLoading && (
                            <p className="text-xs text-muted-foreground animate-pulse">Loading transcript...</p>
                        )}

                        {transcript?.transcript && transcript.transcript.length > 0 && (
                            <TranscriptSection segments={transcript.transcript} />
                        )}

                        {transcript?.chapters && transcript.chapters.length > 0 && (
                            <ChaptersSection chapters={transcript.chapters} />
                        )}

                        {!transcriptLoading && transcript?.error && (
                            <p className="text-xs text-muted-foreground">
                                Transcript unavailable: {transcript.error}
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
