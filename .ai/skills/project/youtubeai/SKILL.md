---
name: youtubeai
description: How to integrate YouTubeAI (fetch video/transcript/chapters and run AI actions like summary, key points, topics, explain) into any web app. Use this when adding YouTube-based AI features to a new project.
title: YouTubeAI Integration Guide
summary: Framework-agnostic recipe for pulling YouTube metadata, transcripts and chapters via `youtubei.js`, combining them into chaptered transcripts, and running server-side AI actions (summary, keypoints, topics, explain) with caching and an optional remote-fetch fallback for blocked datacenters.
---

# YouTubeAI Integration Guide

A self-contained recipe for adding the YouTubeAI feature set — video search, video details, transcript + chapters, and AI analysis (summary / key points / topics / explain / deep-explain) — to any Node.js/TypeScript web app. All examples are generic; adapt the API transport, caching, and AI SDK wiring to fit your stack.

---

## 1. What you get

| Capability                | Source                                  |
| ------------------------- | --------------------------------------- |
| Search videos / channels  | `youtubei.js` (no API key required)     |
| Video details             | `youtubei.js`                           |
| Transcript (segments)     | `youtubei.js` `info.getTranscript()`    |
| Chapters                  | YouTube Data API v3 (`YOUTUBE_API_KEY`) — parsed from description, fallback: synthetic 10-min chapters |
| Combined chaptered transcript | Pure function over transcript + chapters |
| AI actions                | Any LLM SDK (OpenAI, Anthropic, AI SDK, etc.) |

Everything except AI must run **server-side** (youtubei.js is Node-only, and API keys must not leak to the client).

---

## 2. Dependencies

```bash
npm install youtubei.js
# choose your AI SDK; example uses the Vercel AI SDK
npm install ai @ai-sdk/openai
```

Environment variables:

```
YOUTUBE_API_KEY=...   # optional — only needed for real chapter parsing
OPENAI_API_KEY=...    # or your chosen provider key
```

> **Note on regions**: YouTube blocks many datacenter IPs (Vercel, AWS us-east-*). If `youtubei.js` fails in production with auth / "sign in to confirm" errors, see §7 (Remote daemon fallback).

---

## 3. Architecture

```
 Client (React/Vue/…)
      │  HTTP
      ▼
 /api/youtube/*                 ← your server routes
      │
      ├── fetchVideoDetails(videoId)
      ├── fetchTranscript(videoId)            → TranscriptSegment[]
      ├── fetchChapters(videoId)              → Chapter[]   (optional)
      ├── combineTranscriptAndChapters(...)   → ChaptersWithContent
      └── runAIAction(action, data)           → { summary | topics | … }
```

Keep the two concerns separate:

1. **Data layer** — pure functions that return transcript + chapters.
2. **AI layer** — takes the data layer output and runs prompts.

This lets you cache them independently (transcript rarely changes; AI outputs change per model and per options).

---

## 4. Core types (copy into your project)

```ts
// types.ts
export interface TranscriptSegment {
  start_seconds: number;
  end_seconds: number;
  text: string;
  start_time_text: string;  // "05:30"
}

export interface Chapter {
  title: string;
  startTime: number;  // seconds
  endTime: number;    // seconds (Number.MAX_SAFE_INTEGER for last chapter)
}

export interface ChapterWithContent extends Chapter {
  content: string;
  segments: TranscriptSegment[];
}

export interface CombinedTranscriptChapters {
  videoId: string;
  metadata: {
    totalDuration: number;
    chapterCount: number;
    transcriptItemCount: number;
  };
  chapters: ChapterWithContent[];
  transcript: TranscriptSegment[];
}

export type AIActionType = 'summary' | 'keypoints' | 'topics' | 'explain';
export interface AIOptions {
  length?: 'short' | 'medium' | 'long';
  level?: 'beginner' | 'intermediate' | 'advanced';
  style?: 'conversational' | 'educational' | 'professional';
}
```

---

## 5. Server: YouTube adapter

Single lazy `Innertube` instance; reuse across requests.

