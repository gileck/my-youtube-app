import { AIModelAdapter } from '@/server/template/ai/baseModelAdapter';
import { TopicKeyPoint } from '../../types';

export async function processChaptersInParallel(
    chapters: Array<{ title: string; content: string }>,
    promptBuilder: (chapterTitle: string, content: string) => string,
    adapter: AIModelAdapter,
): Promise<{ results: Array<{ title: string; summary: string }>; totalCost: number }> {
    const responses = await Promise.all(
        chapters.map(ch =>
            adapter.processPromptToText(promptBuilder(ch.title, ch.content), 'getVideoSummary')
        )
    );
    const totalCost = responses.reduce((sum, r) => sum + (r.cost?.totalCost ?? 0), 0);
    const results = responses.map((r, i) => ({
        title: chapters[i].title,
        summary: r.result,
    }));
    return { results, totalCost };
}

export function extractJson<T>(text: string, fallback: T): T {
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1] : text;
    try {
        return JSON.parse(jsonStr.trim()) as T;
    } catch { /* return fallback */ }
    return fallback;
}

export function parseKeyPoints(raw: unknown): TopicKeyPoint[] {
    if (!Array.isArray(raw)) return [];
    return raw.map(kp => ({
        title: String(kp.title || ''),
        text: String(kp.text || ''),
        timestamp: Number(kp.timestamp) || 0,
    }));
}

export function parseChapterTopicJson(text: string): { description: string; keyPoints: TopicKeyPoint[] } {
    const parsed = extractJson<{ description?: string; keyPoints?: unknown }>(text, {});
    return {
        description: String(parsed.description || ''),
        keyPoints: parseKeyPoints(parsed.keyPoints),
    };
}
