import { API_GET_VIDEO_SUMMARY } from '../index';
import { AIActionType, ApiHandlerContext, GetVideoSummaryRequest, GetVideoSummaryResponse, VideoTopic, TopicKeyPoint } from '../types';
import { AIModelAdapter } from '@/server/ai/baseModelAdapter';
import { DEFAULT_MODEL_ID } from '@/common/ai/models';
import { youtubeCache, YOUTUBE_CACHE_TTL } from '@/server/youtube/youtubeCache';

const SINGLE_PASS_CHAR_LIMIT = 50000;

function parseKeyPoints(raw: unknown): TopicKeyPoint[] {
    if (!Array.isArray(raw)) return [];
    return raw.map(kp => ({
        text: String(kp.text || ''),
        timestamp: Number(kp.timestamp) || 0,
    }));
}

function parseTopicsJson(text: string): VideoTopic[] {
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1] : text;
    try {
        const parsed = JSON.parse(jsonStr.trim());
        if (Array.isArray(parsed)) {
            return parsed.map(t => ({
                title: String(t.title || ''),
                description: String(t.description || ''),
                timestamp: Number(t.timestamp) || 0,
                keyPoints: parseKeyPoints(t.keyPoints),
            }));
        }
    } catch { /* return empty */ }
    return [];
}

interface AIActionPrompts {
    singlePass: (title: string, transcript: string) => string;
    chapter: (chapterTitle: string, content: string) => string;
    synthesis: (videoTitle: string, results: Array<{ title: string; summary: string }>) => string;
}

const ACTION_PROMPTS: Partial<Record<AIActionType, AIActionPrompts>> = {
    summary: {
        singlePass: (title, transcript) =>
            `You are a helpful assistant that summarizes YouTube video content.

Video Title: ${title}

Transcript:
${transcript}

Please provide a concise summary of this video. Include:
1. A brief overview (2-3 sentences)
2. Key topics and main points discussed
3. Any notable conclusions or takeaways

Keep the summary informative but concise.`,
        chapter: (chapterTitle, content) =>
            `You are a helpful assistant that summarizes YouTube video content.

Summarize the following chapter titled "${chapterTitle}":

${content}

Provide a concise summary of this chapter's key points and takeaways.`,
        synthesis: (videoTitle, chapterSummaries) => {
            const chaptersText = chapterSummaries
                .map(c => `Chapter: ${c.title}\nSummary: ${c.summary}`)
                .join('\n\n');
            return `You are a helpful assistant that summarizes YouTube video content.

Here is a video titled "${videoTitle}" with the following chapter summaries:

${chaptersText}

Please provide a cohesive overall summary of this video. Include:
1. A brief overview (2-3 sentences)
2. Key topics and main points discussed
3. Any notable conclusions or takeaways

Keep the summary informative but concise.`;
        },
    },
    keypoints: {
        singlePass: (title, transcript) =>
            `You are a helpful assistant that extracts key points from YouTube video content.

Video Title: ${title}

Transcript:
${transcript}

Extract the key points from this video as a bullet list. Each point should be a concise, standalone insight or takeaway. Focus on the most important and actionable information.`,
        chapter: (chapterTitle, content) =>
            `You are a helpful assistant that extracts key points from YouTube video content.

Extract the key points from the following chapter titled "${chapterTitle}":

${content}

Provide a bullet list of the most important points and takeaways from this chapter.`,
        synthesis: (videoTitle, chapterResults) => {
            const chaptersText = chapterResults
                .map(c => `Chapter: ${c.title}\nKey Points: ${c.summary}`)
                .join('\n\n');
            return `You are a helpful assistant that extracts key points from YouTube video content.

Here is a video titled "${videoTitle}" with the following chapter key points:

${chaptersText}

Consolidate these chapter key points into a single, well-organized bullet list for the entire video. Remove duplicates, group related points, and ensure each point is concise and standalone. Focus on the most important and actionable information.`;
        },
    },
    topics: {
        singlePass: (title, transcript) =>
            `You are a helpful assistant that identifies the main topics discussed in YouTube videos.

Video Title: ${title}

Transcript (includes [M:SS] timestamp markers approximately every 30 seconds):
${transcript}

Identify the main topics discussed in this video. For each topic provide:
- title: A short descriptive title (3-8 words)
- description: A 1-2 sentence description of what is discussed
- timestamp: The time in seconds where this topic begins, based on the [M:SS] markers above. Use the nearest preceding marker to determine the timestamp.
- keyPoints: An array of 2-10 key points for this topic (more for longer topics). Each key point has:
  - text: A single concise sentence summarizing the point
  - timestamp: The time in seconds where this point is discussed, based on the [M:SS] markers

Return ONLY a JSON array, no other text. Example:
[{"title": "Introduction to the Subject", "description": "The host introduces the main theme and sets context.", "timestamp": 0, "keyPoints": [{"text": "The presenter outlines three main goals for the discussion.", "timestamp": 15}, {"text": "Background context is provided on why this topic matters.", "timestamp": 45}]}]`,
        chapter: (chapterTitle, content) =>
            `You are a helpful assistant that identifies the main topics discussed in YouTube videos.

Identify the main topics discussed in the following chapter titled "${chapterTitle}".

The content below includes timestamp markers in [M:SS] format showing when each section starts:

${content}

For each topic provide:
- title: A short descriptive title (3-8 words)
- description: A 1-2 sentence description of what is discussed
- timestamp: The time in seconds where this topic begins, based on the [M:SS] markers in the content
- keyPoints: An array of 2-10 key points for this topic (more for longer topics). Each key point has:
  - text: A single concise sentence summarizing the point
  - timestamp: The time in seconds where this point is discussed

Return ONLY a JSON array, no other text. Example:
[{"title": "Topic Name", "description": "Brief description.", "timestamp": 120, "keyPoints": [{"text": "Key insight from this section.", "timestamp": 130}]}]`,
        synthesis: (videoTitle, chapterResults) => {
            const chaptersText = chapterResults
                .map(c => `Chapter: ${c.title}\nTopics: ${c.summary}`)
                .join('\n\n');
            return `You are a helpful assistant that identifies the main topics discussed in YouTube videos.

Here is a video titled "${videoTitle}" with topics extracted from each chapter:

${chaptersText}

Consolidate these into a single unified JSON array of main topics for the entire video. Merge overlapping topics, remove duplicates, and ensure timestamps are preserved accurately.

For each topic provide:
- title: A short descriptive title (3-8 words)
- description: A 1-2 sentence description of what is discussed
- timestamp: The time in seconds where this topic begins
- keyPoints: An array of 2-10 key points for this topic (more for longer topics). Each key point has:
  - text: A single concise sentence summarizing the point
  - timestamp: The time in seconds where this point is discussed

Return ONLY a JSON array, no other text.`;
        },
    },
};

