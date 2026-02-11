import { Sparkles, ListChecks } from 'lucide-react';
import { useRouter } from '@/client/features';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { useVideoDetails, useTranscript, useVideoSummary, useVideoKeyPoints, useVideoTopics } from './hooks';
import { VideoPlayer, VideoInfo, VideoDetailSkeleton, TranscriptSection, ChaptersSection, AIActionSection, MainTopicsSection } from './components';

export const Video = () => {
    const { routeParams } = useRouter();
    const videoId = routeParams.videoId ?? '';

    const { data: detailsData, isLoading: detailsLoading, error: detailsError } = useVideoDetails(videoId);
    const { data: transcriptData, isLoading: transcriptLoading } = useTranscript(videoId);

    const video = detailsData?.video;
    const transcript = transcriptData?.result;

    const {
        data: summaryData,
        isEnabled: summaryEnabled,
        isLoading: summaryLoading,
        isRegenerating: summaryRegenerating,
        error: summaryError,
        generate: summaryGenerate,
        regenerate: summaryRegenerate,
    } = useVideoSummary(videoId, transcript?.transcript, video?.title, transcript?.chapters);

    const {
        data: keyPointsData,
        isEnabled: keyPointsEnabled,
        isLoading: keyPointsLoading,
        isRegenerating: keyPointsRegenerating,
        error: keyPointsError,
        generate: keyPointsGenerate,
        regenerate: keyPointsRegenerate,
    } = useVideoKeyPoints(videoId, transcript?.transcript, video?.title, transcript?.chapters);

    const {
        data: topicsData,
        isEnabled: topicsEnabled,
        isLoading: topicsLoading,
        isRegenerating: topicsRegenerating,
        error: topicsError,
        generate: topicsGenerate,
        regenerate: topicsRegenerate,
    } = useVideoTopics(videoId, transcript?.transcript, video?.title, transcript?.chapters);

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
                            <>
                                <AIActionSection
                                    title="AI Summary"
                                    icon={<Sparkles size={14} />}
                                    summary={summaryData?.summary}
                                    chapterSummaries={summaryData?.chapterSummaries}
                                    modelId={summaryData?.modelId}
                                    cost={summaryData?.cost}
                                    isFromCache={summaryData?._isFromCache}
                                    isEnabled={summaryEnabled}
                                    isLoading={summaryLoading}
                                    isRegenerating={summaryRegenerating}
                                    error={summaryError}
                                    onGenerate={summaryGenerate}
                                    onRegenerate={summaryRegenerate}
                                />
                                <AIActionSection
                                    title="Key Points"
                                    icon={<ListChecks size={14} />}
                                    summary={keyPointsData?.summary}
                                    chapterSummaries={keyPointsData?.chapterSummaries}
                                    modelId={keyPointsData?.modelId}
                                    cost={keyPointsData?.cost}
                                    isFromCache={keyPointsData?._isFromCache}
                                    isEnabled={keyPointsEnabled}
                                    isLoading={keyPointsLoading}
                                    isRegenerating={keyPointsRegenerating}
                                    error={keyPointsError}
                                    onGenerate={keyPointsGenerate}
                                    onRegenerate={keyPointsRegenerate}
                                />
                                <MainTopicsSection
                                    topics={topicsData?.topics}
                                    modelId={topicsData?.modelId}
                                    cost={topicsData?.cost}
                                    isFromCache={topicsData?._isFromCache}
                                    isEnabled={topicsEnabled}
                                    isLoading={topicsLoading}
                                    isRegenerating={topicsRegenerating}
                                    error={topicsError}
                                    onGenerate={topicsGenerate}
                                    onRegenerate={topicsRegenerate}
                                    videoId={videoId}
                                    segments={transcript?.transcript}
                                    videoTitle={video?.title}
                                    chapters={transcript?.chapters}
                                />
                            </>
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
