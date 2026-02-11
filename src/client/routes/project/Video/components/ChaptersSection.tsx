import { useState } from 'react';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { errorToastAuto } from '@/client/features/template/error-tracking';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useActiveChapter, useSeekTo } from '@/client/features/project/video-player';
import type { ChapterWithContent } from '@/apis/project/youtube/types';

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

interface ChaptersSectionProps {
    chapters: ChapterWithContent[];
}

export const ChaptersSection = ({ chapters }: ChaptersSectionProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral clipboard feedback
    const [copied, setCopied] = useState(false);
    const activeChapter = useActiveChapter(chapters);
    const seekTo = useSeekTo();

    const handleCopy = async () => {
        try {
            const text = chapters
                .map((ch) => `[${formatTime(ch.startTime)}] ${ch.title}\n${ch.content}`)
                .join('\n\n');
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            errorToastAuto(err, 'Failed to copy to clipboard');
        }
    };

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        Chapters ({chapters.length})
                    </Button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy all'}
                </Button>
            </div>
            <CollapsibleContent>
                <div className="mt-2 max-h-96 overflow-y-auto rounded-lg bg-muted/50 p-3 space-y-3">
                    {chapters.map((chapter, i) => (
                        <div key={i} className={`px-2 py-1 -mx-2 transition-colors ${activeChapter === chapter ? 'border-l-2 border-primary' : ''}`}>
                            <div className="flex items-baseline gap-2">
                                <button
                                    onClick={() => seekTo(chapter.startTime)}
                                    className="text-xs font-mono flex-shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    {formatTime(chapter.startTime)}
                                </button>
                                <span className="text-sm font-medium text-foreground">
                                    {chapter.title}
                                </span>
                            </div>
                            {chapter.content && (
                                <p className="mt-1 ml-14 text-xs text-muted-foreground line-clamp-2">
                                    {chapter.content}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
