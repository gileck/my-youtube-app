import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/client/components/template/ui/button';
import { ChevronDown, ChevronRight, RefreshCw, Play, Copy, Check, ExternalLink } from 'lucide-react';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';
import { useSeekTo } from '@/client/features/project/video-player';
import { useChapterAIAction } from '../hooks';
import type { ExplainPoint } from '@/apis/project/youtube/types';

interface ChapterData {
    title: string;
    content: string;
    startTime: number;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function buildPointText(point: ExplainPoint, chapterTitle: string, context: string, videoTitle: string): string {
    const lines = [
        `Video: ${videoTitle}`,
        `Chapter: ${chapterTitle}`,
        `Topic: ${point.title}`,
        '',
        `Context: ${context}`,
        '',
        `Quote: "${point.quote}"`,
        '',
        ...(point.bullets?.map(b => `• ${b}`) ?? []),
        '',
        `Summary: ${point.summary}`,
    ];
    return lines.join('\n');
}

function buildChatGPTUrl(point: ExplainPoint, chapterTitle: string, context: string, videoTitle: string): string {
    const prompt = `I was watching a video and came across this topic. Help me understand it deeper and continue the conversation.\n\n${buildPointText(point, chapterTitle, context, videoTitle)}`;
    return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}

const PointActions = ({ point, chapterTitle, context, videoTitle }: { point: ExplainPoint; chapterTitle: string; context: string; videoTitle: string }) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral clipboard feedback
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(buildPointText(point, chapterTitle, context, videoTitle));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenChat = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(buildChatGPTUrl(point, chapterTitle, context, videoTitle), '_blank');
    };

    return (
        <div className="flex gap-1 pt-1">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 gap-1 px-1.5 text-xs text-muted-foreground">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleOpenChat} className="h-6 gap-1 px-1.5 text-xs text-muted-foreground">
                <ExternalLink size={12} />
                Open in ChatGPT
            </Button>
        </div>
    );
};

const ExplainPointItem = ({ point, chapterTitle, context, videoTitle }: { point: ExplainPoint; chapterTitle: string; context: string; videoTitle: string }) => {
    const seekTo = useSeekTo();
    const handleSeek = () => seekTo(Math.max(0, point.timestamp - 5));

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
            <div className="text-sm font-semibold text-foreground">{point.title}</div>

            {point.quote && (
                <button
                    onClick={handleSeek}
                    className="w-full text-left rounded-lg bg-muted/60 p-2.5 cursor-pointer hover:bg-muted transition-colors"
                >
                    <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
                        <Play size={10} fill="currentColor" />
                        {formatTime(point.timestamp)}
                    </div>
                    <span className="text-sm italic text-muted-foreground leading-relaxed">{point.quote}</span>
                </button>
            )}

            {point.bullets?.length > 0 && (
                <ul className="space-y-2 rounded-lg bg-muted/30 p-3">
                    {point.bullets.map((b, i) => (
                        <li key={i} className="text-sm text-foreground markdown-body leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{b}</ReactMarkdown>
                        </li>
                    ))}
                </ul>
            )}

            {point.summary && (
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-foreground markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{point.summary}</ReactMarkdown>
                </div>
            )}

            <PointActions point={point} chapterTitle={chapterTitle} context={context} videoTitle={videoTitle} />
        </div>
    );
};

const ExplainPointsList = ({ points, chapterTitle, context, videoTitle }: { points: ExplainPoint[]; chapterTitle: string; context: string; videoTitle: string }) => (
    <div className="space-y-3">
        {points.map((point, i) => (
            <ExplainPointItem key={i} point={point} chapterTitle={chapterTitle} context={context} videoTitle={videoTitle} />
        ))}
    </div>
);

const ChapterActions = ({ transcript, chapterTitle, videoTitle, onRegenerate }: { transcript: string; chapterTitle: string; videoTitle: string; onRegenerate: () => void }) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral clipboard feedback
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(transcript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleOpenChat = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prompt = `I'm watching a video called "${videoTitle}", chapter: "${chapterTitle}". Explain the following content simply and clearly:\n\n${transcript}`;
        window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, '_blank');
    };
    return (
        <div className="mb-2 flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="h-6 gap-1 px-1.5 text-xs text-muted-foreground">
                <RefreshCw size={12} />
                Regenerate
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 gap-1 px-1.5 text-xs text-muted-foreground">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy Transcript'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleOpenChat} className="h-6 gap-1 px-1.5 text-xs text-muted-foreground">
                <ExternalLink size={12} />
                Open in ChatGPT
            </Button>
        </div>
    );
};

