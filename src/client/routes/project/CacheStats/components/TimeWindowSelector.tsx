import { TIME_WINDOWS } from '@/client/features/project/cache-stats';
import { Button } from '@/client/components/template/ui/button';

interface TimeWindowSelectorProps {
    selected: number;
    onSelect: (ms: number) => void;
}

export function TimeWindowSelector({ selected, onSelect }: TimeWindowSelectorProps) {
    return (
        <div className="flex gap-2">
            {TIME_WINDOWS.map((w) => (
                <Button
                    key={w.label}
                    variant={selected === w.ms ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSelect(w.ms)}
                >
                    {w.label}
                </Button>
            ))}
        </div>
    );
}
