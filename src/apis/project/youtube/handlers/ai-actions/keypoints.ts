import { AIAction, AIActionContext, AIActionResult, SINGLE_PASS_CHAR_LIMIT } from './types';
import { processChaptersInParallel } from './utils';

export const keypointsAction: AIAction = {
    cacheKey: 'video-keypoints',
    cacheParams: (req) => ({ videoId: req.videoId }),

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const useChapters = request.transcript.length > SINGLE_PASS_CHAR_LIMIT
            && request.chapters && request.chapters.length > 1;

        if (!useChapters) {
            const prompt = `You are a helpful assistant that extracts key points from YouTube video content.

Video Title: ${request.title}

Transcript:
${request.transcript}

Extract the key points from this video as a bullet list. Each point should be a concise, standalone insight or takeaway. Focus on the most important and actionable information.`;
            const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
            return { summary: response.result, modelId, cost: response.cost };
        }

        const chapters = request.chapters!;
        const { results, totalCost } = await processChaptersInParallel(
            chapters,
            (chapterTitle, content) =>
                `You are a helpful assistant that extracts key points from YouTube video content.

Extract the key points from the following chapter titled "${chapterTitle}":

${content}

Provide a bullet list of the most important points and takeaways from this chapter.`,
            adapter,
        );

        const chaptersText = results.map(c => `Chapter: ${c.title}\nKey Points: ${c.summary}`).join('\n\n');
        const synthesisPrompt = `You are a helpful assistant that extracts key points from YouTube video content.

Here is a video titled "${request.title}" with the following chapter key points:

${chaptersText}

Consolidate these chapter key points into a single, well-organized bullet list for the entire video. Remove duplicates, group related points, and ensure each point is concise and standalone. Focus on the most important and actionable information.`;
        const synthesisResponse = await adapter.processPromptToText(synthesisPrompt, 'getVideoSummary');

        return {
            summary: synthesisResponse.result,
            chapterSummaries: results,
            modelId,
            cost: { totalCost: totalCost + (synthesisResponse.cost?.totalCost ?? 0) },
        };
    },
};
