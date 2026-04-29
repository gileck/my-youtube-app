import { createStore } from '@/client/stores';
import type { AILength, AILevel, AIStyle } from '@/apis/project/youtube/types';

export interface AIOptions {
    aiLength: AILength;
    aiLevel: AILevel;
    aiStyle: AIStyle;
}

interface AIOptionsStore {
    options: AIOptions;
    updateOptions: (patch: Partial<AIOptions>) => void;
}

export const defaultAIOptions: AIOptions = {
    aiLength: 'medium',
    aiLevel: 'intermediate',
    aiStyle: 'conversational',
};

export const useAIOptionsStore = createStore<AIOptionsStore>({
    key: 'ai-options',
    label: 'AI Options',
    creator: (set) => ({
        options: defaultAIOptions,
        updateOptions: (patch) =>
            set((prev) => ({ options: { ...prev.options, ...patch } })),
    }),
    persistOptions: {
        partialize: (state) => ({ options: state.options }),
    },
});
