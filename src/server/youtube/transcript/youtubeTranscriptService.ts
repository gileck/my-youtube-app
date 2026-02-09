import { Innertube } from 'youtubei.js';
import type { YTNodes } from 'youtubei.js';
import type { TranscriptSegment } from '../types';

export interface TranscriptResponse {
  segments: TranscriptSegment[];
}

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  return `${formattedMinutes}:${formattedSeconds}`;
};

export const fetchTranscript = async (videoId: string): Promise<TranscriptResponse> => {
  const originalConsoleWarning = console.warn;
  console.warn = (...args: unknown[]) => {
    const errorMessage = args.map((arg) => String(arg)).join(' ');
    if (
      errorMessage.includes('[YOUTUBEJS][Parser]') &&
      errorMessage.includes('CompositeVideoPrimaryInfo not found')
    ) {
      return;
    }
    originalConsoleWarning(...args);
  };

  let transcriptInfo;
  try {
    const youtube = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });

    const info = await youtube.getInfo(videoId);
    transcriptInfo = await info.getTranscript();
  } finally {
    console.warn = originalConsoleWarning;
  }

  const content = transcriptInfo.transcript?.content;
  const body = content?.body;
  const segments = body?.initial_segments || [];

  const processedSegments: TranscriptSegment[] = [];

  for (const segment of segments) {
    if (!segment || typeof segment !== 'object') continue;
    if (segment.type !== 'TranscriptSegment') continue;

    const typedSegment = segment as YTNodes.TranscriptSegment;

    const startMs =
      typeof typedSegment.start_ms === 'string'
        ? parseInt(typedSegment.start_ms, 10)
        : typeof typedSegment.start_ms === 'number'
          ? typedSegment.start_ms
          : 0;

    const endMs =
      typeof typedSegment.end_ms === 'string'
        ? parseInt(typedSegment.end_ms, 10)
        : typeof typedSegment.end_ms === 'number'
          ? typedSegment.end_ms
          : 0;

    const startSeconds = startMs / 1000;
    const endSeconds = endMs / 1000;

    let text = '';
    if (typedSegment.snippet && typeof typedSegment.snippet === 'object' && typedSegment.snippet.text) {
      text = String(typedSegment.snippet.text);
    }

    let startTimeText = '';
    if (
      typedSegment.start_time_text &&
      typeof typedSegment.start_time_text === 'object' &&
      typedSegment.start_time_text.text
    ) {
      startTimeText = String(typedSegment.start_time_text.text);
    } else {
      startTimeText = formatTime(startSeconds);
    }

    processedSegments.push({
      start_seconds: startSeconds,
      end_seconds: endSeconds,
      text,
      start_time_text: startTimeText,
    });
  }

  return { segments: processedSegments };
};

export const youtubeTranscriptService = { fetchTranscript };
