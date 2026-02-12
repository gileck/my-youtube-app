import { fetchTranscriptViaCaptions } from './captionsTranscriptService';
import { fetchTranscript } from './youtubeTranscriptService';
import type { TranscriptResponse } from './youtubeTranscriptService';

export default async function remoteTranscriptHandler(
  args: Record<string, unknown>
): Promise<TranscriptResponse> {
  const videoId = args.videoId as string;
  if (!videoId) {
    throw new Error('Missing required arg: videoId');
  }

  try {
    const result = await fetchTranscriptViaCaptions(videoId);
    console.log(`[remote-transcript] Captions succeeded for ${videoId} (${result.data.segments.length} segments)`);
    return result.data;
  } catch {
    console.warn(`[remote-transcript] Captions failed for ${videoId}, trying formal API...`);
    const result = await fetchTranscript(videoId);
    console.log(`[remote-transcript] Formal API succeeded for ${videoId} (${result.data.segments.length} segments)`);
    return result.data;
  }
}
