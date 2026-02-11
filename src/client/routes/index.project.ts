/**
 * Project-Specific Routes
 *
 * Add your project-specific routes here.
 * This file is NOT synced from template - it's owned by your project.
 *
 * Route formats:
 *   '/path': Component                              // Requires auth (default)
 *   '/path': { component: Component, public: true } // Public route
 *   '/admin/path': Component                        // Admin only (automatic)
 *
 * REMINDER: When adding a new route, consider if it should be added to:
 *   - navItems (bottom nav bar) in src/client/components/NavLinks.tsx
 *   - menuItems (hamburger menu) in src/client/components/NavLinks.tsx
 */

import { Routes } from '../features/template/router';
import { Home } from './project/Home';
import { Dashboard } from './project/Dashboard';
import { Video } from './project/Video';
import { Channel } from './project/Channel';
import { CacheStats } from './project/CacheStats';
import { VideoFeed } from './project/VideoFeed';
import { Bookmarks } from './project/Bookmarks';
import { History } from './project/History';

/**
 * Project route definitions.
 * These are merged with template routes in index.ts.
 */
export const projectRoutes: Routes = {
  '/': Home,
  '/video/:videoId': Video,
  '/channel/:channelId': Channel,
  '/video-feed': VideoFeed,
  '/bookmarks': Bookmarks,
  '/history': History,
  '/cache-stats': CacheStats,

  // Admin routes
  '/admin/dashboard': Dashboard,
};