const ExplainChapterLoader = ({ chapter, videoId, index, videoTitle, description, enabled, bypassCache, onLoaded }: {
    chapter: ChapterData;
    videoId: string;
    index: number;
    videoTitle: string;
    description?: string;
    enabled: boolean;
    bypassCache?: boolean;
    onLoaded?: () => void;
}) => {
    const [isOpen, setIsOpen] = useVideoUIToggle(videoId, `explain:${index}`, false);
    const [prevOpen] = useVideoUIToggle(videoId, `explain:${index - 1}`, false);
    const autoGenerate = index < 3;
    const { data, isLoading: queryLoading, error, regenerate, isRegenerating } = useChapterAIAction(
        'explain', videoId, chapter.title, chapter.content, videoTitle, enabled && (autoGenerate || isOpen || prevOpen), description, bypassCache,
    );

    const loading = queryLoading || isRegenerating;
    const points = data?.explainPoints;

    const loadedRef = useRef(false);
    useEffect(() => {
        if (!queryLoading && !loadedRef.current && (data || error) && onLoaded) {
            loadedRef.current = true;
            onLoaded();
        }
    }, [data, error, queryLoading, onLoaded]);

    return (
        <div className="rounded-lg border border-border bg-card/50 p-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-start gap-2 text-left"
            >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <span className="text-sm font-medium flex-1">{chapter.title}</span>
                {loading && <span className="text-xs text-muted-foreground animate-pulse shrink-0">loading...</span>}
                {!loading && points && points.length > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
                        {points.length} points
                        {data?._duration != null && <span>· {(data._duration / 1000).toFixed(1)}s</span>}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="mt-2 sm:ml-5">
                    {!loading && (
                        <ChapterActions transcript={chapter.content} chapterTitle={chapter.title} videoTitle={videoTitle} onRegenerate={regenerate} />
                    )}
                    {loading && (
                        <p className="text-sm text-muted-foreground animate-pulse">Generating explanation...</p>
                    )}
                    {error && !loading && (
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-destructive">Failed: {error.message}</p>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); regenerate(); }} className="h-6 gap-1 px-1.5 text-xs shrink-0">
                                <RefreshCw size={12} />
                                Retry
                            </Button>
                        </div>
                    )}
                    {!loading && points && points.length > 0 && (
                        <ExplainPointsList points={points} chapterTitle={chapter.title} context={data?.chapterContext ?? ''} videoTitle={videoTitle} />
                    )}
                    {!loading && (!points || points.length === 0) && data?.summary && (
                        <div className="markdown-body text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.summary}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const CHAPTER_BATCH_SIZE = 5;

const BatchedChapterList = ({ chapters, videoId, videoTitle, description, enabled, bypassCache }: {
    chapters: ChapterData[];
    videoId: string;
    videoTitle: string;
    description?: string;
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
        <div className="space-y-3">
            {chapters.map((chapter, i) => (
                <ExplainChapterLoader
                    key={chapter.title}
                    chapter={chapter}
                    videoId={videoId}
                    index={i}
                    videoTitle={videoTitle}
                    description={description}
                    enabled={isChapterEnabled(i)}
                    bypassCache={bypassCache}
                    onLoaded={handleChapterLoaded}
                />
            ))}
        </div>
    );
};

interface ExplainSectionProps {
    explainPoints?: ExplainPoint[];
    chapterContext?: string;
    isLoading: boolean;
    error?: Error | null;
    videoId: string;
    chapters?: ChapterData[];
    videoTitle?: string;
    description?: string;
    bypassCache?: boolean;
}

export const ExplainSection = ({
    explainPoints,
    chapterContext,
    isLoading,
    error,
    videoId,
    chapters,
    videoTitle,
    description,
    bypassCache,
}: ExplainSectionProps) => {
    const hasContent = explainPoints && explainPoints.length > 0;
    const hasChapters = chapters && chapters.length > 1;

    return (
        <div className="space-y-2">
            {isLoading && !hasChapters && (
                <p className="text-sm text-muted-foreground animate-pulse">Generating explanation...</p>
            )}
            {error && !isLoading && (
                <p className="text-sm text-destructive">Failed to generate explanation: {error.message}</p>
            )}
            {!isLoading && hasContent && !hasChapters && (
                <ExplainPointsList points={explainPoints!} chapterTitle={videoTitle ?? ''} context={chapterContext ?? ''} videoTitle={videoTitle ?? ''} />
            )}
            {hasChapters && (
                <BatchedChapterList
                    chapters={chapters}
                    videoId={videoId}
                    videoTitle={videoTitle ?? ''}
                    description={description}
                    enabled={true}
                    bypassCache={bypassCache}
                />
            )}
        </div>
    );
};
