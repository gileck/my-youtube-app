import { AIActionType } from '../../types';
import { AIAction } from './types';
import { summaryAction } from './summary';
import { keypointsAction } from './keypoints';
import { topicsAction } from './topics';
import { explainAction } from './explain';
import { topicExpandAction } from './topic-expand';
import { subtopicExpandAction } from './subtopic-expand';

export const AI_ACTIONS: Record<AIActionType, AIAction> = {
    summary: summaryAction,
    keypoints: keypointsAction,
    topics: topicsAction,
    explain: explainAction,
    'topic-expand': topicExpandAction,
    'subtopic-expand': subtopicExpandAction,
};

export type { AIAction, AIActionContext, AIActionResult } from './types';
