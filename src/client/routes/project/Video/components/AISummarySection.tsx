import { useState } from 'react';
import { Button } from '@/client/components/template/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/client/components/template/ui/collapsible';
import { ChevronDown, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { getModelById } from '@/common/ai/models';

interface AISummarySectionProps {
    summary?: string;
    modelId?: string;
    cost?: { totalCost: number };
    isFromCache?: boolean;
    isLoading: boolean;
    isRegenerating: boolean;
    error?: Error | null;
    onRegenerate: () => void;
}

export const AISummarySection = ({
    summary,
    modelId,
    cost,
    isFromCache,
    isLoading,
    isRegenerating,
    error,
    onRegenerate,
}: AISummarySectionProps) => {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle
    const [open, setOpen] = useState(true);

    const modelName = modelId ? getModelById(modelId).name : undefined;
    const loading = isLoading || isRegenerating;

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Sparkles size={14} />
                        AI Summary
                    </Button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                    {modelName && (
                        <span className="text-xs text-muted-foreground">{modelName}</span>
                    )}
                    {cost && (
                        <span className="text-xs text-muted-foreground">${cost.totalCost.toFixed(4)}</span>
                    )}
                    {isFromCache && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Cached</span>
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
                <div className="mt-2 rounded-lg bg-muted/50 p-3">
                    {loading && !summary && (
                        <p className="text-sm text-muted-foreground animate-pulse">Generating summary...</p>
                    )}
                    {error && !loading && (
                        <p className="text-sm text-destructive">Failed to generate summary: {error.message}</p>
                    )}
                    {summary && (
                        <p className="text-sm text-foreground whitespace-pre-line">{summary}</p>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
