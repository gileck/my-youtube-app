import { AIModelAdapter } from '@/server/template/ai/baseModelAdapter';
import { TopicKeyPoint, AIOptions } from '../../types';

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

const LENGTH_INSTRUCTIONS: Record<string, string> = {
    short: 'Be very concise. Use fewer bullet points and shorter explanations. Aim for brevity.',
    medium: '',
    long: 'Be thorough and detailed. Include more bullet points, deeper explanations, and additional context.',
};

const LEVEL_INSTRUCTIONS: Record<string, string> = {
    beginner: 'Explain as if the reader has no prior knowledge of the subject. Use simple language and define any technical terms.',
    intermediate: '',
    advanced: 'Assume the reader has strong domain knowledge. Use technical terminology freely and focus on nuanced insights.',
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
    conversational: 'Use a casual, friendly tone — like explaining to a friend over coffee.',
    educational: 'Use a clear, structured teaching tone — like a tutor walking through concepts step by step.',
    professional: 'Use a formal, precise tone — like a research summary or professional briefing.',
};

export function buildOptionsPrompt(options?: AIOptions): string {
    if (!options) return '';
    const parts: string[] = [];
    if (options.length && LENGTH_INSTRUCTIONS[options.length]) parts.push(LENGTH_INSTRUCTIONS[options.length]);
    if (options.level && LEVEL_INSTRUCTIONS[options.level]) parts.push(LEVEL_INSTRUCTIONS[options.level]);
    if (options.style && STYLE_INSTRUCTIONS[options.style]) parts.push(STYLE_INSTRUCTIONS[options.style]);
    return parts.length > 0 ? '\n\nStyle guidelines:\n' + parts.join('\n') : '';
}

export function buildOptionsCacheKey(options?: AIOptions): Record<string, string> {
    if (!options) return {};
    const result: Record<string, string> = {};
    if (options.length && options.length !== 'medium') result.length = options.length;
    if (options.level && options.level !== 'intermediate') result.level = options.level;
    if (options.style && options.style !== 'conversational') result.style = options.style;
    return result;
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
