import { fetchTranscript } from './transcript/youtubeTranscriptService';
import { fetchTranscriptViaCaptions } from './transcript/captionsTranscriptService';
import { fetchChapters } from './chapters/chaptersService';
import type { Chapter, ChapterWithContent, CombinedTranscriptChapters, TranscriptSegment } from './types';

import type { CacheResult } from '@/common/cache/types';
import type { TranscriptResponse } from './transcript/youtubeTranscriptService';
import { callRemote } from '@/server/rpc';

const chapterFilterConfig = {
  filteredPhrases: ['sponsor', 'advertisement', 'ad break', 'promotion'],
  filteredTranscriptPhrases: [
    'is sponsored by',
    'this video is sponsored by',
    "today's sponsor",
    'special thanks to our sponsor',
  ],
};

export function splitTranscriptToChapters(
  transcript: TranscriptSegment[],
  videoId: string,
  options: {
    overlapOffsetSeconds: number;
    chapterDurationSeconds?: number;
    segmentsPerChapter?: number;
    totalChapters?: number;
  } = {
    overlapOffsetSeconds: 5,
    chapterDurationSeconds: 600,
    segmentsPerChapter: 30,
    totalChapters: 0,
  }
): CombinedTranscriptChapters {
  if (!transcript || transcript.length === 0) {
    return {
      videoId,
      metadata: {
        totalDuration: 0,
        chapterCount: 0,
        transcriptItemCount: 0,
        overlapOffsetSeconds: options.overlapOffsetSeconds,
      },
      chapters: [],
      transcript: [],
      error: 'No transcript available to split into chapters',
    };
  }

  const sortedTranscript = [...transcript].sort((a, b) => a.start_seconds - b.start_seconds);
  const lastItem = sortedTranscript[sortedTranscript.length - 1];
  const totalDuration = lastItem.end_seconds;

  const chapterDuration = options.chapterDurationSeconds || 600;
  const totalChapters = Math.ceil(totalDuration / chapterDuration);

  const artificialChapters: Chapter[] = [];
  for (let i = 0; i < totalChapters; i++) {
    const startTime = i * chapterDuration;
    const endTime = Math.min((i + 1) * chapterDuration, totalDuration);
    const startMinutes = Math.floor(startTime / 60);
    const startSeconds = Math.floor(startTime % 60);
    const formattedTime = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`;

    artificialChapters.push({
      title: `Chapter ${i + 1} (${formattedTime})`,
      startTime,
      endTime,
    });
  }

  const chaptersWithOverlap = applyChapterOverlap(artificialChapters, options.overlapOffsetSeconds);
  const chaptersWithContent = initializeChaptersWithContent(chaptersWithOverlap);

  for (const segment of sortedTranscript) {
    if (shouldFilterTranscriptItem(segment.text)) continue;

    for (const chapter of chaptersWithContent) {
      if (segment.start_seconds >= chapter.startTime && segment.start_seconds <= chapter.endTime) {
        chapter.segments.push({
          text: segment.text,
          start_seconds: segment.start_seconds,
          end_seconds: segment.end_seconds,
          start_time_text: segment.start_time_text,
        });

        if (!chapter.content) {
          chapter.content = segment.text;
        } else {
          chapter.content += ' ' + segment.text;
        }
      }
    }
  }

  return finalizeOutput(chaptersWithContent, transcript, videoId, {
    overlapOffsetSeconds: options.overlapOffsetSeconds,
  });
}

function applyChapterOverlap(chapters: Chapter[], overlapOffsetSeconds: number): Chapter[] {
  return chapters.map((chapter, index) => {
    const adjustedStartTime =
      index === 0 ? chapter.startTime : Math.max(0, chapter.startTime - overlapOffsetSeconds);
    const adjustedEndTime = chapter.endTime + overlapOffsetSeconds;

    return {
      ...chapter,
      startTime: adjustedStartTime,
      endTime: adjustedEndTime,
    };
  });
}

function initializeChaptersWithContent(chapters: Chapter[]): ChapterWithContent[] {
  return chapters.map((chapter) => ({
    title: chapter.title,
    startTime: chapter.startTime,
    endTime: chapter.endTime,
    content: '',
    segments: [],
  }));
}

function shouldFilterChapter(chapterTitle: string): boolean {
  const normalizedTitle = chapterTitle.toLowerCase();
  return chapterFilterConfig.filteredPhrases.some((phrase) =>
    normalizedTitle.includes(phrase.toLowerCase())
  );
}

function shouldFilterTranscriptItem(transcriptText: string): boolean {
  const normalizedText = transcriptText.toLowerCase();
  return chapterFilterConfig.filteredTranscriptPhrases.some((phrase) =>
    normalizedText.includes(phrase.toLowerCase())
  );
}

function finalizeOutput(
  chaptersWithContent: ChapterWithContent[],
  transcript: TranscriptSegment[],
  videoId: string,
  options: { overlapOffsetSeconds: number }
): CombinedTranscriptChapters {
  const lastChapter = chaptersWithContent[chaptersWithContent.length - 1];
  const totalDuration =
    lastChapter.endTime === Number.MAX_SAFE_INTEGER
      ? lastChapter.startTime + 300
      : lastChapter.endTime;

  const processedChapters = chaptersWithContent.map((chapter) => {
    const sortedSegments = [...chapter.segments].sort(
      (a, b) => a.start_seconds - b.start_seconds
    );
    const content = sortedSegments.map((segment) => segment.text).join(' ');

    return {
      title: chapter.title,
      startTime: chapter.startTime,
      endTime: chapter.endTime,
      content: content.trim(),
      segments: sortedSegments,
    };
  });

  return {
    videoId,
    metadata: {
      totalDuration,
      chapterCount: chaptersWithContent.length,
      transcriptItemCount: transcript.length,
      overlapOffsetSeconds: options.overlapOffsetSeconds,
    },
    chapters: processedChapters,
    transcript,
  };
}

function combineTranscriptAndChapters(
  transcript: TranscriptSegment[],
  chapters: Chapter[],
  videoId: string,
  options: { overlapOffsetSeconds: number } = { overlapOffsetSeconds: 5 }
): CombinedTranscriptChapters {
  if (!transcript.length || !chapters.length) {
    return {
      transcript: [],
      videoId,
      metadata: {
        totalDuration: 0,
        chapterCount: 0,
        transcriptItemCount: 0,
        overlapOffsetSeconds: options.overlapOffsetSeconds,
      },
      chapters: [],
    };
  }

  const overlappedChapters = applyChapterOverlap(chapters, options.overlapOffsetSeconds);
  const chaptersWithContent = initializeChaptersWithContent(overlappedChapters);

  transcript.forEach((item) => {
    const segmentTimeSeconds = item.start_seconds;

    for (let i = 0; i < overlappedChapters.length; i++) {
      const chapter = overlappedChapters[i];
      if (segmentTimeSeconds >= chapter.startTime && segmentTimeSeconds < chapter.endTime) {
        const chapterContent = chaptersWithContent[i];
        chapterContent.content += ' ' + item.text;
        chapterContent.segments.push({
          text: item.text,
          start_seconds: item.start_seconds,
          end_seconds: item.end_seconds,
          start_time_text: item.start_time_text,
        });
      }
    }
  });

  return finalizeOutput(chaptersWithContent, transcript, videoId, options);
}

// Set to false to use RPC daemon exclusively for transcript fetching.
// When true, tries captions → formal API → RPC daemon as fallback chain.
const USE_DIRECT_TRANSCRIPT = false;

async function fetchTranscriptWithFallback(videoId: string): Promise<CacheResult<TranscriptResponse>> {
  if (!USE_DIRECT_TRANSCRIPT) {
    return fetchTranscriptViaRpc(videoId);
  }

  try {
    const result = await fetchTranscriptViaCaptions(videoId);
    console.log(`[transcript] Captions method succeeded for ${videoId} (${result.data.segments.length} segments, cached: ${result.isFromCache})`);
    return result;
  } catch (captionsError) {
    console.warn(`[transcript] Captions method failed for ${videoId}: ${captionsError instanceof Error ? captionsError.message : String(captionsError)}`);
    console.log(`[transcript] Falling back to formal API for ${videoId}...`);
    try {
      const result = await fetchTranscript(videoId);
      console.log(`[transcript] Formal API succeeded for ${videoId} (${result.data.segments.length} segments)`);
      return result;
    } catch (formalError) {
      console.error(`[transcript] Both methods failed for ${videoId}. Formal API error: ${formalError instanceof Error ? formalError.message : String(formalError)}`);
      return fetchTranscriptViaRpc(videoId);
    }
  }
}

async function fetchTranscriptViaRpc(videoId: string): Promise<CacheResult<TranscriptResponse>> {
  console.log(`[transcript] Using RPC daemon for ${videoId}...`);
  const rpcResult = await callRemote<TranscriptResponse>(
    'src/server/youtube/transcript/remoteTranscriptHandler',
    { videoId }
  );
  console.log(`[transcript] RPC daemon succeeded for ${videoId} (${rpcResult.data.segments.length} segments, ${rpcResult.durationMs}ms)`);
  return { data: rpcResult.data, isFromCache: false };
}

export async function getChaptersTranscripts(
  videoId: string,
  options: {
    overlapOffsetSeconds: number;
    segmentsPerChapter?: number;
    totalChapters?: number;
  } = {
    overlapOffsetSeconds: 5,
    segmentsPerChapter: 30,
    totalChapters: 0,
  }
): Promise<{ data: CombinedTranscriptChapters; isFromCache: boolean }> {
  try {
    const [transcriptResult, chaptersResult] = await Promise.all([
      fetchTranscriptWithFallback(videoId),
      fetchChapters(videoId),
    ]);

    const transcript = transcriptResult.data;
    const chapters = chaptersResult.data;
    const isFromCache = transcriptResult.isFromCache && chaptersResult.isFromCache;

    if (chapters.length === 0) {
      return { data: splitTranscriptToChapters(transcript.segments, videoId, options), isFromCache };
    }

    const filteredTranscript = transcript.segments.filter(
      (item) => !shouldFilterTranscriptItem(item.text)
    );
    const filteredChapters = chapters.filter(
      (chapter) => !shouldFilterChapter(chapter.title)
    );

    const effectiveChapters =
      filteredChapters.length > 0
        ? filteredChapters
        : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];

    return { data: combineTranscriptAndChapters(filteredTranscript, effectiveChapters, videoId, options), isFromCache };
  } catch (error) {
    console.error(`Error getting chapters and transcript for video ${videoId}:`, error);
    return {
      data: {
        videoId,
        metadata: {
          totalDuration: 0,
          chapterCount: 0,
          transcriptItemCount: 0,
          overlapOffsetSeconds: options.overlapOffsetSeconds,
        },
        transcript: [],
        chapters: [],
        error: error instanceof Error ? error.message : String(error),
      },
      isFromCache: false,
    };
  }
}
