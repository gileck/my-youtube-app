# YouTube Server Module — Technical Documentation

## Overview

The `src/server/youtube/` module provides a server-side abstraction layer for interacting with YouTube content. It handles video/channel search, transcript fetching, chapter parsing, and combined transcript-chapter processing. The module primarily uses **youtubei.js** (an unofficial YouTube client) alongside the official YouTube Data API for chapter retrieval.

---

## Directory Structure

```
src/server/youtube/
├── index.ts                          # Public API — exports & singleton
├── types.ts                          # TypeScript interfaces & type definitions
├── youtubeAdapter.ts                 # Main adapter (search, video details, channels)
├── chaptersTranscriptService.ts      # Combines transcripts with chapters
├── chapters/
│   ├── chaptersService.ts            # Fetches chapters via YouTube Data API
│   └── parseChapters.ts              # Parses chapter timestamps from descriptions
└── transcript/
    └── youtubeTranscriptService.ts   # Fetches video transcripts via youtubei.js
```

---

## Architecture

The module follows the **Adapter Pattern** with three logical layers:

```
┌─────────────────────────────────────────────────┐
│  Public API (index.ts)                          │
│  Exports: youtubeAdapter singleton, all types   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Composition Layer                              │
│  chaptersTranscriptService.ts                   │
│  Merges transcripts + chapters, filters content │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Service Layer                                  │
│  youtubeAdapter.ts — search, details, channels  │
│  chaptersService.ts — chapter fetching          │
│  youtubeTranscriptService.ts — transcript fetch │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Transport Layer                                │
│  youtubei.js (Innertube) — no API key needed    │
│  YouTube Data API v3 (axios) — requires API key │
└─────────────────────────────────────────────────┘
```

---

## Modules

### 1. `index.ts` — Public Entry Point

Creates and exports a singleton `youtubeAdapter` instance and re-exports all types.

```typescript
export * from './types';
export * from './youtubeAdapter';
export const youtubeAdapter = createYouTubeAdapter();
```

### 2. `types.ts` — Type Definitions

Defines all TypeScript interfaces used across the module.

#### Request Types

| Type | Description |
|------|-------------|
| `YouTubeSearchParams` | Video search with query, sortBy, upload_date, type, duration, features, minViews, pageNumber |
| `YouTubeChannelSearchParams` | Channel search with query |
| `YouTubeVideoParams` | Single video lookup by videoId |
| `YouTubeChannelParams` | Channel videos with channelId, filters, pageNumber |

#### Response Types

| Type | Description |
|------|-------------|
| `YouTubeSearchVideosResponse` | `{ videos, filteredVideos, continuation, estimatedResults }` |
| `YouTubeSearchChannelsResponse` | `{ channels }` |
| `YouTubeChannelResponse` | `{ data: { videos, channelInfo }, error? }` |
| `YouTubeApiResponse<T>` | Generic wrapper with data, error, continuation |

#### Data Types

| Type | Description |
|------|-------------|
| `YouTubeVideoSearchResult` | Video metadata from search results |
| `YouTubeVideoDetails` | Extended video metadata (tags, category, likes, comments) |
| `YouTubeChannelInfo` | Channel metadata (name, ID, subscribers, avatar) |
| `TranscriptSegment` | Single transcript segment: text, offset, duration, relativeOffset |
| `ChapterWithContent` | Chapter title, startTime, endTime, content string, segments array |

#### Adapter Interface

```typescript
interface YouTubeApiAdapter {
  searchVideos(params: YouTubeSearchParams): Promise<YouTubeSearchVideosResponse>;
  searchChannels(params: YouTubeChannelSearchParams): Promise<YouTubeSearchChannelsResponse>;
  getVideoDetails(params: YouTubeVideoParams): Promise<YouTubeVideoDetails | null>;
  getChannelVideos(params: YouTubeChannelParams): Promise<YouTubeChannelResponse>;
}
```

---

### 3. `youtubeAdapter.ts` — Main Adapter

Factory function `createYouTubeAdapter()` returns an implementation of `YouTubeApiAdapter`.

**Key characteristics:**
- **Lazy initialization** — Innertube client created on first use and reused
- **Client-side filtering** — Minimum view count, duration, query relevance
- **Pagination** — Uses youtubei.js `getContinuation()` for multi-page results
- **Duration formatting** — Converts seconds to ISO 8601 (e.g., `PT10M30S`)

