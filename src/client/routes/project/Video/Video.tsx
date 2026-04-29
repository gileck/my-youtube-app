import { useMemo, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, ListChecks, FileText, BookOpen, BookOpenText, RefreshCw, Settings2 } from 'lucide-react';
import { useRouter } from '@/client/features';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { Button } from '@/client/components/template/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/client/components/template/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/client/components/template/ui/select';
import type { AILength, AILevel, AIStyle } from '@/apis/project/youtube/types';
import { getModelsByTier } from '@/common/ai/models';
import { useSettingsStore, useIsAdmin } from '@/client/features';
import { useAIOptionsStore } from '@/client/features/project/ai-options';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/client/components/project/tabs';
import { useAddToHistory } from '@/client/features/project/history';
import { useVideoUIStateStore } from '@/client/features/project/video-ui-state';
import { useVideoDetails, useTranscript, useVideoExplain, useVideoDeepExplain } from './hooks';
import { VideoPlayer, VideoInfo, VideoDetailSkeleton, TranscriptSection, ChaptersSection, ExplainSection, DeepExplainSection } from './components';

function useCachedModels(actionType: string, videoId: string) {
    const queryClient = useQueryClient();
    const cache = queryClient.getQueryCache();
    const prevRef = useRef('');
    const resultRef = useRef<string[]>([]);
    const subscribe = useMemo(() => (cb: () => void) => cache.subscribe(cb), [cache]);
    const getSnapshot = useMemo(() => () => {
        const queries = cache.findAll({ queryKey: ['youtube', actionType, videoId] });
        const models = new Set<string>();
        for (const q of queries) {
            const key = q.queryKey as string[];
            if (key.length >= 4 && key[3] && key[3] !== 'chapter' && q.state.data) {
                models.add(key[3]);
            }
        }
        const sorted = Array.from(models).sort();
        const key = sorted.join(',');
        if (key !== prevRef.current) {
            prevRef.current = key;
            resultRef.current = sorted;
        }
        return resultRef.current;
    }, [cache, actionType, videoId]);
    return useSyncExternalStore(subscribe, getSnapshot);
}

