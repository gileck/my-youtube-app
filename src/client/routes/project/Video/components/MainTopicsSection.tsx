import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, LayoutList, Clock, Loader2 } from 'lucide-react';
import { getModelById } from '@/common/ai/models';
import { useTopicExpansion, useSubtopicExpansion } from '../hooks';
import { useActiveTopic, useActiveKeyPoint, useSeekTo } from '@/client/features/project/video-player';
import type { VideoTopic, TopicKeyPoint, TranscriptSegment, ChapterWithContent } from '@/apis/project/youtube/types';

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

interface SubtopicItemProps {
    kp: TopicKeyPoint;
    nextTimestamp: number;
    videoId: string;
    videoTitle: string | undefined;
    chapterSegments: TranscriptSegment[] | undefined;
    isActive: boolean;
    onSeek: (seconds: number) => void;
    preload?: boolean;
}

const SubtopicItem = ({ kp, nextTimestamp, videoId, videoTitle, chapterSegments, isActive, onSeek, preload }: SubtopicItemProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [showTakeaways, setShowTakeaways] = useState(false);
    const { data, isLoading, isExpanded, expand } = useSubtopicExpansion(
        videoId, kp.title || kp.text, chapterSegments, kp.timestamp, nextTimestamp, videoTitle
    );

    // Auto-expand when preload becomes true (triggers React Query fetch for caching)
    useEffect(() => {
        if (preload && !isExpanded) {
            expand();
            setShowTakeaways(true);
        }
    }, [preload, isExpanded, expand]);

    const handleToggle = () => {
        if (!isExpanded) {
            expand();
            setShowTakeaways(true);
        } else {
            setShowTakeaways(prev => !prev);
        }
    };

    return (
        <div className={`transition-colors ${isActive ? 'border-l-2 border-primary pl-2' : ''}`}>
            <div className="flex items-start gap-2 text-sm">
                <button
                    onClick={() => onSeek(kp.timestamp)}
                    className="flex shrink-0 items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground mt-0.5"
                >
                    <Clock size={10} />
                    {formatTimestamp(kp.timestamp)}
                </button>
                <button onClick={handleToggle} className="min-w-0 text-left flex items-start gap-1">
                    <span className="mt-0.5 shrink-0 text-muted-foreground">
                        {showTakeaways && isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                    <div className="min-w-0">
                        {kp.title && <span className="font-medium text-foreground">{kp.title}: </span>}
                        <span className="text-muted-foreground">{kp.text}</span>
                    </div>
                </button>
            </div>
            {isExpanded && showTakeaways && (
                <div className="ml-16 mt-1 mb-2">
                    {isLoading && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground animate-pulse">
                            <Loader2 size={12} className="animate-spin" />
                            Loading key takeaways...
                        </div>
                    )}
                    {data?.summary && (
                        <div className="markdown-body text-sm text-muted-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {data.summary}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface TopicItemProps {
    topic: VideoTopic;
    videoId: string;
    segments: TranscriptSegment[] | undefined;
    videoTitle: string | undefined;
    chapters: ChapterWithContent[] | undefined;
    isActive: boolean;
}

const TopicItem = ({ topic, videoId, segments, videoTitle, chapters, isActive }: TopicItemProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [isOpen, setIsOpen] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [showExpansion, setShowExpansion] = useState(true);
    const matchingChapter = chapters?.find(c => c.title === topic.title);
    const { data, isLoading, isExpanded, expand } = useTopicExpansion(videoId, topic.title, segments, videoTitle, matchingChapter?.segments);
    const hasKeyPoints = topic.keyPoints && topic.keyPoints.length > 0;
    const activeKeyPoint = useActiveKeyPoint(topic.keyPoints);
    const seekTo = useSeekTo();

    return (
        <div className={`rounded-lg p-3 transition-colors bg-muted/30 ${isActive ? 'border-l-2 border-primary' : ''}`}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex w-full items-start gap-2 text-left"
            >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{topic.title}</span>
                        <span
                            onClick={(e) => { e.stopPropagation(); seekTo(topic.timestamp); }}
                            className="flex shrink-0 items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                            <Clock size={10} />
                            {formatTimestamp(topic.timestamp)}
                        </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{topic.description}</p>
                </div>
            </button>

            {isOpen && (
                <div className="mt-2 ml-5 space-y-1">
                    {hasKeyPoints && (() => {
                        const activeIdx = topic.keyPoints.findIndex(kp => kp === activeKeyPoint);
                        return topic.keyPoints.map((kp, i) => (
                            <SubtopicItem
                                key={i}
                                kp={kp}
                                nextTimestamp={topic.keyPoints[i + 1]?.timestamp ?? (matchingChapter ? matchingChapter.endTime : kp.timestamp + 300)}
                                videoId={videoId}
                                videoTitle={videoTitle}
                                chapterSegments={matchingChapter?.segments}
                                isActive={activeKeyPoint === kp}
                                onSeek={seekTo}
                                preload={activeIdx >= 0 && (i === activeIdx || i === activeIdx + 1)}
                            />
                        ));
                    })()}

                    {!isExpanded && (
                        <Button variant="ghost" size="sm" onClick={expand} className="text-xs h-6 px-2 mt-1">
                            Expand
                        </Button>
                    )}

                    {isExpanded && (
                        <div className="mt-2 border-t border-border pt-2">
                            <button
                                onClick={() => setShowExpansion(prev => !prev)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
                            >
                                {showExpansion ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Detailed Summary
                            </button>
                            {isLoading && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground animate-pulse">
                                    <Loader2 size={12} className="animate-spin" />
                                    Expanding...
                                </div>
                            )}
                            {showExpansion && data?.summary && (
                                <div className="markdown-body text-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {data.summary}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface MainTopicsSectionProps {
    topics?: VideoTopic[];
    modelId?: string;
    cost?: { totalCost: number };
    isFromCache?: boolean;
    isEnabled: boolean;
    isLoading: boolean;
    isRegenerating: boolean;
    error?: Error | null;
    onGenerate: () => void;
    onRegenerate: () => void;
    videoId: string;
    segments: TranscriptSegment[] | undefined;
    videoTitle: string | undefined;
    chapters: ChapterWithContent[] | undefined;
}

export const MainTopicsSection = ({
    topics,
    modelId,
    cost,
    isFromCache,
    isEnabled,
    isLoading,
    isRegenerating,
    error,
    onGenerate,
    onRegenerate,
    videoId,
    segments,
    videoTitle,
    chapters,
}: MainTopicsSectionProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [open, setOpen] = useState(true);
    const activeTopic = useActiveTopic(topics);

    const modelName = modelId ? getModelById(modelId).name : undefined;
    const loading = isLoading || isRegenerating;

    if (!isEnabled) {
        return (
            <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={onGenerate}>
                <LayoutList size={14} />
                Main Topics
            </Button>
        );
    }

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <LayoutList size={14} />
                        Main Topics
                    </Button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                    {modelName && (
                        <span className="text-xs text-muted-foreground">{modelName}</span>
                    )}
                    {cost && (
                        <span className="text-xs text-muted-foreground">${cost.totalCost.toFixed(4)}</span>
                    )}
                    {!loading && topics && topics.length > 0 && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {isFromCache ? 'Cached' : 'Fresh'}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRegenerate}
                        disabled={loading}
                        className="h-7 w-7 p-0"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>
            <CollapsibleContent>
                <div className="mt-2 space-y-2">
                    {loading && (
                        <p className="text-sm text-muted-foreground animate-pulse">Identifying main topics...</p>
                    )}
                    {error && !loading && (
                        <p className="text-sm text-destructive">Failed to identify topics: {error.message}</p>
                    )}
                    {!loading && topics && topics.length > 0 && (
                        <div className="space-y-2">
                            {topics.map((topic, i) => (
                                <TopicItem
                                    key={i}
                                    topic={topic}
                                    videoId={videoId}
                                    segments={segments}
                                    videoTitle={videoTitle}
                                    chapters={chapters}
                                    isActive={activeTopic === topic}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
