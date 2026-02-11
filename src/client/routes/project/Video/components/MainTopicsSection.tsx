import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, LayoutList, Clock, Loader2 } from 'lucide-react';
import { getModelById } from '@/common/ai/models';
import { useTopicExpansion } from '../hooks';
import type { VideoTopic, TranscriptSegment } from '@/apis/project/youtube/types';

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

function seekVideo(seconds: number) {
    const iframe = document.querySelector('iframe[src*="youtube.com/embed"]') as HTMLIFrameElement;
    if (iframe) {
        const url = new URL(iframe.src);
        url.searchParams.set('start', String(Math.floor(seconds)));
        url.searchParams.set('autoplay', '1');
        iframe.src = url.toString();
    }
}

interface TopicItemProps {
    topic: VideoTopic;
    videoId: string;
    segments: TranscriptSegment[] | undefined;
    videoTitle: string | undefined;
}

const TopicItem = ({ topic, videoId, segments, videoTitle }: TopicItemProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [isOpen, setIsOpen] = useState(false);
    const { data, isLoading, isExpanded, expand } = useTopicExpansion(videoId, topic.title, segments, videoTitle);
    const hasKeyPoints = topic.keyPoints && topic.keyPoints.length > 0;

    return (
        <div className="rounded-lg bg-muted/30 p-3">
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
                            onClick={(e) => { e.stopPropagation(); seekVideo(topic.timestamp); }}
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
                    {hasKeyPoints && topic.keyPoints.map((kp, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                            <button
                                onClick={() => seekVideo(kp.timestamp)}
                                className="flex shrink-0 items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground mt-0.5"
                            >
                                <Clock size={10} />
                                {formatTimestamp(kp.timestamp)}
                            </button>
                            <span className="text-muted-foreground">{kp.text}</span>
                        </div>
                    ))}

                    {!isExpanded && (
                        <Button variant="ghost" size="sm" onClick={expand} className="text-xs h-6 px-2 mt-1">
                            Expand
                        </Button>
                    )}

                    {isExpanded && (
                        <div className="mt-2 border-t border-border pt-2">
                            {isLoading && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground animate-pulse">
                                    <Loader2 size={12} className="animate-spin" />
                                    Expanding...
                                </div>
                            )}
                            {data?.summary && (
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
}: MainTopicsSectionProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [open, setOpen] = useState(true);

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
                                />
                            ))}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