```ts
// server/youtube/adapter.ts
import { Innertube, YTNodes } from 'youtubei.js';

let innertubePromise: Promise<Innertube> | null = null;
const getInnertube = () =>
  (innertubePromise ??= Innertube.create({ lang: 'en', location: 'US' }));

export async function searchVideos(query: string) {
  const yt = await getInnertube();
  const results = await yt.search(query, { type: 'video' });
  return results.results
    .filter((r): r is YTNodes.Video => r.type === 'Video')
    .map((v) => ({
      id: v.id,
      title: v.title?.text ?? '',
      thumbnailUrl: v.thumbnails?.[0]?.url ?? '',
      channelTitle: v.author?.name ?? '',
      viewCount: v.view_count?.text ?? '0',
      duration: v.duration?.text ?? '',
      publishedAt: v.published?.text ?? '',
    }));
}

export async function getVideoDetails(videoId: string) {
  const yt = await getInnertube();
  const info = await yt.getInfo(videoId);
  return {
    id: info.basic_info.id ?? videoId,
    title: info.basic_info.title ?? '',
    description: info.secondary_info?.description?.text ?? '',
    channelId: info.basic_info.channel?.id ?? '',
    channelTitle: info.basic_info.channel?.name ?? '',
    duration: info.basic_info.duration ?? 0,
    viewCount: String(info.basic_info.view_count ?? 0),
    thumbnailUrl: info.basic_info.thumbnail?.[0]?.url ?? '',
  };
}
```

---

## 6. Server: transcript + chapters

### 6.1 Transcript via youtubei.js

```ts
// server/youtube/transcript.ts
import { Innertube, YTNodes } from 'youtubei.js';
import type { TranscriptSegment } from './types';

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const yt = await Innertube.create({ lang: 'en', location: 'US', retrieve_player: false });
  const info = await yt.getInfo(videoId);
  const tx = await info.getTranscript();
  const segments = tx.transcript?.content?.body?.initial_segments ?? [];

  const out: TranscriptSegment[] = [];
  for (const raw of segments) {
    if (raw?.type !== 'TranscriptSegment') continue;
    const seg = raw as YTNodes.TranscriptSegment;
    const start = Number(seg.start_ms ?? 0) / 1000;
    const end = Number(seg.end_ms ?? 0) / 1000;
    out.push({
      start_seconds: start,
      end_seconds: end,
      text: String(seg.snippet?.text ?? ''),
      start_time_text: String(seg.start_time_text?.text ?? formatTime(start)),
    });
  }
  return out;
}
```

### 6.2 Chapters via YouTube Data API (optional)

Chapters live in the description as timestamped lines. You can parse them yourself, or skip chapters entirely and fall back to synthetic 10-minute buckets (§6.3).

```ts
// server/youtube/chapters.ts
import type { Chapter } from './types';

const TIMESTAMP_RE = /^(?:\((\d{1,2}):(\d{2})(?::(\d{2}))?\)|(\d{1,2}):(\d{2})(?::(\d{2}))?)\s+(.+)$/;

export function parseChaptersFromDescription(description: string): Chapter[] {
  const raw: Array<{ title: string; start: number }> = [];
  for (const line of description.split('\n')) {
    const m = line.trim().match(TIMESTAMP_RE);
    if (!m) continue;
    const [, h1, m1, s1, h2, m2, s2, title] = m;
    const hours = Number(h1 ?? h2 ?? 0);
    const mins = Number(m1 ?? m2 ?? 0);
    const secs = Number(s1 ?? s2 ?? 0);
    raw.push({ title: title.trim(), start: hours * 3600 + mins * 60 + secs });
  }
  return raw.map((c, i) => ({
    title: c.title,
    startTime: c.start,
    endTime: raw[i + 1]?.start ?? Number.MAX_SAFE_INTEGER,
  }));
}

export async function fetchChapters(videoId: string): Promise<Chapter[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(
      videoId,
    )}&key=${apiKey}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  const desc = data.items?.[0]?.snippet?.description ?? '';
  return parseChaptersFromDescription(desc);
}
```