export const getVideoSummary = async (
    request: GetVideoSummaryRequest,
    _context: ApiHandlerContext
): Promise<GetVideoSummaryResponse> => {
    try {
        if (!request.videoId || !request.transcript) {
            return { error: "videoId and transcript are required" };
        }

        const actionType = request.actionType ?? 'summary';
        const modelId = DEFAULT_MODEL_ID;
        const adapter = new AIModelAdapter(modelId);

        // topic-expand: always single prompt, separate cache key
        if (actionType === 'topic-expand') {
            if (!request.topicTitle) {
                return { error: "topicTitle is required for topic-expand" };
            }
            const { data, isFromCache } = await youtubeCache.withCache(
                async () => {
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
                { key: 'video-topic-expand', params: { videoId: request.videoId, topicTitle: request.topicTitle } },
                { ttl: YOUTUBE_CACHE_TTL, bypassCache: request.bypassCache }
            );
            return { summary: data.summary, modelId: data.modelId, cost: data.cost, _isFromCache: isFromCache };
        }

        const prompts = ACTION_PROMPTS[actionType];
        if (!prompts) {
            return { error: `Unknown action type: ${actionType}` };
        }

        // Topics always use single-pass — timestamps are more accurate and results are
        // more cohesive when the AI sees the full transcript at once.
        const useChapterStrategy = actionType !== 'topics'
            && request.transcript.length > SINGLE_PASS_CHAR_LIMIT
            && request.chapters
            && request.chapters.length > 1;

        const { data, isFromCache } = await youtubeCache.withCache(
            async () => {
                if (!useChapterStrategy) {
                    const prompt = prompts.singlePass(request.title, request.transcript);
                    const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
                    return {
                        summary: response.result,
                        modelId,
                        cost: response.cost,
                    };
                }

                const chapters = request.chapters!;
                const chapterResponses = await Promise.all(
                    chapters.map(ch =>
                        adapter.processPromptToText(
                            prompts.chapter(ch.title, ch.content),
                            'getVideoSummary'
                        )
                    )
                );

                const chapterSummaries = chapterResponses.map((r, i) => ({
                    title: chapters[i].title,
                    summary: r.result,
                }));

                let totalCost = chapterResponses.reduce((sum, r) => sum + (r.cost?.totalCost ?? 0), 0);

                const synthesisPrompt = prompts.synthesis(request.title, chapterSummaries);
                const synthesisResponse = await adapter.processPromptToText(synthesisPrompt, 'getVideoSummary');
                totalCost += synthesisResponse.cost?.totalCost ?? 0;

                return {
                    summary: synthesisResponse.result,
                    chapterSummaries,
                    modelId,
                    cost: { totalCost },
                };
            },
            { key: `video-${actionType}`, params: { videoId: request.videoId } },
            { ttl: YOUTUBE_CACHE_TTL, bypassCache: request.bypassCache }
        );

        // For topics, parse JSON from the summary text and sort by timestamp
        if (actionType === 'topics') {
            const topics = parseTopicsJson(data.summary).sort((a, b) => a.timestamp - b.timestamp);
            return {
                topics,
                modelId: data.modelId,
                cost: data.cost,
                _isFromCache: isFromCache,
            };
        }

        return {
            summary: data.summary,
            chapterSummaries: data.chapterSummaries,
            modelId: data.modelId,
            cost: data.cost,
            _isFromCache: isFromCache,
        };
    } catch (error: unknown) {
        console.error("Get video summary error:", error);
        const msg = error instanceof Error ? error.message : "Failed to generate summary";
        return { error: msg };
    }
};

export { API_GET_VIDEO_SUMMARY };
