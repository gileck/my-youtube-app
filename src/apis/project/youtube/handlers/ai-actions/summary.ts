import { AIAction, AIActionContext, AIActionResult, SINGLE_PASS_CHAR_LIMIT } from './types';
import { processChaptersInParallel } from './utils';

export const summaryAction: AIAction = {
    cacheKey: 'video-summary',
    cacheParams: (req) => ({ videoId: req.videoId }),

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const useChapters = request.transcript.length > SINGLE_PASS_CHAR_LIMIT
            && request.chapters && request.chapters.length > 1;

        if (!useChapters) {
            const prompt = `You are a helpful assistant that summarizes YouTube video content.

Video Title: ${request.title}

Transcript:
${request.transcript}

Please provide a concise summary of this video. Include:
1. A brief overview (2-3 sentences)
2. Key topics and main points discussed
3. Any notable conclusions or takeaways

Keep the summary informative but concise.`;
            const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
            return { summary: response.result, modelId, cost: response.cost };
        }

        const chapters = request.chapters!;
        const { results, totalCost } = await processChaptersInParallel(
            chapters,
            (chapterTitle, content) =>
                `You are a helpful assistant that summarizes YouTube video content.

Summarize the following chapter titled "${chapterTitle}":

${content}

Provide a concise summary of this chapter's key points and takeaways.`,
            adapter,
        );

        const chaptersText = results.map(c => `Chapter: ${c.title}\nSummary: ${c.summary}`).join('\n\n');
        const synthesisPrompt = `You are a helpful assistant that summarizes YouTube video content.

Here is a video titled "${request.title}" with the following chapter summaries:

${chaptersText}

Please provide a cohesive overall summary of this video. Include:
1. A brief overview (2-3 sentences)
2. Key topics and main points discussed
3. Any notable conclusions or takeaways

Keep the summary informative but concise.`;
        const synthesisResponse = await adapter.processPromptToText(synthesisPrompt, 'getVideoSummary');

        return {
            summary: synthesisResponse.result,
            chapterSummaries: results,
            modelId,
            cost: { totalCost: totalCost + (synthesisResponse.cost?.totalCost ?? 0) },
        };
    },
};
