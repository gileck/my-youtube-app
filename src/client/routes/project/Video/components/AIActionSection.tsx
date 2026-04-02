import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, BookOpen } from 'lucide-react';
import { getModelById } from '@/common/ai/models';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';
import { useChapterAIAction } from '../hooks';
import type { AIActionType } from '@/apis/project/youtube/types';

interface ChapterData {
    title: string;
    content: string;
    startTime: number;
}

interface AIActionSectionProps {
    title: string;
    icon: ReactNode;
    summary?: string;
    modelId?: string;
    cost?: { totalCost: number };
    isFromCache?: boolean;
    isLoading: boolean;
    error?: Error | null;
    onRegenerate: () => void;
    videoId: string;
    sectionKey: string;
    actionType: AIActionType;
    chapters?: ChapterData[];
    videoTitle?: string;
    bypassCache?: boolean;
}

const ChapterSummaryLoader = ({ chapter, videoId, sectionKey, index, actionType, videoTitle, enabled, bypassCache, onLoaded }: {
    chapter: ChapterData;
    videoId: string;
    sectionKey: string;
    index: number;
    actionType: AIActionType;
    videoTitle: string;
    enabled: boolean;
    bypassCache?: boolean;
    onLoaded?: () => void;
}) => {
    const [open, setOpen] = useVideoUIToggle(videoId, `${sectionKey}:ch:${index}`, false);
    const [prevOpen] = useVideoUIToggle(videoId, `${sectionKey}:ch:${index - 1}`, false);
    const autoGenerate = index < 3;
    const { data, isLoading: queryLoading, error, regenerate, isRegenerating } = useChapterAIAction(
        actionType, videoId, chapter.title, chapter.content, videoTitle, enabled && (autoGenerate || open || prevOpen), undefined, bypassCache,
    );

    const loading = queryLoading || isRegenerating;

    const loadedRef = useRef(false);
    useEffect(() => {
        if (!queryLoading && !loadedRef.current && (data || error) && onLoaded) {
            loadedRef.current = true;
            onLoaded();
        }
    }, [data, error, queryLoading, onLoaded]);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5 px-2 text-left">
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="truncate">{chapter.title}</span>
                    {loading && <span className="ml-auto text-xs text-muted-foreground animate-pulse">loading...</span>}
                    {!loading && data?.summary && (
                        <span className="ml-auto text-xs text-muted-foreground">
                            {data._isFromCache ? 'Cached' : 'Fresh'}
                        </span>
                    )}
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="ml-6 mr-2 mb-2 rounded-lg bg-muted/30 p-2.5">
                    {!loading && (
                        <div className="mb-2">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); regenerate(); }} className="h-6 gap-1 px-1.5 text-xs text-muted-foreground">
                                <RefreshCw size={12} />
                                Regenerate
                            </Button>
                        </div>
                    )}
                    {loading && (
                        <p className="text-sm text-muted-foreground animate-pulse">Generating...</p>
                    )}
                    {error && !loading && (
                        <p className="text-sm text-destructive">Failed: {error.message}</p>
                    )}
                    {!loading && data?.summary && (
                        <div className="markdown-body text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {data.summary}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

const CHAPTER_BATCH_SIZE = 5;

const BatchedChapterSummaryList = ({ chapters, videoId, sectionKey, actionType, videoTitle, enabled, bypassCache }: {
    chapters: ChapterData[];
    videoId: string;
    sectionKey: string;
    actionType: AIActionType;
    videoTitle: string;
    enabled: boolean;
    bypassCache?: boolean;
}) => {
    const [loadedCount, setLoadedCount] = useState(0);

    const handleChapterLoaded = useCallback(() => {
        setLoadedCount(prev => prev + 1);
    }, []);

    const isChapterEnabled = (index: number) => {
        if (!enabled) return false;
        const batchStart = Math.floor(index / CHAPTER_BATCH_SIZE) * CHAPTER_BATCH_SIZE;
        return loadedCount >= batchStart;
    };

    return (
        <div className="mt-1 rounded-lg bg-muted/50 p-2">
            {chapters.map((chapter, i) => (
                <ChapterSummaryLoader
                    key={chapter.title}
                    chapter={chapter}
                    videoId={videoId}
                    sectionKey={sectionKey}
                    index={i}
                    actionType={actionType}
                    videoTitle={videoTitle}
                    enabled={isChapterEnabled(i)}
                    bypassCache={bypassCache}
                    onLoaded={handleChapterLoaded}
                />
            ))}
        </div>
    );
};

export const AIActionSection = ({
    title,
    icon,
    summary,
    modelId,
    cost,
    isFromCache,
    isLoading,
    error,
    onRegenerate,
    videoId,
    sectionKey,
    actionType,
    chapters,
    videoTitle,
    bypassCache,
}: AIActionSectionProps) => {
    const [open, setOpen] = useVideoUIToggle(videoId, sectionKey, true);
    const [chaptersOpen, setChaptersOpen] = useVideoUIToggle(videoId, `${sectionKey}:chapters`, false);

    const modelName = modelId ? getModelById(modelId).name : undefined;
    const hasChapters = chapters && chapters.length > 1;

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div>
                <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            {icon}
                            {title}
                        </Button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1.5">
                        {!isLoading && summary && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {isFromCache ? 'Cached' : 'Fresh'}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRegenerate}
                            disabled={isLoading}
                            className="h-7 w-7 p-0"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
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
                    {isLoading && (
                        <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm text-muted-foreground animate-pulse">Generating {title.toLowerCase()}...</p>
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm text-destructive">Failed to generate {title.toLowerCase()}: {error.message}</p>
                        </div>
                    )}
                    {!isLoading && summary && (
                        <div className="rounded-lg bg-muted/50 p-3">
                            <div className="markdown-body text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {summary}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {hasChapters && (
                        <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                                    {chaptersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <BookOpen size={14} />
                                    Chapter Details
                                    <span className="text-xs text-muted-foreground">({chapters.length})</span>
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <BatchedChapterSummaryList
                                    chapters={chapters}
                                    videoId={videoId}
                                    sectionKey={sectionKey}
                                    actionType={actionType}
                                    videoTitle={videoTitle ?? ''}
                                    enabled={chaptersOpen}
                                    bypassCache={bypassCache}
                                />
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
