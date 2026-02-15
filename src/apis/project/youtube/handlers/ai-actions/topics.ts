import { AIAction, AIActionContext, AIActionResult } from './types';
import { extractJson, parseKeyPoints, parseChapterTopicJson } from './utils';
import { VideoTopic } from '../../types';

export const topicsAction: AIAction = {
    cacheKey: 'video-topics',
    cacheParams: (req) => ({ videoId: req.videoId }),

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const useChapterTopics = request.chapters && request.chapters.length > 1;

        if (useChapterTopics) {
            return executeChapterTopics({ request, adapter, modelId });
        }

        return executeSinglePassTopics({ request, adapter, modelId });
    },
};

async function executeSinglePassTopics({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
    const prompt = `You are a helpful assistant that identifies the main topics discussed in YouTube videos.

Video Title: ${request.title}

Transcript (includes [M:SS] timestamp markers approximately every 30 seconds):
${request.transcript}

Identify the main topics discussed in this video. For each topic provide:
- title: A short descriptive title (3-8 words)
- description: A 1-2 sentence description of what is discussed
- timestamp: The time in seconds where this topic begins, based on the [M:SS] markers above. Use the nearest preceding marker to determine the timestamp.
- keyPoints: An array of 2-10 key points for this topic (more for longer topics). Each key point has:
  - title: A short title (3-6 words)
  - text: A single concise sentence describing what is covered
  - timestamp: The time in seconds where this point is discussed, based on the [M:SS] markers

Return ONLY a JSON array, no other text. Example:
[{"title": "Introduction to the Subject", "description": "The host introduces the main theme and sets context.", "timestamp": 0, "keyPoints": [{"title": "Three Main Goals", "text": "The presenter outlines three main goals for the discussion.", "timestamp": 15}, {"title": "Why This Matters", "text": "Background context is provided on why this topic matters.", "timestamp": 45}]}]`;

    const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
    const parsed = extractJson<unknown[]>(response.result, []);
    const topics: VideoTopic[] = (Array.isArray(parsed) ? parsed : []).map(t => {
        const item = t as Record<string, unknown>;
        return {
            title: String(item.title || ''),
            description: String(item.description || ''),
            timestamp: Number(item.timestamp) || 0,
            keyPoints: parseKeyPoints(item.keyPoints),
        };
    });

    return {
        topics: topics.sort((a, b) => a.timestamp - b.timestamp),
        modelId,
        cost: response.cost,
    };
}

async function executeChapterTopics({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
    const chapters = request.chapters!;

    const chapterResponses = await Promise.all(
        chapters.map((ch, idx) => {
            const startSec = Number(ch.startTime) || 0;
            const endSec = idx + 1 < chapters.length
                ? Number(chapters[idx + 1].startTime) || 0
                : startSec + 3600;
            return adapter.processPromptToText(
                `You are a helpful assistant that analyzes YouTube video chapters.

Chapter: "${ch.title}"
Chapter time range: ${startSec} to ${endSec} seconds

Content (includes [M:SS] timestamp markers):
${ch.content}

IMPORTANT: To convert [M:SS] markers to seconds, use: minutes * 60 + seconds. For example [5:30] = 5*60+30 = 330 seconds. All timestamps MUST be within the chapter range (${startSec}-${endSec} seconds). Do NOT use timestamps outside this range.

Provide:
1. description: A 1-2 sentence description of what is discussed in this chapter
2. keyPoints: An array of 2-10 key points (more for longer chapters). Each has:
   - title: A short title (3-6 words)
   - text: A single concise sentence describing what is covered
   - timestamp: Time in seconds (converted from [M:SS] markers), must be between ${startSec} and ${endSec}

Return ONLY a JSON object (not array): {"description": "...", "keyPoints": [{"title": "Short Title", "text": "Description of what is covered.", "timestamp": 0}]}`,
                'getVideoSummary'
            );
        })
    );

    const totalCost = chapterResponses.reduce((sum, r) => sum + (r.cost?.totalCost ?? 0), 0);

    const topics: VideoTopic[] = chapterResponses.map((r, i) => {
        const startSec = Number(chapters[i].startTime) || 0;
        const endSec = i + 1 < chapters.length
            ? Number(chapters[i + 1].startTime) || 0
            : startSec + 3600;
        const parsed = parseChapterTopicJson(r.result);
        return {
            title: chapters[i].title,
            timestamp: startSec,
            description: parsed.description,
            keyPoints: parsed.keyPoints.map(kp => ({
                ...kp,
                timestamp: Math.min(Math.max(kp.timestamp, startSec), endSec),
            })),
        };
    });

    return {
        topics: topics.sort((a, b) => a.timestamp - b.timestamp),
        modelId,
        cost: { totalCost },
    };
}
