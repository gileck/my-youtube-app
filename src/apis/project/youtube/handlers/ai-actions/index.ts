import { AIActionType } from '../../types';
import { AIAction } from './types';
import { summaryAction } from './summary';
import { keypointsAction } from './keypoints';
import { topicsAction } from './topics';
import { explainAction } from './explain';
import { deepExplainAction } from './deep-explain';
import { topicExpandAction } from './topic-expand';
import { subtopicExpandAction } from './subtopic-expand';

export const AI_ACTIONS: Record<AIActionType, AIAction> = {
    summary: summaryAction,
    keypoints: keypointsAction,
    topics: topicsAction,
    explain: explainAction,
    'deep-explain': deepExplainAction,
    'topic-expand': topicExpandAction,
    'subtopic-expand': subtopicExpandAction,
};

export type { AIAction, AIActionContext, AIActionResult } from './types';
