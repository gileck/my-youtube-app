export * from './types';
export { createYouTubeAdapter } from './youtubeAdapter';
export { getChaptersTranscripts, splitTranscriptToChapters } from './chaptersTranscriptService';
export { youtubeTranscriptService } from './transcript/youtubeTranscriptService';

import { createYouTubeAdapter } from './youtubeAdapter';

export const youtubeAdapter = createYouTubeAdapter();
