import apiClient from '@/client/utils/apiClient';
import { CacheResult } from '@/common/cache/types';
import { API_SEARCH_VIDEOS, API_SEARCH_CHANNELS, API_GET_VIDEO_DETAILS, API_GET_CHANNEL_VIDEOS, API_GET_TRANSCRIPT } from './index';
import {
    SearchVideosRequest,
    SearchVideosResponse,
    SearchChannelsRequest,
    SearchChannelsResponse,
    GetVideoDetailsRequest,
    GetVideoDetailsResponse,
    GetChannelVideosRequest,
    GetChannelVideosResponse,
    GetTranscriptRequest,
    GetTranscriptResponse,
} from './types';

export const searchVideos = async (
    params: SearchVideosRequest
): Promise<CacheResult<SearchVideosResponse>> => {
    return apiClient.call(API_SEARCH_VIDEOS, params);
};

export const searchChannels = async (
    params: SearchChannelsRequest
): Promise<CacheResult<SearchChannelsResponse>> => {
    return apiClient.call(API_SEARCH_CHANNELS, params);
};

export const getVideoDetails = async (
    params: GetVideoDetailsRequest
): Promise<CacheResult<GetVideoDetailsResponse>> => {
    return apiClient.call(API_GET_VIDEO_DETAILS, params);
};

export const getChannelVideos = async (
    params: GetChannelVideosRequest
): Promise<CacheResult<GetChannelVideosResponse>> => {
    return apiClient.call(API_GET_CHANNEL_VIDEOS, params);
};

export const getTranscript = async (
    params: GetTranscriptRequest
): Promise<CacheResult<GetTranscriptResponse>> => {
    return apiClient.call(API_GET_TRANSCRIPT, params);
};
