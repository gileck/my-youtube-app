import { AIAction, AIActionContext, AIActionResult } from './types';

export const subtopicExpandAction: AIAction = {
    cacheKey: 'video-subtopic-expand',
    cacheParams: (req) => ({ videoId: req.videoId, topicTitle: req.topicTitle! }),

    validate: (req) => req.topicTitle ? null : 'topicTitle is required for subtopic-expand',

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const prompt = `You are a helpful assistant that extracts key takeaways from YouTube video content.

Subtopic: "${request.topicTitle}"

Content:
${request.transcript}

Provide 3-7 key takeaways from this subtopic. Format as a markdown list where each takeaway has:
- A bold title (3-6 words)
- 1-2 sentences describing the insight, detail, or example mentioned

Example format:
- **Takeaway Title**: Description of what was discussed or explained about this point.
- **Another Point**: Further detail or example from the content.

Be specific and reference actual content. Do not add information not present in the content above.
If the content is too brief or lacks enough substance, return just 1-2 takeaways covering what is there. Never return meta-commentary about the content being too short.`;
        const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
        return { summary: response.result, modelId, cost: response.cost };
    },
};
