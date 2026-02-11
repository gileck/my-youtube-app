#!/usr/bin/env tsx
/**
 * Test script for the "Main Topics" AI action.
 *
 * Usage:
 *   yarn tsx scripts/test-topics.ts <videoId>
 *
 * Tests BOTH single-pass and chapter strategy to compare results.
 * Outputs files under scripts/test-topics-output/
 */

import '../src/agents/shared/loadEnv';
import * as fs from 'fs';
import * as path from 'path';
import { getChaptersTranscripts } from '@/server/youtube/chaptersTranscriptService';
import { AIModelAdapter } from '@/server/ai/baseModelAdapter';
import { DEFAULT_MODEL_ID } from '@/common/ai/models';
import type { TranscriptSegment, ChapterWithContent } from '@/server/youtube/types';

// ── helpers ──────────────────────────────────────────────────

const TIMESTAMP_INTERVAL = 30;
const SINGLE_PASS_CHAR_LIMIT = 50000;

function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function buildTimestampedTranscript(segments: TranscriptSegment[]): string {
    let lastMarker = -TIMESTAMP_INTERVAL;
    return segments.map(s => {
        if (s.start_seconds - lastMarker >= TIMESTAMP_INTERVAL) {
            lastMarker = s.start_seconds;
            return `\n[${fmt(s.start_seconds)}] ${s.text}`;
        }
        return s.text;
    }).join(' ');
}

function parseTopics(text: string) {
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1] : text;
    try {
        const parsed = JSON.parse(jsonStr.trim());
        if (Array.isArray(parsed)) {
            return parsed
                .map(t => ({
                    title: String(t.title || ''),
                    description: String(t.description || ''),
                    timestamp: Number(t.timestamp) || 0,
                }))
                .sort((a, b) => a.timestamp - b.timestamp);
        }
    } catch { /* ignore */ }
    return [];
}

// ── prompts (matching server) ────────────────────────────────

function singlePassPrompt(title: string, transcript: string): string {
    return `You are a helpful assistant that identifies the main topics discussed in YouTube videos.

Video Title: ${title}

Transcript (includes [M:SS] timestamp markers approximately every 30 seconds):
${transcript}

Identify the main topics discussed in this video. For each topic provide:
- title: A short descriptive title (3-8 words)
- description: A 1-2 sentence description of what is discussed
- timestamp: The time in seconds where this topic begins, based on the [M:SS] markers above. Use the nearest preceding marker to determine the timestamp.

Return ONLY a JSON array, no other text. Example:
[{"title": "Introduction to the Subject", "description": "The host introduces the main theme and sets context.", "timestamp": 0}, {"title": "Deep Dive into Feature", "description": "Detailed walkthrough of the new feature.", "timestamp": 185}]`;
}

function chapterPrompt(chapterTitle: string, content: string): string {
    return `You are a helpful assistant that identifies the main topics discussed in YouTube videos.

Identify the main topics discussed in the following chapter titled "${chapterTitle}".

The content below includes timestamp markers in [M:SS] format showing when each section starts:

${content}

For each topic provide:
- title: A short descriptive title (3-8 words)
- description: A 1-2 sentence description of what is discussed
- timestamp: The time in seconds where this topic begins, based on the [M:SS] markers in the content

Return ONLY a JSON array, no other text. Example:
[{"title": "Topic Name", "description": "Brief description.", "timestamp": 120}]`;
}

