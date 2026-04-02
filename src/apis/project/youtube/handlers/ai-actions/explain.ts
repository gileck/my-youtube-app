import { AIAction, AIActionContext, AIActionResult } from './types';
import { extractJson } from './utils';
import type { ExplainPoint } from '../../types';

const EXPLAIN_PROMPT = `You are an expert educator who breaks down video content into easy-to-scan, insight-rich bullet points.

The transcript includes timestamps in [M:SS] format. Use these to identify when each point occurs.

Analyze the transcript and return a JSON object with:
- context: 2-3 sentences giving a high-level overview of what this section/chapter is about. What is the conversation about? What are the speakers discussing? This should give enough background that someone reading a single point can understand the broader topic.
- points: An array of key points, each with:
  - title: A short formal title (2-5 words) with an emoji prefix. Like a heading for the topic. (e.g. "🧠 Insulin Sensitivity Timing", "💪 Exercise Snacks", "😴 Sleep & Digestion")
  - timestamp: The timestamp in seconds (integer) of where this point appears in the video
  - bullets: An array of short bullet-point strings. EVERY bullet MUST start with an emoji. The FIRST bullet should be a casual conversational one-liner summarizing the main insight (use "..." or "but" to hint at nuance, e.g. "🧩 Meditation makes more sense once you separate states from traits"). The remaining bullets add key supporting points, details, and depth. EVERY bullet MUST use **bold** for key terms/concepts and *italic* for emphasis — this is critical for scannability. Keep each bullet to ONE line.
  - summary: ONE sentence that captures the real takeaway — the actionable bottom line. Use **bold** to highlight the most important part.
  - quote: A casual paraphrase of what they said in the video — conversational tone, not a verbatim transcript quote. This captures the speaker's voice/intent.

Return ONLY a JSON object with this exact structure:
{
  "context": "High-level overview of what this section discusses...",
  "points": [
    {
      "title": "🧠 Insulin Sensitivity",
      "timestamp": 125,
      "bullets": ["🧩 Meditation makes more sense once you separate states from traits", "🧠 **States** are temporary conditions like being awake, stressed, or calm", "📌 **Traits** are the more stable patterns that describe your usual baseline", "💡 Key point: you can't talk about meditation well unless you talk about *both*"],
      "summary": "One-sentence actionable bottom line",
      "quote": "Casual paraphrase of what they said about this topic"
    }
  ]
}

Important:
- context should be enough for someone to understand any single point without watching the video
- Titles should be casual and conversational, not academic
- Bullets should be scannable — one idea per line, short
- Summary is ONE sentence — the practical takeaway
- Quote is a paraphrase, not verbatim — capture their voice casually
- timestamp must be an integer (seconds from start of video)
- Return valid JSON only, no markdown fences`;

function buildPrompt(title: string, transcript: string, description?: string, chapterTitle?: string): string {
    const descLine = description ? `\nDescription: "${description}"\n` : '';
    const chapterLine = chapterTitle ? `\nChapter: "${chapterTitle}"\n` : '';
    return `${EXPLAIN_PROMPT}

Video: "${title}"${descLine}${chapterLine}
Transcript:
${transcript}`;
}

interface ParsedExplainResult {
    context: string;
    points: ExplainPoint[];
}

function parseExplainResult(text: string): ParsedExplainResult {
    const parsed = extractJson<Record<string, unknown>>(text, {});

    const context = String(parsed.context || '');

    const rawPoints = Array.isArray(parsed.points) ? parsed.points : [];
    const points = rawPoints.map(p => {
        const item = p as Record<string, unknown>;
        return {
            title: String(item.title || ''),
            timestamp: Number(item.timestamp) || 0,
            bullets: Array.isArray(item.bullets)
                ? item.bullets.map(b => String(b))
                : [],
            summary: String(item.summary || ''),
            quote: String(item.quote || ''),
        };
    });

    return { context, points };
}

export const explainAction: AIAction = {
    cacheKey: 'video-explain',
    cacheParams: (req) => ({ videoId: req.videoId, ...(req.chapterTitle && { chapter: req.chapterTitle }) }),

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const prompt = buildPrompt(request.title, request.transcript, request.description, request.chapterTitle);
        const response = await adapter.processPromptToText(prompt, 'getVideoSummary');
        const { context, points } = parseExplainResult(response.result);

        return {
            explainPoints: points,
            chapterContext: context,
            modelId,
            cost: response.cost,
        };
    },
};
