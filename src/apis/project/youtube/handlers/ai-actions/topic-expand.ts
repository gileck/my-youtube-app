import { AIAction, AIActionContext, AIActionResult } from './types';

export const topicExpandAction: AIAction = {
    cacheKey: 'video-topic-expand',
    cacheParams: (req) => ({ videoId: req.videoId, topicTitle: req.topicTitle! }),

    validate: (req) => req.topicTitle ? null : 'topicTitle is required for topic-expand',

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const prompt = `You are a helpful assistant that provides detailed analysis of YouTube video content.

Video Title: ${request.title}

Transcript:
${request.transcript}

Provide a detailed explanation of the following topic discussed in this video: "${request.topicTitle}"

Include:
- What was specifically said about this topic
- Key details, examples, or data points mentioned
- Any conclusions or recommendations related to this topic

Be thorough and specific, referencing the actual content from the video.`;
        const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
        return { summary: response.result, modelId, cost: response.cost };
    },
};