function ModelPicker({ actionType, videoId }: { actionType: string; videoId: string }) {
    const aiModel = useSettingsStore((s) => s.settings.aiModel);
    const updateSettings = useSettingsStore((s) => s.updateSettings);
    const isAdmin = useIsAdmin();
    const groupedModels = useMemo(() => getModelsByTier(), []);
    const cachedModels = useCachedModels(actionType, videoId);

    return (
        <Select value={aiModel} onValueChange={(value) => updateSettings({ aiModel: value })}>
            <SelectTrigger className="h-6 min-w-[120px] w-auto gap-1 border-none bg-transparent px-1.5 text-xs text-muted-foreground hover:text-foreground shadow-none">
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
                {groupedModels.map(({ tier, models }) => (
                    <SelectGroup key={tier}>
                        <SelectLabel>{tier}{!isAdmin && tier !== 'Budget' ? ' (Admin only)' : ''}</SelectLabel>
                        {models.map((model) => (
                            <SelectItem key={model.id} value={model.id} disabled={!isAdmin && tier !== 'Budget'}>
                                {model.name}{cachedModels.includes(model.id) ? ' ✓' : ''}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
    );
}

const LENGTH_OPTIONS: { value: AILength; label: string }[] = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
];

const LEVEL_OPTIONS: { value: AILevel; label: string }[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];

const STYLE_OPTIONS: { value: AIStyle; label: string }[] = [
    { value: 'conversational', label: 'Conversational' },
    { value: 'educational', label: 'Educational' },
    { value: 'professional', label: 'Professional' },
];

function OptionRow({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex gap-1">
                {options.map(opt => (
                    <Button
                        key={opt.value}
                        variant={value === opt.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 flex-1 min-w-0 text-xs truncate"
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

function AIOptionsButton({ onGenerate }: { onGenerate: () => void }) {
    const options = useAIOptionsStore((s) => s.options);
    const update = useAIOptionsStore((s) => s.updateOptions);
    const isDefault = options.aiLength === 'medium' && options.aiLevel === 'intermediate' && options.aiStyle === 'conversational';

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 relative">
                    <Settings2 size={14} />
                    {!isDefault && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base">AI Options</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <OptionRow label="Length" value={options.aiLength} options={LENGTH_OPTIONS} onChange={(v) => update({ aiLength: v as AILength })} />
                    <OptionRow label="Level" value={options.aiLevel} options={LEVEL_OPTIONS} onChange={(v) => update({ aiLevel: v as AILevel })} />
                    <OptionRow label="Style" value={options.aiStyle} options={STYLE_OPTIONS} onChange={(v) => update({ aiStyle: v as AIStyle })} />
                    <DialogTrigger asChild>
                        <Button className="w-full" onClick={onGenerate}>
                            Generate
                        </Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AIActionHeader({ actionType, videoId, cost, isFromCache, isLoading, onRegenerate, onGenerate }: {
    actionType: string; videoId: string; cost?: { totalCost: number }; isFromCache?: boolean; isLoading: boolean; onRegenerate: () => void; onGenerate: () => void;
}) {
    return (
        <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ModelPicker actionType={actionType} videoId={videoId} />
                {cost && <span>${cost.totalCost.toFixed(4)}</span>}
                {!isLoading && isFromCache != null && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                        {isFromCache ? 'Cached' : 'Fresh'}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1">
                <AIOptionsButton onGenerate={onGenerate} />
                <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isLoading} className="h-7 w-7 p-0">
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </Button>
            </div>
        </div>
    );
}

function EmptyAITab({ label, onGenerate }: { label: string; onGenerate: () => void }) {
    const options = useAIOptionsStore((s) => s.options);
    const update = useAIOptionsStore((s) => s.updateOptions);

    return (
        <Dialog>
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
                <p className="text-sm">Tap to generate {label}</p>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        Generate
                    </Button>
                </DialogTrigger>
            </div>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base">AI Options</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <OptionRow label="Length" value={options.aiLength} options={LENGTH_OPTIONS} onChange={(v) => update({ aiLength: v as AILength })} />
                    <OptionRow label="Level" value={options.aiLevel} options={LEVEL_OPTIONS} onChange={(v) => update({ aiLevel: v as AILevel })} />
                    <OptionRow label="Style" value={options.aiStyle} options={STYLE_OPTIONS} onChange={(v) => update({ aiStyle: v as AIStyle })} />
                    <DialogTrigger asChild>
                        <Button className="w-full" onClick={onGenerate}>
                            Generate {label}
                        </Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const Video = () => {
    const { routeParams } = useRouter();
    const videoId = routeParams.videoId ?? '';

    const activeTab = useVideoUIStateStore((s) => s.activeTab[videoId] ?? 'ai');
    const activeAITab = useVideoUIStateStore((s) => s.activeTab[videoId + ':ai'] ?? 'explain');
    const setActiveTab = useVideoUIStateStore((s) => s.setActiveTab);

    const { data: detailsData, isLoading: detailsLoading, error: detailsError } = useVideoDetails(videoId);
    const { data: transcriptData, isLoading: transcriptLoading, error: transcriptError, hardRefresh: refreshTranscript } = useTranscript(videoId);

    const video = detailsData?.video;
    useAddToHistory(video);
    const transcript = transcriptData?.result;

    const {
        data: explainData,
        isEnabled: explainEnabled,
        isLoading: explainLoading,
        error: explainError,
        generate: explainGenerate,
        regenerate: explainRegenerate,
        chapterData: explainChapterData,
        regenVersion: explainRegenVersion,
    } = useVideoExplain(videoId, transcript?.transcript, video?.title, video?.description, transcript?.chapters);

    const {
        data: deepExplainData,
        isEnabled: deepExplainEnabled,
        isLoading: deepExplainLoading,
        error: deepExplainError,
        generate: deepExplainGenerate,
        regenerate: deepExplainRegenerate,
        chapterData: deepExplainChapterData,
        regenVersion: deepExplainRegenVersion,
    } = useVideoDeepExplain(videoId, transcript?.transcript, video?.title, video?.description, transcript?.chapters);

    const hasTranscript = transcript?.transcript && transcript.transcript.length > 0;
    const hasChapters = transcript?.chapters && transcript.chapters.length > 0;

    return (
        <div className="mx-auto max-w-5xl px-2 sm:px-4 py-4">
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

                    {transcriptLoading && (
                        <p className="mt-4 text-xs text-muted-foreground animate-pulse">Loading transcript...</p>
                    )}

                    {!transcriptLoading && transcriptError && (
                        <ErrorDisplay error={transcriptError} title="Transcript unavailable" variant="inline" />
                    )}

                    {(hasTranscript || hasChapters) && (
                        <Tabs
                            value={activeTab}
                            onValueChange={(tab) => setActiveTab(videoId, tab)}
                            className="mt-4"
                        >
                            <TabsList className="w-full">
                                {hasTranscript && (
                                    <TabsTrigger value="ai" className="flex-1 gap-1.5">
                                        <Sparkles size={14} />
                                        AI Analysis
                                    </TabsTrigger>
                                )}
                                {hasTranscript && (
                                    <TabsTrigger value="transcript" className="flex-1 gap-1.5">
                                        <FileText size={14} />
                                        Transcript
                                    </TabsTrigger>
                                )}
                                {hasChapters && (
                                    <TabsTrigger value="chapters" className="flex-1 gap-1.5">
                                        <BookOpen size={14} />
                                        Chapters
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            {hasTranscript && (
                                <TabsContent value="ai" forceMount>
                                    <Tabs
                                        value={activeAITab}
                                        onValueChange={(tab) => setActiveTab(videoId + ':ai', tab)}
                                    >
                                        <TabsList className="w-full">
                                            <TabsTrigger value="explain" className="flex-1 gap-1">
                                                <ListChecks size={13} />
                                                Key Points
                                            </TabsTrigger>
                                            <TabsTrigger value="deep-explain" className="flex-1 gap-1">
                                                <BookOpenText size={13} />
                                                Deep Explain
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="explain" forceMount>
                                            {explainEnabled ? (
                                                <>
                                                <AIActionHeader actionType="explain" videoId={videoId} cost={explainData?.cost} isFromCache={explainData?._isFromCache} isLoading={explainLoading} onRegenerate={explainRegenerate} onGenerate={explainGenerate} />
                                                <ExplainSection
                                                    explainPoints={explainData?.explainPoints}
                                                    chapterContext={explainData?.chapterContext}
                                                    isLoading={explainLoading}
                                                    error={explainError}
                                                    videoId={videoId}
                                                    chapters={explainChapterData}
                                                    videoTitle={video?.title}
                                                    description={video?.description}
                                                    bypassCache={explainRegenVersion > 0}
                                                />
                                                </>
                                            ) : (
                                                <EmptyAITab label="Explain" onGenerate={explainGenerate} />
                                            )}
                                        </TabsContent>

                                        <TabsContent value="deep-explain" forceMount>
                                            {deepExplainEnabled ? (
                                                <>
                                                <AIActionHeader actionType="deep-explain" videoId={videoId} cost={deepExplainData?.cost} isFromCache={deepExplainData?._isFromCache} isLoading={deepExplainLoading} onRegenerate={deepExplainRegenerate} onGenerate={deepExplainGenerate} />
                                                <DeepExplainSection
                                                    summary={deepExplainData?.summary}
                                                    isLoading={deepExplainLoading}
                                                    error={deepExplainError}
                                                    videoId={videoId}
                                                    chapters={deepExplainChapterData}
                                                    videoTitle={video?.title}
                                                    description={video?.description}
                                                    bypassCache={deepExplainRegenVersion > 0}
                                                />
                                                </>
                                            ) : (
                                                <EmptyAITab label="Deep Explain" onGenerate={deepExplainGenerate} />
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </TabsContent>
                            )}

                            {hasTranscript && (
                                <TabsContent value="transcript" forceMount>
                                    <div className="rounded-lg border border-border p-3">
                                        <TranscriptSection segments={transcript.transcript} onRefresh={refreshTranscript} />
                                    </div>
                                </TabsContent>
                            )}

                            {hasChapters && (
                                <TabsContent value="chapters" forceMount>
                                    <div className="rounded-lg border border-border p-3">
                                        <ChaptersSection chapters={transcript.chapters} videoId={videoId} onRefresh={refreshTranscript} />
                                    </div>
                                </TabsContent>
                            )}
                        </Tabs>
                    )}
                </>
            )}
        </div>
    );
};
