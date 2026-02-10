/**
 * Captions-based transcript fetcher (workaround).
 *
 * YouTube added BotGuard attestation for the /get_transcript endpoint in Dec 2025,
 * breaking the official transcript API in youtubei.js.
 * See: https://github.com/LuanRT/YouTube.js/issues/1102
 *
 * This workaround uses getBasicInfo with generate_session_locally to fetch
 * caption track URLs, then parses the timedtext XML directly.
 * Once the library ships a proper fix we can switch back to the formal API
 * in youtubeTranscriptService.ts.
 */
import { Innertube } from 'youtubei.js';
import type { TranscriptSegment } from '../types';
import type { TranscriptResponse } from './youtubeTranscriptService';
import { formatTime } from './youtubeTranscriptService';

let innertubePromise: Promise<Innertube> | null = null;

function getInnertube(): Promise<Innertube> {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({
      lang: 'en',
      location: 'US',
      generate_session_locally: true,
    });
  }
  return innertubePromise;
}

export const fetchTranscriptViaCaptions = async (videoId: string): Promise<TranscriptResponse> => {
  const youtube = await getInnertube();

  const info = await youtube.getBasicInfo(videoId);
  const captionTracks = info.captions?.caption_tracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No caption tracks available for this video');
  }

  const track =
    captionTracks.find((t) => t.language_code === 'en') ||
    captionTracks.find((t) => t.language_code?.startsWith('en')) ||
    captionTracks[0];

  if (!track.base_url) {
    throw new Error('Caption track has no URL');
  }

  const response = await fetch(track.base_url);
  if (!response.ok) {
    throw new Error(`Failed to fetch captions XML (status ${response.status})`);
  }

  const xml = await response.text();
  const segments = parseTimedTextXml(xml);

  return { segments };
};

function parseTimedTextXml(xml: string): TranscriptSegment[] {
  const segmentRegex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/g;
  const segments: TranscriptSegment[] = [];
  let match;

  while ((match = segmentRegex.exec(xml)) !== null) {
    const startSeconds = parseFloat(match[1]);
    const duration = parseFloat(match[2] || '0');
    const endSeconds = startSeconds + duration;

    const text = decodeXmlEntities(match[3]).replace(/\n/g, ' ').trim();
    if (!text) continue;

    segments.push({
      start_seconds: startSeconds,
      end_seconds: endSeconds,
      text,
      start_time_text: formatTime(startSeconds),
    });
  }

  return segments;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