### 6.3 Combine transcript + chapters

```ts
// server/youtube/combine.ts
import type { TranscriptSegment, Chapter, ChapterWithContent, CombinedTranscriptChapters } from './types';

const SYNTHETIC_CHAPTER_SECONDS = 600;

export function combine(
  videoId: string,
  transcript: TranscriptSegment[],
  chapters: Chapter[],
): CombinedTranscriptChapters {
  const sorted = [...transcript].sort((a, b) => a.start_seconds - b.start_seconds);
  const totalDuration = sorted.at(-1)?.end_seconds ?? 0;

  // Fall back to synthetic chapters when none are published.
  const effective: Chapter[] = chapters.length
    ? chapters
    : Array.from({ length: Math.max(1, Math.ceil(totalDuration / SYNTHETIC_CHAPTER_SECONDS)) }, (_, i) => ({
        title: `Chapter ${i + 1}`,
        startTime: i * SYNTHETIC_CHAPTER_SECONDS,
        endTime: Math.min((i + 1) * SYNTHETIC_CHAPTER_SECONDS, totalDuration),
      }));

  const buckets: ChapterWithContent[] = effective.map((c) => ({ ...c, content: '', segments: [] }));

  for (const seg of sorted) {
    const ch = buckets.find(
      (b) => seg.start_seconds >= b.startTime - 1 && seg.start_seconds <= b.endTime + 1,
    );
    if (!ch) continue;
    ch.segments.push(seg);
    ch.content = ch.content ? `${ch.content} ${seg.text}` : seg.text;
  }

  return {
    videoId,
    metadata: {
      totalDuration,
      chapterCount: buckets.length,
      transcriptItemCount: sorted.length,
    },
    chapters: buckets,
    transcript: sorted,
  };
}
```

---

## 7. Datacenter-IP fallback (optional but important)

YouTube frequently blocks cloud IPs. Two proven workarounds:

1. **Captions XML fallback** — call `https://www.youtube.com/api/timedtext?...` directly with the caption track URL from `info.captions`. Less featured but often unblocked.
2. **Remote daemon (RPC over MongoDB/Redis)** — run a tiny worker on a residential IP (your laptop, a home server) that polls a queue, fetches the transcript, and writes the result back. The web server waits on the queue. This is how this project does it in production.

Keep the interface stable: `fetchTranscript(videoId) → TranscriptSegment[]`. Swap the implementation at deploy time.

---

## 8. AI actions

Keep each action as an isolated module with a single `execute(ctx)` method so you can add/remove actions without touching the HTTP layer.

### 8.1 Action interface

```ts
// server/ai-actions/types.ts
import type { CombinedTranscriptChapters, AIOptions } from '../youtube/types';

export const SINGLE_PASS_CHAR_LIMIT = 50_000; // switch to per-chapter above this

export interface AIActionRequest {
  videoId: string;
  title: string;
  transcript: string;                     // the full transcript as one string
  chapters?: Array<{ title: string; content: string; startTime: number }>;
  aiOptions?: AIOptions;
}

export interface AIActionResult {
  summary?: string;
  chapterSummaries?: Array<{ title: string; summary: string }>;
  topics?: Array<{ title: string; description: string; timestamp: number; keyPoints: unknown[] }>;
  cost?: { totalCost: number };
}

export interface LLM {
  // Abstract over the SDK — pass a thin wrapper.
  prompt(text: string): Promise<{ result: string; cost?: { totalCost: number } }>;
}

export interface AIAction {
  execute(req: AIActionRequest, llm: LLM): Promise<AIActionResult>;
}
```

### 8.2 LLM wrapper (Vercel AI SDK example)

```ts
// server/ai-actions/llm.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { LLM } from './types';

export const createLLM = (model = 'gpt-4o-mini'): LLM => ({
  async prompt(text) {
    const { text: result, usage } = await generateText({ model: openai(model), prompt: text });
    return {
      result,
      cost: { totalCost: (usage?.totalTokens ?? 0) * 0.0000005 },
    };
  },
});
```

### 8.3 Summary action

