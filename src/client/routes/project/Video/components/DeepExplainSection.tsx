import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/client/components/template/ui/button';
import { ChevronDown, ChevronRight, RefreshCw, Copy, Check, ExternalLink, Play } from 'lucide-react';
import { useVideoUIToggle } from '@/client/features/project/video-ui-state';
import { useSeekTo } from '@/client/features/project/video-player';
import { useChapterAIAction } from '../hooks';

interface ChapterData {
    title: string;
    content: string;
    startTime: number;
}

const ChapterActions = ({ markdown, chapterTitle, videoTitle }: {
    markdown: string;
    chapterTitle: string;
    videoTitle: string;
}) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral clipboard feedback
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleOpenChat = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prompt = `I was watching "${videoTitle}", chapter "${chapterTitle}". Here's an explanation of the content. Help me explore this deeper, ask me what interests me most, and continue the conversation.\n\n${markdown}`;
        window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, '_blank');
    };
    return (
        <div className="mt-3 flex flex-wrap gap-1">
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

const DeepExplainChapterLoader = ({ chapter, videoId, index, videoTitle, description, enabled, bypassCache, onLoaded }: {
    chapter: ChapterData;
    videoId: string;
    index: number;
    videoTitle: string;
    description?: string;
    enabled: boolean;
    bypassCache?: boolean;
    onLoaded?: () => void;
}) => {
    const [isOpen, setIsOpen] = useVideoUIToggle(videoId, `deepExplain:${index}`, false);
    const [prevOpen] = useVideoUIToggle(videoId, `deepExplain:${index - 1}`, false);
    const autoGenerate = index < 3;
    const { data, isLoading: queryLoading, error, regenerate, isRegenerating } = useChapterAIAction(
        'deep-explain', videoId, chapter.title, chapter.content, videoTitle, enabled && (autoGenerate || isOpen || prevOpen), description, bypassCache,
    );

    const seekTo = useSeekTo();
    const loading = queryLoading || isRegenerating;
    const markdown = data?.summary;

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
                <span
                    className="shrink-0 text-primary cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); seekTo(Math.max(0, chapter.startTime)); }}
                >
                    <Play size={14} fill="currentColor" />
                </span>
                {loading && <span className="text-xs text-muted-foreground animate-pulse shrink-0">loading...</span>}
                {!loading && markdown && (
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); regenerate(); }}>
                        <RefreshCw size={12} className="hover:text-foreground transition-colors cursor-pointer" />
                        {data?._duration != null && <span>{(data._duration / 1000).toFixed(1)}s</span>}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="mt-2 sm:ml-5">
                    {loading && (
                        <p className="text-sm text-muted-foreground animate-pulse">Generating deep explanation...</p>
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
                    {!loading && markdown && (
                        <div className="mt-3 rounded-xl bg-card p-4 shadow-sm markdown-body text-sm leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                        </div>
                    )}
                    {!loading && markdown && (
                        <ChapterActions markdown={markdown} chapterTitle={chapter.title} videoTitle={videoTitle} />
                    )}
                </div>
            )}
        </div>
    );
};

const CHAPTER_BATCH_SIZE = 5;

const BatchedDeepExplainList = ({ chapters, videoId, videoTitle, description, enabled, bypassCache }: {
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
                <DeepExplainChapterLoader
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

interface DeepExplainSectionProps {
    summary?: string;
    isLoading: boolean;
    error?: Error | null;
    videoId: string;
    chapters?: ChapterData[];
    videoTitle?: string;
    description?: string;
    bypassCache?: boolean;
}

export const DeepExplainSection = ({
    summary,
    isLoading,
    error,
    videoId,
    chapters,
    videoTitle,
    description,
    bypassCache,
}: DeepExplainSectionProps) => {
    const hasChapters = chapters && chapters.length > 1;

    return (
        <div className="space-y-2">
            {isLoading && !hasChapters && (
                <p className="text-sm text-muted-foreground animate-pulse">Generating deep explanation...</p>
            )}
            {error && !isLoading && (
                <p className="text-sm text-destructive">Failed to generate: {error.message}</p>
            )}
            {!isLoading && summary && !hasChapters && (
                <div className="rounded-xl bg-card p-4 shadow-sm markdown-body text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>
            )}
            {hasChapters && (
                <BatchedDeepExplainList
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
