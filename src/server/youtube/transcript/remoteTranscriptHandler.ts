import { fetchTranscriptViaCaptions } from './captionsTranscriptService';
import { fetchTranscript } from './youtubeTranscriptService';
import type { TranscriptResponse } from './youtubeTranscriptService';

const TAG = '[remote-transcript]';

export default async function remoteTranscriptHandler(
  args: Record<string, unknown>
): Promise<TranscriptResponse> {
  const videoId = args.videoId as string;
  if (!videoId) {
    throw new Error('Missing required arg: videoId');
  }

  const handlerStart = Date.now();
  console.log(`${TAG} Starting for ${videoId}`);

  // Primary: captions method (works reliably from residential IP)
  try {
    const start = Date.now();
    console.log(`${TAG} [${videoId}] Trying captions...`);
    const result = await fetchTranscriptViaCaptions(videoId);
    const ms = Date.now() - start;
    console.log(`${TAG} [${videoId}] Captions succeeded — ${result.data.segments.length} segments in ${ms}ms (total: ${Date.now() - handlerStart}ms)`);
    return result.data;
  } catch (err) {
    console.warn(`${TAG} [${videoId}] Captions failed after ${Date.now() - handlerStart}ms: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Fallback: youtubei.js formal API (get_transcript endpoint, needs BotGuard — may fail)
  const start = Date.now();
  console.log(`${TAG} [${videoId}] Trying youtubei.js fallback...`);
  const result = await fetchTranscript(videoId);
  const ms = Date.now() - start;
  console.log(`${TAG} [${videoId}] youtubei.js succeeded — ${result.data.segments.length} segments in ${ms}ms (total: ${Date.now() - handlerStart}ms)`);
  return result.data;
}