```ts
// server/ai-actions/summary.ts
import type { AIAction, AIActionResult } from './types';
import { SINGLE_PASS_CHAR_LIMIT } from './types';

export const summaryAction: AIAction = {
  async execute(req, llm): Promise<AIActionResult> {
    const shouldMap = req.transcript.length > SINGLE_PASS_CHAR_LIMIT && (req.chapters?.length ?? 0) > 1;

    if (!shouldMap) {
      const { result, cost } = await llm.prompt(
        `Summarize this YouTube video.\n\nTitle: ${req.title}\n\nTranscript:\n${req.transcript}\n\nInclude: (1) 2–3 sentence overview, (2) main points, (3) takeaways.`,
      );
      return { summary: result, cost };
    }

    // Map-reduce over chapters for long videos.
    const chapterResults = await Promise.all(
      req.chapters!.map(async (c) => {
        const r = await llm.prompt(
          `Summarize this chapter titled "${c.title}":\n\n${c.content}`,
        );
        return { title: c.title, summary: r.result, cost: r.cost?.totalCost ?? 0 };
      }),
    );

    const merged = chapterResults
      .map((c) => `Chapter: ${c.title}\nSummary: ${c.summary}`)
      .join('\n\n');
    const final = await llm.prompt(
      `Here are chapter summaries for "${req.title}":\n\n${merged}\n\nProvide a cohesive overall summary (overview, main points, takeaways).`,
    );

    return {
      summary: final.result,
      chapterSummaries: chapterResults.map(({ title, summary }) => ({ title, summary })),
      cost: {
        totalCost: chapterResults.reduce((s, c) => s + c.cost, 0) + (final.cost?.totalCost ?? 0),
      },
    };
  },
};
```

### 8.4 Topics action (structured JSON)

When you want structured output, ask for `Return ONLY a JSON array`, then parse defensively:

```ts
// server/ai-actions/topics.ts
import type { AIAction } from './types';

function extractJson<T>(text: string, fallback: T): T {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < 0) return fallback;
  try { return JSON.parse(text.slice(start, end + 1)) as T; } catch { return fallback; }
}

export const topicsAction: AIAction = {
  async execute(req, llm) {
    const { result, cost } = await llm.prompt(
      `Identify main topics in this video. For each topic: title, description (1–2 sentences), timestamp (seconds, from [M:SS] markers in the transcript), keyPoints array.

Title: ${req.title}
Transcript (with [M:SS] markers):
${req.transcript}

Return ONLY a JSON array: [{"title":"","description":"","timestamp":0,"keyPoints":[{"title":"","text":"","timestamp":0}]}]`,
    );
    return { topics: extractJson(result, []), cost };
  },
};
```

Key points, explain, and deep-explain follow the same pattern — change the prompt, keep the contract.

### 8.5 Registry

```ts
// server/ai-actions/index.ts
import { summaryAction } from './summary';
import { topicsAction } from './topics';
import type { AIAction } from './types';
import type { AIActionType } from '../youtube/types';

export const AI_ACTIONS: Record<AIActionType, AIAction> = {
  summary: summaryAction,
  keypoints: summaryAction,   // same shape, different prompt
  topics: topicsAction,
  explain: summaryAction,     // replace with your explain action
};
```

---

## 9. Wiring it up (Next.js App Router example)

```ts
// app/api/youtube/transcript/route.ts
import { NextRequest } from 'next/server';
import { fetchTranscript } from '@/server/youtube/transcript';
import { fetchChapters } from '@/server/youtube/chapters';
import { combine } from '@/server/youtube/combine';

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });

  const [transcript, chapters] = await Promise.all([fetchTranscript(videoId), fetchChapters(videoId)]);
  return Response.json(combine(videoId, transcript, chapters));
}
```

```ts
// app/api/youtube/ai/route.ts
import { NextRequest } from 'next/server';
import { AI_ACTIONS } from '@/server/ai-actions';
import { createLLM } from '@/server/ai-actions/llm';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = AI_ACTIONS[body.actionType as keyof typeof AI_ACTIONS];
  if (!action) return Response.json({ error: 'unknown action' }, { status: 400 });
  const result = await action.execute(body, createLLM(body.modelId));
  return Response.json(result);
}
```