#### Methods

**`searchVideos(params)`**
- Searches YouTube via Innertube with optional filters (upload_date, type, duration, features)
- Filters results client-side by query match (title/description/channel) and minimum views
- Supports pagination via `pageNumber`
- Returns matching videos, filtered-out videos, continuation flag, and estimated results

**`searchChannels(params)`**
- Searches for channels, filters to verified channels matching the query

**`getVideoDetails(params)`**
- Fetches full video metadata via `youtube.getInfo(videoId)`
- Extracts: title, description, thumbnails, duration (ISO 8601), view/like/comment counts, tags, category, channel info with avatar
- Returns `null` on failure

**`getChannelVideos(params)`**
- Fetches videos from a channel with pagination and filter support
- Applies duration-based filters and sorting (upload date or view count)
- Returns channel metadata alongside video list

#### Helper Functions

| Function | Purpose |
|----------|---------|
| `formatDuration(seconds)` | Converts seconds to ISO 8601 duration string |
| `transformVideoResult(video)` | Maps `YTNodes.Video` to `YouTubeVideoSearchResult` |
| `transformChannelResult(channel)` | Maps `YTNodes.Channel` to `YouTubeChannelSearchResult` |
| `videoAsAtLeastMinViews(video, min)` | Client-side minimum view count filter |
| `parseVideoDuration(duration)` | Parses "HH:MM:SS", "MM:SS", or raw seconds |
| `applyFilters(video, filters)` | Applies filter rules (e.g., duration > 20 min = "long") |

---

### 4. `transcript/youtubeTranscriptService.ts` — Transcript Service

Fetches and processes YouTube video transcripts using youtubei.js. **No API key required.**

#### Exported API

```typescript
export const youtubeTranscriptService = { fetchTranscript };
```

**`fetchTranscript(videoId): Promise<TranscriptResponse>`**

Returns an array of segments, each containing:
- `start_seconds` / `end_seconds` — timing in seconds
- `text` — transcript text
- `start_time_text` — formatted time string (MM:SS)

**Implementation details:**
1. Suppresses known youtubei.js parser warnings
2. Creates Innertube client with language/location settings
3. Fetches video info then transcript data
4. Filters to `TranscriptSegment` types (skips headers)
5. Converts millisecond timestamps to seconds with safe fallbacks

**`formatTime(seconds): string`** — Converts seconds to `MM:SS` with zero-padding.

---

### 5. `chapters/chaptersService.ts` — Chapter Fetching

Fetches video chapters from the YouTube Data API v3.

**`fetchChapters(videoId): Promise<Chapter[]>`**

```typescript
interface Chapter {
  title: string;
  startTime: number;   // seconds
  endTime: number;     // seconds (MAX_SAFE_INTEGER for last chapter)
}
```

**Implementation:**
1. Calls YouTube Data API `/videos` endpoint with `snippet` part
2. Extracts video description
3. Parses chapters via `parseYouTubeChapters()`
4. Sets each chapter's `endTime` to the next chapter's `startTime`
5. Returns empty array on error or no chapters found

**Requires:** `YOUTUBE_API_KEY` environment variable.

---

### 6. `chapters/parseChapters.ts` — Chapter Parser

Parses YouTube chapter timestamps from video description text. Supports multiple common formats.

**`parseYouTubeChapters(description): Chapter[]`**

Tries parsers in order until one succeeds:

| Parser | Format Example | Pattern |
|--------|---------------|---------|
| Lawful | `0:00 Title` | Timestamp prefix, space, title |
| Brackets | `[0:00] Title` | Timestamp in square brackets |
| Parens | `(0:00) Title` | Timestamp in parentheses |
| Hyphen | `0:00:00-Title` | Timestamp, hyphen, title |
| Postfix | `Title 0:00:00` | Title followed by timestamp |
| Postfix Paren | `Title (0:00:00)` | Title, timestamp in parens |
| Prefix | `1. 0:00:00 Title` | Numbered list with timestamp |

All parsers support optional hours (`HH:MM:SS` or `MM:SS`), skip empty lines, and stop at the first non-matching line.

---

