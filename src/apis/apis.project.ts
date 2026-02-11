/**
 * Project-specific API Handlers
 *
 * Add your project-specific API handlers here.
 * Template handlers are in apis.template.ts (synced from template).
 */

import { mergeApiHandlers } from "./registry";
import { youtubeApiHandlers } from "./project/youtube/server";

export const projectApiHandlers = mergeApiHandlers(
  youtubeApiHandlers
);
