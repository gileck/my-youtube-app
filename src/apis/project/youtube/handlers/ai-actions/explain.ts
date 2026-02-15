import { AIAction, AIActionContext, AIActionResult } from './types';
import { processChaptersInParallel } from './utils';

export const explainAction: AIAction = {
    cacheKey: 'video-explain',
    cacheParams: (req) => ({ videoId: req.videoId }),

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const descriptionLine = request.description ? `\nDescription: "${request.description}"\n` : '';
        const useChapters = request.chapters && request.chapters.length > 1;

        if (!useChapters) {
            const prompt = `Video: "${request.title}"${descriptionLine}
Transcript:
${request.transcript}

Explain this conversation step by step simply.
Quote the part from the text that you are explaining, then explain it simply, with emojis.`;
            const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
            return { summary: response.result, modelId, cost: response.cost };
        }

        const chapters = request.chapters!;
        const { results, totalCost } = await processChaptersInParallel(
            chapters,
            (chapterTitle, content) =>
                `Video: "${request.title}"${descriptionLine}
Chapter: "${chapterTitle}"

Transcript:
${content}

Explain this part of the conversation from the chapter transcript step by step simply.
Quote the part from the text that you are explaining, then explain it simply, with emojis.`,
            adapter,
        );

        return {
            chapterSummaries: results,
            modelId,
            cost: { totalCost },
        };
    },
};
