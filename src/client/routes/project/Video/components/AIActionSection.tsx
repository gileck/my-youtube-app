import { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, BookOpen } from 'lucide-react';
import { getModelById } from '@/common/ai/models';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';
import type { ChapterSummary } from '@/apis/project/youtube/types';

interface AIActionSectionProps {
    title: string;
    icon: ReactNode;
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
    sectionKey: string;
}

const ChapterSummaryItem = ({ chapter, videoId, sectionKey, index }: { chapter: ChapterSummary; videoId: string; sectionKey: string; index: number }) => {
    const [open, setOpen] = useVideoUIToggle(videoId, `${sectionKey}:ch:${index}`, false);

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

export const AIActionSection = ({
    title,
    icon,
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
    sectionKey,
}: AIActionSectionProps) => {
    const [open, setOpen] = useVideoUIToggle(videoId, sectionKey, true);
    const [chaptersOpen, setChaptersOpen] = useVideoUIToggle(videoId, `${sectionKey}:chapters`, false);

    const modelName = modelId ? getModelById(modelId).name : undefined;
    const loading = isLoading || isRegenerating;

    if (!isEnabled) {
        return (
            <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={onGenerate}>
                {icon}
                {title}
            </Button>
        );
    }

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {icon}
                        {title}
                    </Button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                    {modelName && (
                        <span className="text-xs text-muted-foreground">{modelName}</span>
                    )}
                    {cost && (
                        <span className="text-xs text-muted-foreground">${cost.totalCost.toFixed(4)}</span>
                    )}
                    {!loading && summary && (
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
                    <div className="rounded-lg bg-muted/50 p-3">
                        {loading && (
                            <p className="text-sm text-muted-foreground animate-pulse">Generating {title.toLowerCase()}...</p>
                        )}
                        {error && !loading && (
                            <p className="text-sm text-destructive">Failed to generate {title.toLowerCase()}: {error.message}</p>
                        )}
                        {!loading && summary && (
                            <div className="markdown-body text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {summary}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {chapterSummaries && chapterSummaries.length > 0 && (
                        <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                                    {chaptersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <BookOpen size={14} />
                                    Chapter Details
                                    <span className="text-xs text-muted-foreground">({chapterSummaries.length})</span>
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="mt-1 rounded-lg bg-muted/50 p-2">
                                    {chapterSummaries.map((chapter, i) => (
                                        <ChapterSummaryItem key={i} chapter={chapter} videoId={videoId} sectionKey={sectionKey} index={i} />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
