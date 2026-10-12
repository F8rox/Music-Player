// The only module that touches localStorage. Everything read back is untrusted.
import { validateName } from "./playlists";
const KEY = "musicPlayer:v1";
const REPEAT_MODES = ["off", "all", "one"];

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

const parseQueue = (raw, songIds) => {
  if (!isObject(raw) || !Array.isArray(raw.items)) return { items: [], currentQid: null, shuffled: false };
  const seen = new Set();
  const items = raw.items
    .filter((item) => isObject(item) && typeof item.qid === "string" && songIds.has(item.songId)
      && Number.isFinite(item.order) && !seen.has(item.qid) && seen.add(item.qid))
    .map(({ qid, songId, order }) => ({ qid, songId, order }));
  const currentQid = seen.has(raw.currentQid) ? raw.currentQid : (items[0]?.qid ?? null);
  return { items, currentQid, shuffled: raw.shuffled === true };
};

const parsePlaylists = (raw, songIds) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw
    .filter((p) => isObject(p) && typeof p.id === "string" && p.id.length <= 64 && !seen.has(p.id) && seen.add(p.id))
    .map((p) => ({ id: p.id, name: validateName(p.name), songIds: p.songIds, createdAt: p.createdAt }))
    .filter((p) => p.name && Array.isArray(p.songIds))
    .map((p) => ({
      ...p,
      songIds: [...new Set(p.songIds.filter((id) => songIds.has(id)))],
      createdAt: Number.isFinite(p.createdAt) ? p.createdAt : 0,
    }));
};

const parseSettings = (raw) => ({
  crossfade: isObject(raw) && typeof raw.crossfade === "boolean" ? raw.crossfade : true,
  fadeSeconds: isObject(raw) && Number.isInteger(raw.fadeSeconds) && raw.fadeSeconds >= 2 && raw.fadeSeconds <= 12
    ? raw.fadeSeconds : 6,
  beatMatch: isObject(raw) && raw.beatMatch === true, // experimental: off unless explicitly on
});

const inRange = (value, min, max, fallback) =>
  Number.isFinite(value) && value >= min && value <= max ? value : fallback;

// Pure: raw string in, fully validated state out. Bad fields fall back individually.
export const parse = (text, songIds) => {
  let raw = null;
  try {
    raw = JSON.parse(text);
  } catch {
    // Not JSON: every field uses its default.
  }
  const data = isObject(raw) ? raw : {};
  return {
    queue: parseQueue(data.queue, songIds),
    volume: inRange(data.volume, 0, 1, 0.5),
    position: inRange(data.position, 0, Number.MAX_SAFE_INTEGER, 0),
    repeat: REPEAT_MODES.includes(data.repeat) ? data.repeat : "off",
    playlists: parsePlaylists(data.playlists, songIds),
    settings: parseSettings(data.settings),
  };
};

export const load = (songIds) => {
  try {
    return parse(localStorage.getItem(KEY), songIds);
  } catch {
    return parse(null, songIds);
  }
};

// Returns false when storage is full or blocked so the caller can tell the user once.
export const save = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};
