import { createStore } from '@/client/stores';
import type { SubscribedChannel } from './types';

interface SubscriptionsState {
    channels: SubscribedChannel[];
    searchQueries: string[];
    subscribeChannel: (channel: SubscribedChannel) => void;
    unsubscribeChannel: (channelId: string) => void;
    addSearchQuery: (query: string) => void;
    removeSearchQuery: (query: string) => void;
    updateSearchQuery: (oldQuery: string, newQuery: string) => void;
}

export const useSubscriptionsStore = createStore<SubscriptionsState>({
    key: 'video-feed-subscriptions',
    label: 'Video Feed Subscriptions',
    creator: (set) => ({
        channels: [],
        searchQueries: [],
        subscribeChannel: (channel) =>
            set((state) => {
                if (state.channels.some((c) => c.id === channel.id)) return state;
                return { channels: [...state.channels, channel] };
            }),
        unsubscribeChannel: (channelId) =>
            set((state) => ({
                channels: state.channels.filter((c) => c.id !== channelId),
            })),
        addSearchQuery: (query) =>
            set((state) => {
                const normalized = query.trim();
                if (!normalized) return state;
                const exists = state.searchQueries.some(
                    (q) => q.toLowerCase() === normalized.toLowerCase()
                );
                if (exists) return state;
                return { searchQueries: [...state.searchQueries, normalized] };
            }),
        removeSearchQuery: (query) =>
            set((state) => ({
                searchQueries: state.searchQueries.filter((q) => q !== query),
            })),
        updateSearchQuery: (oldQuery, newQuery) =>
            set((state) => {
                const normalized = newQuery.trim();
                if (!normalized) return state;
                const exists = state.searchQueries.some(
                    (q) => q !== oldQuery && q.toLowerCase() === normalized.toLowerCase()
                );
                if (exists) return state;
                return {
                    searchQueries: state.searchQueries.map((q) =>
                        q === oldQuery ? normalized : q
                    ),
                };
            }),
    }),
    persistOptions: {
        partialize: (state) => ({
            channels: state.channels,
            searchQueries: state.searchQueries,
        }),
    },
});