function synthesisPrompt(videoTitle: string, chapterResults: Array<{ title: string; summary: string }>): string {
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

Return ONLY a JSON array, no other text.`;
}

// ── main ─────────────────────────────────────────────────────

async function main() {
    const videoId = process.argv[2];
    if (!videoId) {
        console.error('Usage: yarn tsx scripts/test-topics.ts <videoId>');
        process.exit(1);
    }

    const outDir = path.join(__dirname, 'test-topics-output');
    fs.mkdirSync(outDir, { recursive: true });

    // 1. Fetch transcript
    console.log(`Fetching transcript for ${videoId}...`);
    const { data: transcriptData } = await getChaptersTranscripts(videoId, {
        overlapOffsetSeconds: 5,
        segmentsPerChapter: 30,
        totalChapters: 0,
    });

    if (!transcriptData.transcript || transcriptData.transcript.length === 0) {
        console.error('No transcript available for this video.');
        process.exit(1);
    }

    const chapters = transcriptData.chapters;
    const adapter = new AIModelAdapter(DEFAULT_MODEL_ID);
    const title = `Video ${videoId}`;

    // 2. Build timestamped transcript (full)
    const timestamped = buildTimestampedTranscript(transcriptData.transcript);
    fs.writeFileSync(path.join(outDir, `transcript-${videoId}.txt`), timestamped, 'utf-8');

    console.log(`  Segments: ${transcriptData.transcript.length}`);
    console.log(`  Full transcript chars: ${timestamped.length}`);
    console.log(`  Chapters: ${chapters.length}`);

    const useChapterStrategy = timestamped.length > SINGLE_PASS_CHAR_LIMIT && chapters.length > 1;
    console.log(`  Strategy: ${useChapterStrategy ? 'CHAPTER' : 'SINGLE-PASS'}`);

    if (!useChapterStrategy) {
        // Single-pass
        console.log(`\nCalling AI (single-pass)...`);
        const response = await adapter.processPromptToText(singlePassPrompt(title, timestamped), 'getVideoSummary');
        const topics = parseTopics(response.result);
        fs.writeFileSync(path.join(outDir, `topics-${videoId}.json`), JSON.stringify(topics, null, 2), 'utf-8');
        console.log(`\n── Results (${topics.length} topics) ──`);
        for (const t of topics) console.log(`  [${fmt(t.timestamp)}] ${t.title}`);
        console.log(`\nCost: $${response.cost.totalCost.toFixed(4)}`);
        return;
    }

    // Chapter strategy
    console.log(`\n── Chapter strategy ──`);

    // 2a. Build timestamped content per chapter and inspect
    const chapterContents: Array<{ title: string; content: string; ch: ChapterWithContent }> = chapters.map(c => ({
        title: c.title,
        content: buildTimestampedTranscript(c.segments),
        ch: c,
    }));

    // Save chapter transcripts for inspection
    const chapterTranscriptsFile = path.join(outDir, `chapter-transcripts-${videoId}.txt`);
    const chapterTranscriptsDump = chapterContents.map((c, i) => {
        const firstSeg = c.ch.segments[0];
        const lastSeg = c.ch.segments[c.ch.segments.length - 1];
        return [
            `=== Chapter ${i + 1}: "${c.title}" ===`,
            `  startTime: ${c.ch.startTime}s (${fmt(c.ch.startTime)})`,
            `  segments: ${c.ch.segments.length}`,
            `  first segment start_seconds: ${firstSeg?.start_seconds}`,
            `  last segment start_seconds: ${lastSeg?.start_seconds}`,
            `  content length: ${c.content.length} chars`,
            `  content preview: ${c.content.slice(0, 200)}...`,
            '',
        ].join('\n');
    }).join('\n');
    fs.writeFileSync(chapterTranscriptsFile, chapterTranscriptsDump, 'utf-8');
    console.log(`Chapter transcripts saved to ${chapterTranscriptsFile}`);

    // 2b. Process first 3 chapters to inspect individual AI responses
    console.log(`\nProcessing first 3 chapters individually...`);
    const sampleChapters = chapterContents.slice(0, 3);
    for (const c of sampleChapters) {
        console.log(`\n  Chapter: "${c.title}" (starts at ${fmt(c.ch.startTime)})`);
        const resp = await adapter.processPromptToText(chapterPrompt(c.title, c.content), 'getVideoSummary');
        const chTopics = parseTopics(resp.result);
        console.log(`  Raw response: ${resp.result.slice(0, 300)}...`);
        console.log(`  Parsed topics:`);
        for (const t of chTopics) {
            console.log(`    [${fmt(t.timestamp)}] ${t.title}`);
        }
    }

    // 2c. Full chapter strategy
    console.log(`\nProcessing all ${chapters.length} chapters...`);
    const chapterResponses = await Promise.all(
        chapterContents.map(c =>
            adapter.processPromptToText(chapterPrompt(c.title, c.content), 'getVideoSummary')
        )
    );

    const chapterSummaries = chapterResponses.map((r, i) => ({
        title: chapterContents[i].title,
        summary: r.result,
    }));

    // Save per-chapter results
    const perChapterFile = path.join(outDir, `per-chapter-topics-${videoId}.json`);
    const perChapterParsed = chapterSummaries.map(c => ({
        chapter: c.title,
        topics: parseTopics(c.summary),
    }));
    fs.writeFileSync(perChapterFile, JSON.stringify(perChapterParsed, null, 2), 'utf-8');
    console.log(`Per-chapter topics saved to ${perChapterFile}`);

    // Synthesis
    console.log(`\nRunning synthesis...`);
    const synthResp = await adapter.processPromptToText(
        synthesisPrompt(title, chapterSummaries),
        'getVideoSummary'
    );
    const topics = parseTopics(synthResp.result);
    fs.writeFileSync(path.join(outDir, `topics-${videoId}.json`), JSON.stringify(topics, null, 2), 'utf-8');

    console.log(`\n── Final Results (${topics.length} topics) ──`);
    for (const t of topics) {
        console.log(`  [${fmt(t.timestamp)}] ${t.title} — ${t.description}`);
    }

    const totalCost = chapterResponses.reduce((s, r) => s + r.cost.totalCost, 0) + synthResp.cost.totalCost;
    console.log(`\nTotal cost: $${totalCost.toFixed(4)}`);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
