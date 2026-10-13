// The only module that touches IndexedDB. Records read back are untrusted (Invariant 5).
import { createStore, delMany, get, getMany, keys, set, setMany } from "idb-keyval";
import { ANALYSIS_VERSION } from "../audio/analysis/dsp";
import { MAX_LRC_BYTES, parseLrc } from "../lib/lrc";
import { cleanText } from "../lib/tags";

const store = createStore("music-player", "library");
const ID = /^u:[0-9a-f]{64}$/;
export const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_COVER = 2 * 1024 * 1024;

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

export const validSong = (raw) => {
  if (!isObject(raw) || !ID.test(raw.id) || !(finite(raw.durationSec) > 0)) return null;
  return {
    id: raw.id,
    title: cleanText(raw.title) || "Untitled",
    artist: cleanText(raw.artist) || "Unknown artist",
    album: cleanText(raw.album),
    durationSec: raw.durationSec,
    addedAt: finite(raw.addedAt),
    mime: typeof raw.mime === "string" ? raw.mime.slice(0, 50) : "",
    size: finite(raw.size),
    hasCover: raw.hasCover === true,
  };
};

// Returns valid songs, oldest first, plus how many corrupt records were skipped.
export const listSongs = async () => {
  const songKeys = (await keys(store)).filter((key) => typeof key === "string" && key.startsWith("song:"));
  const records = (await getMany(songKeys, store)).map(validSong);
  const songs = records.filter(Boolean).sort((a, b) => a.addedAt - b.addedAt);
  // Delete corrupt records so the "damaged" notice shows once, not on every launch.
  const bad = songKeys.filter((_, i) => !records[i]).flatMap((key) => {
    const id = key.slice("song:".length);
    return [key, `blob:${id}`, `cover:${id}`, `analysis:${id}`];
  });
  if (bad.length) await delMany(bad, store);
  return { songs, dropped: bad.length / 4 };
};

export const hasSong = async (id) => (await get(`song:${id}`, store)) !== undefined;

// One transaction: the record, audio and cover are stored together or not at all.
export const addSong = (record, blob, cover) =>
  setMany(
    [[`song:${record.id}`, record], [`blob:${record.id}`, blob], ...(cover ? [[`cover:${record.id}`, cover]] : [])],
    store,
  );

export const getBlob = async (id) => {
  const blob = await get(`blob:${id}`, store);
  return blob instanceof Blob ? blob : null;
};

// A stored cover is only used if it is still a small JPEG, PNG or WebP blob.
export const getCover = async (id) => {
  const blob = await get(`cover:${id}`, store);
  return blob instanceof Blob && COVER_TYPES.includes(blob.type) && blob.size <= MAX_COVER ? blob : null;
};

export const deleteSong = (id) =>
  delMany([`song:${id}`, `blob:${id}`, `cover:${id}`, `analysis:${id}`, `lyrics:${id}`], store);

const between = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const optional = (value, min, max) => (value === null ? true : between(value, min, max));

// Version 1 (before key detection) is still read, with no key, so a tapped tempo survives; useAnalysis
// then analyses that song again. Any other version or any bad field means "not analysed".
export const validAnalysis = (raw) => {
  if (!isObject(raw) || ![1, ANALYSIS_VERSION].includes(raw.v) || !(raw.envelope instanceof Uint8Array)) return null;
  const key = raw.v === 1 ? { keyTonic: null, keyMode: null, keyConfidence: 0 } : raw;
  const ok = between(raw.loudness, -200, 10) && between(raw.onsetDensity, 0, 1000)
    && between(raw.introEnd, 0, 1e5) && between(raw.outroStart, raw.introEnd, 1e5)
    && optional(raw.bpm, 80, 160) && between(raw.bpmConfidence, 0, 1)
    && optional(raw.beatOffset, 0, 10) && optional(raw.bpmOverride, 30, 300)
    && optional(key.keyTonic, 0, 11) && Number.isInteger(key.keyTonic ?? 0)
    && (key.keyMode === null || key.keyMode === "major" || key.keyMode === "minor")
    && (key.keyTonic === null) === (key.keyMode === null) && between(key.keyConfidence, 0, 1);
  if (!ok) return null;
  const { v, envelope, loudness, onsetDensity, introEnd, outroStart, bpm, bpmConfidence, beatOffset, bpmOverride } = raw;
  const { keyTonic, keyMode, keyConfidence } = key;
  return { v, envelope, loudness, onsetDensity, introEnd, outroStart, bpm, bpmConfidence, beatOffset, bpmOverride, keyTonic, keyMode, keyConfidence };
};

// { [songId]: AnalysisResult } for every valid cached analysis.
export const listAnalysis = async () => {
  const analysisKeys = (await keys(store)).filter((key) => typeof key === "string" && key.startsWith("analysis:"));
  const records = await getMany(analysisKeys, store);
  return Object.fromEntries(analysisKeys
    .map((key, i) => [key.slice("analysis:".length), validAnalysis(records[i])])
    .filter(([, result]) => result));
};

export const putAnalysis = (id, result) => set(`analysis:${id}`, result, store);

// Lyrics are stored as the .lrc text and parsed on every read (untrusted): bad or missing means no lyrics.
export const putLyrics = (id, text) => set(`lyrics:${id}`, text, store);
export const getLyrics = async (id) => {
  const text = await get(`lyrics:${id}`, store);
  return typeof text === "string" && text.length <= MAX_LRC_BYTES ? parseLrc(text) : [];
};
