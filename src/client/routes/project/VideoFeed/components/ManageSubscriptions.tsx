import { useState } from 'react';
import { Button } from '@/client/components/template/ui/button';
import { Input } from '@/client/components/template/ui/input';
import { useRouter } from '@/client/features';
import { useSubscriptionsStore } from '@/client/features/project/subscriptions';
import { X, Pencil, Check } from 'lucide-react';

export const ManageSubscriptions = () => {
    const channels = useSubscriptionsStore((s) => s.channels);
    const searchQueries = useSubscriptionsStore((s) => s.searchQueries);
    const unsubscribeChannel = useSubscriptionsStore((s) => s.unsubscribeChannel);
    const addSearchQuery = useSubscriptionsStore((s) => s.addSearchQuery);
    const removeSearchQuery = useSubscriptionsStore((s) => s.removeSearchQuery);
    const updateSearchQuery = useSubscriptionsStore((s) => s.updateSearchQuery);
    const { navigate } = useRouter();

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral form input before submission
    const [newQuery, setNewQuery] = useState('');
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral inline edit state
    const [editingQuery, setEditingQuery] = useState<string | null>(null);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral inline edit value
    const [editValue, setEditValue] = useState('');

    const handleAddQuery = () => {
        const trimmed = newQuery.trim();
        if (trimmed) {
            addSearchQuery(trimmed);
            setNewQuery('');
        }
    };

    const handleStartEdit = (query: string) => {
        setEditingQuery(query);
        setEditValue(query);
    };

    const handleSaveEdit = () => {
        if (editingQuery && editValue.trim()) {
            updateSearchQuery(editingQuery, editValue.trim());
        }
        setEditingQuery(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingQuery(null);
        setEditValue('');
    };

    return (
        <div className="space-y-6">
            {/* Channels section */}
            <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                    Channels ({channels.length})
                </h3>
                {channels.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                        No subscribed channels. Search for channels to subscribe.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {channels.map((channel) => (
                            <div
                                key={channel.id}
                                className="flex items-center gap-3 rounded-lg bg-card p-2"
                            >
                                {channel.thumbnailUrl && (
                                    <img
                                        src={channel.thumbnailUrl}
                                        alt={channel.title}
                                        className="w-8 h-8 rounded-full flex-shrink-0"
                                    />
                                )}
                                <span
                                    className="text-sm text-foreground truncate flex-1 cursor-pointer hover:underline"
                                    onClick={() => navigate(`/channel/${channel.id}`)}
                                >
                                    {channel.title}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 flex-shrink-0"
                                    onClick={() => unsubscribeChannel(channel.id)}
                                >
                                    <X size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Search queries section */}
            <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                    Search Queries ({searchQueries.length})
                </h3>
                <div className="flex gap-2 mb-3">
                    <Input
                        value={newQuery}
                        onChange={(e) => setNewQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuery()}
                        placeholder="Add a search query..."
                        className="flex-1 h-9 text-sm"
                    />
                    <Button size="sm" onClick={handleAddQuery} disabled={!newQuery.trim()}>
                        Add
                    </Button>
                </div>
                {searchQueries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                        No search queries. Add queries above to include their results in your feed.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {searchQueries.map((query) => (
                            <div
                                key={query}
                                className="flex items-center gap-2 rounded-lg bg-card p-2"
                            >
                                {editingQuery === query ? (
                                    <>
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            className="flex-1 h-7 text-sm"
                                            autoFocus
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={handleSaveEdit}
                                        >
                                            <Check size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={handleCancelEdit}
                                        >
                                            <X size={14} />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm text-foreground flex-1 truncate">
                                            {query}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={() => handleStartEdit(query)}
                                        >
                                            <Pencil size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={() => removeSearchQuery(query)}
                                        >
                                            <X size={14} />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
