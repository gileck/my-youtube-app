import { AIAction, AIActionContext, AIActionResult } from './types';

const DEEP_EXPLAIN_PROMPT = `You are an expert educator. Explain the following video content simply and clearly.

Use this format:
- Start with a one-line intro summarizing what this section covers
- Break into numbered sections with emoji headings (## 🧠 1. Section Title)
- Use **bold** for key terms, *italic* for emphasis
- Use bullet points with emojis for lists
- Use > blockquotes for key ideas or memorable phrases from the speaker
- Include ### Example: subsections where helpful to illustrate a concept
- End with a ## 🧠 Final takeaway section with bullet points summarizing the key points
- After the final takeaway, add one line: 👉 *One sentence capturing the essential insight*

Keep it simple — explain like you're talking to a smart friend, not writing an academic paper. Make it scannable and enjoyable to read.`;

function buildPrompt(title: string, transcript: string, description?: string, chapterTitle?: string): string {
    const descLine = description ? `\nDescription: "${description}"\n` : '';
    const chapterLine = chapterTitle ? `\nChapter: "${chapterTitle}"\n` : '';
    return `${DEEP_EXPLAIN_PROMPT}

Video: "${title}"${descLine}${chapterLine}
Transcript:
${transcript}`;
}

export const deepExplainAction: AIAction = {
    cacheKey: 'video-deep-explain',
    cacheParams: (req) => ({ videoId: req.videoId, ...(req.chapterTitle && { chapter: req.chapterTitle }) }),

    async execute({ request, adapter, modelId }: AIActionContext): Promise<AIActionResult> {
        const prompt = buildPrompt(request.title, request.transcript, request.description, request.chapterTitle);
        const response = await adapter.processPromptToText(prompt, 'getVideoSummary');

        return {
            summary: response.result,
            modelId,
            cost: response.cost,
        };
    },
};