---

## 10. Client usage (generic)

```ts
// client/youtubeai.ts
export async function getChaptersAndTranscript(videoId: string) {
  const res = await fetch(`/api/youtube/transcript?videoId=${videoId}`);
  return res.json();
}

export async function runAIAction(actionType: string, payload: {
  videoId: string;
  title: string;
  transcript: string;
  chapters?: { title: string; content: string; startTime: number }[];
  modelId?: string;
}) {
  const res = await fetch('/api/youtube/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, ...payload }),
  });
  return res.json();
}

// Example flow:
// 1. const combined = await getChaptersAndTranscript(videoId);
// 2. const txt = combined.transcript.map(s => s.text).join(' ');
// 3. const { summary } = await runAIAction('summary', { videoId, title, transcript: txt, chapters: combined.chapters });
```

---

## 11. Caching

Cache the two layers separately:

| Data            | Cache key                                          | TTL       |
| --------------- | -------------------------------------------------- | --------- |
| Video details   | `yt:videoDetails:{videoId}`                        | 24h–7d    |
| Transcript      | `yt:transcript:{videoId}`                          | 30d (immutable unless re-uploaded) |
| Chapters        | `yt:chapters:{videoId}`                            | 30d       |
| AI result       | `ai:{actionType}:{videoId}:{modelId}:{optionsHash}` | ∞ (invalidate on model upgrade) |

Recommended: store AI results in durable storage (S3, DB) keyed per `(videoId, modelId, action, options)`, and maintain a "latest" pointer (without `modelId`) so when a new user opens the video they auto-load the most recent cached result for free.

---

## 12. Timestamp markers for the LLM

For the `topics` / `explain` actions, inject `[M:SS]` markers into the transcript every ~30 seconds before prompting. This gives the model precise timestamps to cite. Generate them when you flatten transcript segments:

```ts
function transcriptWithMarkers(segments: TranscriptSegment[], everySeconds = 30): string {
  let next = 0;
  const parts: string[] = [];
  for (const s of segments) {
    if (s.start_seconds >= next) {
      const m = Math.floor(s.start_seconds / 60);
      const sec = Math.floor(s.start_seconds % 60);
      parts.push(`[${m}:${String(sec).padStart(2, '0')}]`);
      next = s.start_seconds + everySeconds;
    }
    parts.push(s.text);
  }
  return parts.join(' ');
}
```

---

## 13. Checklist when adding to a new app

- [ ] Install `youtubei.js` and an AI SDK.
- [ ] Copy `types.ts`, the adapter, transcript, chapters and combine modules.
- [ ] Add an HTTP route that returns combined transcript + chapters for a `videoId`.
- [ ] Pick an AI SDK, write the `LLM` wrapper.
- [ ] Copy one action (summary) end-to-end, verify cost and output.
- [ ] Add caching for transcript and AI results (separately).
- [ ] Add the remaining actions by cloning the summary action and changing the prompt.
- [ ] Decide on a datacenter-IP fallback strategy before deploying to Vercel/AWS.
- [ ] Never expose `OPENAI_API_KEY` / `YOUTUBE_API_KEY` to the client — all fetch + AI calls stay server-side.

---

## 14. Gotchas

- **`Innertube.create()` is expensive.** Memoize one promise per process.
- **Transcript may be missing.** Not all videos have captions; handle `getTranscript()` throwing and surface a clean error.
- **Chapters may be missing.** Treat as optional; fall back to synthetic 10-minute buckets so the AI map-reduce path still works.
- **Long videos blow the context window.** Use the map-reduce pattern (per-chapter summaries → synthesis) above the `SINGLE_PASS_CHAR_LIMIT` (~50k chars).
- **JSON outputs drift.** Always wrap parsing in a defensive `extractJson` helper with a fallback.
- **Rate limits.** Both YouTube Data API (10k units/day default) and your LLM have quotas. Cache aggressively.
