import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, MessageCircleQuestion } from 'lucide-react';
import { getModelById } from '@/common/ai/models';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';
import type { ChapterSummary } from '@/apis/project/youtube/types';

interface ExplainChapterItemProps {
    chapter: ChapterSummary;
    videoId: string;
    index: number;
}

const ExplainChapterItem = ({ chapter, videoId, index }: ExplainChapterItemProps) => {
    const [open, setOpen] = useVideoUIToggle(videoId, `explain:ch:${index}`, false);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5 px-2 text-left">
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="truncate">{chapter.title}</span>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="ml-6 mr-2 mb-2 rounded-lg bg-muted/30 p-2.5">
                    <div className="markdown-body text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {chapter.summary}
                        </ReactMarkdown>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

interface ExplainSectionProps {
    summary?: string;
    chapterSummaries?: ChapterSummary[];
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
}

export const ExplainSection = ({
    summary,
    chapterSummaries,
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
}: ExplainSectionProps) => {
    const [open, setOpen] = useVideoUIToggle(videoId, 'explain', true);

    const modelName = modelId ? getModelById(modelId).name : undefined;
    const loading = isLoading || isRegenerating;
    const hasContent = summary || (chapterSummaries && chapterSummaries.length > 0);

    if (!isEnabled) {
        return (
            <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={onGenerate}>
                <MessageCircleQuestion size={14} />
                Explain
            </Button>
        );
    }

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div>
                <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <MessageCircleQuestion size={14} />
                            Explain
                        </Button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1.5">
                        {!loading && hasContent && (
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
                {(modelName || cost) && (
                    <div className="flex items-center gap-2 pl-8 text-xs text-muted-foreground">
                        {modelName && <span>{modelName}</span>}
                        {cost && <span>${cost.totalCost.toFixed(4)}</span>}
                    </div>
                )}
            </div>
            <CollapsibleContent>
                <div className="mt-2 space-y-2">
                    {loading && (
                        <p className="text-sm text-muted-foreground animate-pulse">Generating explanation...</p>
                    )}
                    {error && !loading && (
                        <p className="text-sm text-destructive">Failed to generate explanation: {error.message}</p>
                    )}
                    {!loading && summary && !chapterSummaries?.length && (
                        <div className="rounded-lg bg-muted/50 p-3">
                            <div className="markdown-body text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {summary}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {!loading && chapterSummaries && chapterSummaries.length > 0 && (
                        <div className="rounded-lg bg-muted/50 p-2">
                            {chapterSummaries.map((chapter, i) => (
                                <ExplainChapterItem key={i} chapter={chapter} videoId={videoId} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
