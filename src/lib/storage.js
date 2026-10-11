// The only module that touches localStorage. Everything read back is untrusted.
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
