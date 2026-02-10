import { createCache } from '@/common/cache';
import { fsCacheProvider, s3CacheProvider } from '@/server/cache/providers';
import { appConfig } from '@/app.config';

const provider = appConfig.cacheType === 's3' ? s3CacheProvider : fsCacheProvider;

export const YOUTUBE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export const youtubeCache = createCache(provider);
