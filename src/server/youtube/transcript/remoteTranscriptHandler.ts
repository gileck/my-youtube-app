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

  try {
    const captionsStart = Date.now();
    console.log(`${TAG} [${videoId}] Trying captions method...`);
    const result = await fetchTranscriptViaCaptions(videoId);
    const captionsMs = Date.now() - captionsStart;
    const totalMs = Date.now() - handlerStart;
    console.log(`${TAG} [${videoId}] Captions succeeded — ${result.data.segments.length} segments in ${captionsMs}ms (total: ${totalMs}ms)`);
    return result.data;
  } catch (err) {
    const captionsMs = Date.now() - handlerStart;
    console.warn(`${TAG} [${videoId}] Captions failed after ${captionsMs}ms: ${err instanceof Error ? err.message : String(err)}`);

    const formalStart = Date.now();
    console.log(`${TAG} [${videoId}] Trying formal API...`);
    const result = await fetchTranscript(videoId);
    const formalMs = Date.now() - formalStart;
    const totalMs = Date.now() - handlerStart;
    console.log(`${TAG} [${videoId}] Formal API succeeded — ${result.data.segments.length} segments in ${formalMs}ms (total: ${totalMs}ms)`);
    return result.data;
  }
}