### 7. `chaptersTranscriptService.ts` — Combined Processing

The composition layer that merges transcript data with chapter data.

#### Exported Functions

**`getChaptersTranscripts(videoId, options?): Promise<CombinedTranscriptChapters>`**

Main entry point. Fetches transcripts and chapters in parallel, then combines them.

- If chapters exist: uses `combineTranscriptAndChapters()`
- If no chapters: falls back to `splitTranscriptToChapters()`
- Applies content filtering to remove sponsored segments

**`splitTranscriptToChapters(transcript, videoId, options?): CombinedTranscriptChapters`**

Creates artificial chapters from transcript when no real chapters are available.

**Options:**
```typescript
{
  overlapOffsetSeconds?: number;    // Default: 5 — extends chapter boundaries
  chapterDurationSeconds?: number;  // Default: 600 (10 minutes)
  segmentsPerChapter?: number;      // Default: 30
  totalChapters?: number;           // Default: 0 (auto-calculated)
}
```

#### Return Type

```typescript
interface CombinedTranscriptChapters {
  videoId: string;
  metadata: {
    totalDuration: number;
    chapterCount: number;
    transcriptItemCount: number;
    overlapOffsetSeconds: number;
  };
  chapters: ChapterWithContent[];
  transcript: TranscriptResponse['segments'];
  error?: string;
}
```

#### Content Filtering

Built-in sponsor/ad filtering applied to both chapters and transcript segments:

- **Chapter title filters:** "sponsor", "advertisement", "ad break", "promotion"
- **Transcript text filters:** "is sponsored by", "this video is sponsored by", etc.

#### Internal Functions

| Function | Purpose |
|----------|---------|
| `applyChapterOverlap()` | Extends chapter start/end times by overlap offset |
| `initializeChaptersWithContent()` | Creates empty content containers for chapters |
| `combineTranscriptAndChapters()` | Maps transcript segments to their corresponding chapters |
| `shouldFilterChapter()` | Checks chapter title against filtered phrases |
| `shouldFilterTranscriptItem()` | Checks transcript text against filtered phrases |
| `finalizeOutput()` | Post-processes and sorts segments within chapters |

---

## Data Flow Diagrams

### Video Search Flow

```
YouTubeSearchParams
  → youtubeAdapter.searchVideos()
    → Innertube.search(query, filters)
    → Transform YTNodes.Video → YouTubeVideoSearchResult[]
    → Client-side filter (minViews, query match)
  → YouTubeSearchVideosResponse { videos, filteredVideos, continuation }
```

### Transcript + Chapters Flow

```
videoId
  → getChaptersTranscripts()
    → Promise.all([
        fetchTranscript(videoId),     ← youtubei.js (no API key)
        fetchChapters(videoId)        ← YouTube Data API v3
      ])
    → chapters found?
      YES → combineTranscriptAndChapters()
      NO  → splitTranscriptToChapters()
    → Filter sponsor content
    → Apply overlap, sort segments
  → CombinedTranscriptChapters
```

---

## External Dependencies

| Library | Purpose | API Key Required |
|---------|---------|:---:|
| `youtubei.js` (Innertube) | Video search, details, transcripts, channel data | No |
| `axios` | HTTP client for YouTube Data API | — |
| YouTube Data API v3 | Chapter data (video descriptions) | Yes (`YOUTUBE_API_KEY`) |

---

## Environment Variables

| Variable | Required By | Purpose |
|----------|-------------|---------|
| `YOUTUBE_API_KEY` | `chaptersService.ts` | YouTube Data API v3 authentication |

---

## Design Decisions

- **Dual API strategy** — youtubei.js handles most operations without an API key; the official API is used only for chapter parsing from descriptions (which requires the snippet).
- **Lazy Innertube initialization** — The client is created on first use and cached, avoiding unnecessary startup cost.
- **Automatic chapter generation** — When a video has no chapters, the module creates artificial time-based chapters so downstream consumers always have a consistent structure.
- **Built-in content filtering** — Sponsor/advertisement segments are automatically removed from both chapters and transcript items.
- **Configurable overlap** — Chapter boundaries can be extended by a configurable offset to capture context that spans chapter boundaries.
- **Parallel fetching** — Transcripts and chapters are fetched concurrently via `Promise.all()`.
