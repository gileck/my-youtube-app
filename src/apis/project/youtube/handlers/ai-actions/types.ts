import { AIModelAdapter } from '@/server/template/ai/baseModelAdapter';
import { GetVideoSummaryRequest, GetVideoSummaryResponse } from '../../types';

export const SINGLE_PASS_CHAR_LIMIT = 50000;

export interface AIActionContext {
    request: GetVideoSummaryRequest;
    adapter: AIModelAdapter;
    modelId: string;
}

export type AIActionResult = Omit<GetVideoSummaryResponse, '_isFromCache' | 'error'>;

export interface AIAction {
    cacheKey: string;
    cacheParams(request: GetVideoSummaryRequest): Record<string, string>;
    validate?(request: GetVideoSummaryRequest): string | null;
    execute(ctx: AIActionContext): Promise<AIActionResult>;
}
