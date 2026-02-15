import { Sparkles, ListChecks, FileText, LayoutList, MessageCircleQuestion } from 'lucide-react';
import { useRouter } from '@/client/features';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { Button } from '@/client/components/template/ui/button';
import { useAddToHistory } from '@/client/features/project/history';
import { useVideoDetails, useTranscript, useVideoSummary, useVideoKeyPoints, useVideoTopics, useVideoExplain } from './hooks';
import { VideoPlayer, VideoInfo, VideoDetailSkeleton, TranscriptSection, ChaptersSection, AIActionSection, MainTopicsSection, ExplainSection } from './components';

export const Video = () => {
    const { routeParams } = useRouter();
    const videoId = routeParams.videoId ?? '';

    const { data: detailsData, isLoading: detailsLoading, error: detailsError } = useVideoDetails(videoId);
    const { data: transcriptData, isLoading: transcriptLoading, error: transcriptError, hardRefresh: refreshTranscript } = useTranscript(videoId);

    const video = detailsData?.video;
    useAddToHistory(video);
    const transcript = transcriptData?.result;

    const {
        data: summaryData,
        isEnabled: summaryEnabled,
        isLoading: summaryLoading,
        isRegenerating: summaryRegenerating,
        error: summaryError,
        generate: summaryGenerate,
        disable: summaryDisable,
        regenerate: summaryRegenerate,
    } = useVideoSummary(videoId, transcript?.transcript, video?.title, transcript?.chapters);

    const {
        data: keyPointsData,
        isEnabled: keyPointsEnabled,
        isLoading: keyPointsLoading,
        isRegenerating: keyPointsRegenerating,
        error: keyPointsError,
        generate: keyPointsGenerate,
        disable: keyPointsDisable,
        regenerate: keyPointsRegenerate,
    } = useVideoKeyPoints(videoId, transcript?.transcript, video?.title, transcript?.chapters);

    const {
        data: topicsData,
        isEnabled: topicsEnabled,
        isLoading: topicsLoading,
        isRegenerating: topicsRegenerating,
        error: topicsError,
        generate: topicsGenerate,
        disable: topicsDisable,
        regenerate: topicsRegenerate,
    } = useVideoTopics(videoId, transcript?.transcript, video?.title, transcript?.chapters);

    const {
        data: explainData,
        isEnabled: explainEnabled,
        isLoading: explainLoading,
        isRegenerating: explainRegenerating,
        error: explainError,
        generate: explainGenerate,
        disable: explainDisable,
        regenerate: explainRegenerate,
    } = useVideoExplain(videoId, transcript?.transcript, video?.title, video?.description, transcript?.chapters);

    const hasTranscript = transcript?.transcript && transcript.transcript.length > 0;
    const hasChapters = transcript?.chapters && transcript.chapters.length > 0;
    const anyAIEnabled = summaryEnabled || keyPointsEnabled || topicsEnabled || explainEnabled;

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

                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                        {hasTranscript && (
                            <div className="rounded-lg border border-border p-3">
                                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <Sparkles size={14} className="text-primary" />
                                    AI Analysis
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button variant={summaryEnabled ? "default" : "outline"} size="sm" className="gap-1.5 rounded-full" onClick={summaryEnabled ? summaryDisable : summaryGenerate}>
                                        <Sparkles size={14} />
                                        Summary
                                    </Button>
                                    <Button variant={keyPointsEnabled ? "default" : "outline"} size="sm" className="gap-1.5 rounded-full" onClick={keyPointsEnabled ? keyPointsDisable : keyPointsGenerate}>
                                        <ListChecks size={14} />
                                        Key Points
                                    </Button>
                                    <Button variant={topicsEnabled ? "default" : "outline"} size="sm" className="gap-1.5 rounded-full" onClick={topicsEnabled ? topicsDisable : topicsGenerate}>
                                        <LayoutList size={14} />
                                        Main Topics
                                    </Button>
                                    <Button variant={explainEnabled ? "default" : "outline"} size="sm" className="gap-1.5 rounded-full" onClick={explainEnabled ? explainDisable : explainGenerate}>
                                        <MessageCircleQuestion size={14} />
                                        Explain
                                    </Button>
                                </div>

                                {anyAIEnabled && (
                                    <div className="mt-3 space-y-2">
                                        {summaryEnabled && (
                                            <AIActionSection
                                                title="AI Summary"
                                                icon={<Sparkles size={14} />}
                                                summary={summaryData?.summary}
                                                chapterSummaries={summaryData?.chapterSummaries}
                                                modelId={summaryData?.modelId}
                                                cost={summaryData?.cost}
                                                isFromCache={summaryData?._isFromCache}
                                                isLoading={summaryLoading}
                                                isRegenerating={summaryRegenerating}
                                                error={summaryError}
                                                onRegenerate={summaryRegenerate}
                                                videoId={videoId}
                                                sectionKey="aiSummary"
                                            />
                                        )}
                                        {keyPointsEnabled && (
                                            <AIActionSection
                                                title="Key Points"
                                                icon={<ListChecks size={14} />}
                                                summary={keyPointsData?.summary}
                                                chapterSummaries={keyPointsData?.chapterSummaries}
                                                modelId={keyPointsData?.modelId}
                                                cost={keyPointsData?.cost}
                                                isFromCache={keyPointsData?._isFromCache}
                                                isLoading={keyPointsLoading}
                                                isRegenerating={keyPointsRegenerating}
                                                error={keyPointsError}
                                                onRegenerate={keyPointsRegenerate}
                                                videoId={videoId}
                                                sectionKey="keyPoints"
                                            />
                                        )}
                                        {topicsEnabled && (
                                            <MainTopicsSection
                                                topics={topicsData?.topics}
                                                modelId={topicsData?.modelId}
                                                cost={topicsData?.cost}
                                                isFromCache={topicsData?._isFromCache}
                                                isLoading={topicsLoading}
                                                isRegenerating={topicsRegenerating}
                                                error={topicsError}
                                                onRegenerate={topicsRegenerate}
                                                videoId={videoId}
                                                segments={transcript?.transcript}
                                                videoTitle={video?.title}
                                                chapters={transcript?.chapters}
                                            />
                                        )}
                                        {explainEnabled && (
                                            <ExplainSection
                                                summary={explainData?.summary}
                                                chapterSummaries={explainData?.chapterSummaries}
                                                modelId={explainData?.modelId}
                                                cost={explainData?.cost}
                                                isFromCache={explainData?._isFromCache}
                                                isLoading={explainLoading}
                                                isRegenerating={explainRegenerating}
                                                error={explainError}
                                                onRegenerate={explainRegenerate}
                                                videoId={videoId}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {transcriptLoading && (
                            <p className="text-xs text-muted-foreground animate-pulse">Loading transcript...</p>
                        )}

                        {(hasTranscript || hasChapters) && (
                            <div className="rounded-lg border border-border p-3">
                                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <FileText size={14} className="text-primary" />
                                    Video Content
                                </div>
                                <div className="space-y-2">
                                    {hasTranscript && (
                                        <TranscriptSection segments={transcript.transcript} onRefresh={refreshTranscript} />
                                    )}
                                    {hasChapters && (
                                        <ChaptersSection chapters={transcript.chapters} videoId={videoId} onRefresh={refreshTranscript} />
                                    )}
                                </div>
                            </div>
                        )}

                        {!transcriptLoading && transcriptError && (
                            <ErrorDisplay error={transcriptError} title="Transcript unavailable" variant="inline" />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
