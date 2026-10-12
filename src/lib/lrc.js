// Synced lyrics (.lrc), parsed in the browser. Input is a user file: untrusted, so sizes and counts are capped. Pure.
import { cleanText } from "./tags";

export const MAX_LRC_BYTES = 200 * 1024;
const MAX_LINES = 2000;
const MAX_SECONDS = 24 * 3600;

const STAMPS = /^(?:\s*\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\])+/;
const STAMP = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const OFFSET = /^\s*\[offset:\s*([+-]?\d+)\s*\]/i;
const WORD_TIMES = /<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>/g; // enhanced LRC marks every word; we only sync lines

// Seconds for one [mm:ss.xx] stamp; null when the seconds field is 60 or more.
const seconds = (m, s, fraction) => {
  if (Number(s) >= 60) return null;
  const total = Number(m) * 60 + Number(s) + (fraction ? Number(`0.${fraction}`) : 0);
  return total <= MAX_SECONDS ? total : null;
};

// → [{ time, text }] sorted by time. A line with several stamps becomes several entries; an empty
// text is a gap (instrumental). Lines without a stamp, and tags like [ar:…], are ignored.
// [offset:+500] moves every line 0.5 s earlier (the LRC convention).
export const parseLrc = (text) => {
  if (typeof text !== "string" || text.length > MAX_LRC_BYTES) return [];
  const lines = text.split(/\r\n|\r|\n/);
  let offset = 0;
  const entries = [];
  for (const raw of lines) {
    const tag = OFFSET.exec(raw);
    if (tag) {
      offset = Number(tag[1]) / 1000;
      continue;
    }
    const lead = STAMPS.exec(raw);
    if (!lead) continue;
    const words = cleanText(raw.slice(lead[0].length).replace(WORD_TIMES, ""));
    for (const [, m, s, f] of lead[0].matchAll(STAMP)) {
      const time = seconds(m, s, f);
      if (time !== null) entries.push({ time, text: words });
    }
  }
  return entries
    .slice(0, MAX_LINES)
    .map((entry) => ({ ...entry, time: Math.max(0, entry.time - offset) }))
    .sort((a, b) => a.time - b.time);
};

// Index of the line being sung at `time` (the last one that has started), or -1 before the first.
export const activeIndex = (lines, time) => {
  let [low, high] = [0, lines.length - 1];
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid].time <= time) [found, low] = [mid, mid + 1];
    else high = mid - 1;
  }
  return found;
};

export const isLrcName = (name) => /\.lrc$/i.test(name);
export const stemOf = (name) => name.replace(/\.[^.]+$/, "");

const normaliseName = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

// The one candidate whose name equals `stem` (ignoring case and punctuation); null when none or several fit.
// candidates: [{ id, names: string[] }]
export const matchSong = (stem, candidates) => {
  const want = normaliseName(stem);
  if (!want) return null;
  const hits = candidates.filter((candidate) => candidate.names.some((name) => normaliseName(name) === want));
  return hits.length === 1 ? hits[0].id : null;
};
