interface Chapter {
  start: number;
  title: string;
}

function makeChapterParser(
  startRx: RegExp,
  lineRx: RegExp,
  timestampIndex: number,
  textIndex: number
): (description: string) => Chapter[] {
  timestampIndex += 1;
  textIndex += 1;

  return function (description: string): Chapter[] {
    const chapters: Chapter[] = [];

    const firstTimestamp = description.search(startRx);
    if (firstTimestamp === -1) {
      return chapters;
    }

    const chapterLines = description.slice(firstTimestamp).split('\n');
    for (let i = 0; i < chapterLines.length; i += 1) {
      const line = chapterLines[i].trim();

      if (!line) {
        continue;
      }

      const match = lineRx.exec(line);
      if (!match) {
        break;
      }

      const hours = match[timestampIndex] !== undefined ? parseInt(match[timestampIndex], 10) : 0;
      const minutes = parseInt(match[timestampIndex + 1], 10);
      const seconds = parseInt(match[timestampIndex + 2], 10);
      const title = match[textIndex].trim();

      chapters.push({
        start: hours * 60 * 60 + minutes * 60 + seconds,
        title: title.trim(),
      });
    }

    return chapters;
  };
}

function addM(regex: RegExp): RegExp {
  if (regex.flags.indexOf('m') === -1) {
    return new RegExp(regex.source, regex.flags + 'm');
  }
  return regex;
}

// $timestamp $title
const lawfulParser = makeChapterParser(/^0?0:00/m, /^(?:(\d+):)?(\d+):(\d+)\s+(.*?)$/, 0, 3);
// [$timestamp] $title
const bracketsParser = makeChapterParser(/^\[0?0:00\]/m, /^\[(?:(\d+):)?(\d+):(\d+)\]\s+(.*?)$/, 0, 3);
// ($timestamp) $title
const parensParser = makeChapterParser(/^\(0?0:00\)/m, /^\((?:(\d+):)?(\d+):(\d+)\)\s+(.*?)$/, 0, 3);
// $timestamp-$title
const hyphenParser = makeChapterParser(/^0?0:00:00-/m, /^(?:(\d+):)?(\d+):(\d+)-(.*?)$/, 0, 3);
// ($track_id. )$title $timestamp
const postfixRx = /^(?:\d+\.\s+)?(.*)\s+(?:(\d+):)?(\d+):(\d+)$/;
const postfixParser = makeChapterParser(addM(postfixRx), postfixRx, 1, 0);
// ($track_id. )$title ($timestamp)
const postfixParenRx = /^(?:\d+\.\s+)?(.*)\s+\(\s*(?:(\d+):)?(\d+):(\d+)\s*\)$/;
const postfixParenParser = makeChapterParser(addM(postfixParenRx), postfixParenRx, 1, 0);
// $track_id. $timestamp $title
const prefixRx = /^\d+\.\s+(?:(\d+):)?(\d+):(\d+)\s+(.*)$/;
const prefixParser = makeChapterParser(addM(prefixRx), prefixRx, 0, 3);

export default function parseYouTubeChapters(description: string): Chapter[] {
  let chapters = lawfulParser(description);
  if (chapters.length === 0) chapters = bracketsParser(description);
  if (chapters.length === 0) chapters = parensParser(description);
  if (chapters.length === 0) chapters = hyphenParser(description);
  if (chapters.length === 0) chapters = postfixParser(description);
  if (chapters.length === 0) chapters = postfixParenParser(description);
  if (chapters.length === 0) chapters = prefixParser(description);

  return chapters;
}
