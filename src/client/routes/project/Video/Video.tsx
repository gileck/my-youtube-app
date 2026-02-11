import { useRouter } from '@/client/features';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { useVideoDetails, useTranscript, useVideoSummary } from './hooks';
import { VideoPlayer, VideoInfo, VideoDetailSkeleton, TranscriptSection, ChaptersSection, AISummarySection } from './components';

export const Video = () => {
    const { routeParams } = useRouter();
    const videoId = routeParams.videoId ?? '';

    const { data: detailsData, isLoading: detailsLoading, error: detailsError } = useVideoDetails(videoId);
    const { data: transcriptData, isLoading: transcriptLoading } = useTranscript(videoId);

    const video = detailsData?.video;
    const transcript = transcriptData?.result;

    const {
        data: summaryData,
        isLoading: summaryLoading,
        isRegenerating,
        error: summaryError,
        regenerate,
    } = useVideoSummary(videoId, transcript?.transcript, video?.title);

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
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
                        {transcript?.transcript && transcript.transcript.length > 0 && (
                            <AISummarySection
                                summary={summaryData?.summary}
                                modelId={summaryData?.modelId}
                                cost={summaryData?.cost}
                                isFromCache={summaryData?._isFromCache}
                                isLoading={summaryLoading}
                                isRegenerating={isRegenerating}
                                error={summaryError}
                                onRegenerate={regenerate}
                            />
                        )}

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
