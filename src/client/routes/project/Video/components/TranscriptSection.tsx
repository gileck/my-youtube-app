import { useState } from 'react';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { errorToastAuto } from '@/client/features/template/error-tracking';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import type { TranscriptSegment } from '@/apis/project/youtube/types';

interface TranscriptSectionProps {
    segments: TranscriptSegment[];
}

export const TranscriptSection = ({ segments }: TranscriptSectionProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral clipboard feedback
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            const text = segments.map((s) => `[${s.start_time_text}] ${s.text}`).join('\n');
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
                        Transcript ({segments.length} segments)
                    </Button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy all'}
                </Button>
            </div>
            <CollapsibleContent>
                <div className="mt-2 max-h-96 overflow-y-auto rounded-lg bg-muted/50 p-3 space-y-2">
                    {segments.map((segment, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 text-xs text-muted-foreground font-mono w-12 pt-0.5">
                                {segment.start_time_text}
                            </span>
                            <span className="text-foreground">{segment.text}</span>
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
