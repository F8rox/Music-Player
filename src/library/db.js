// The only module that touches IndexedDB. Records read back are untrusted (Invariant 5).
import { createStore, delMany, get, getMany, keys, setMany } from "idb-keyval";
import { cleanText } from "../lib/tags";

const store = createStore("music-player", "library");
const ID = /^u:[0-9a-f]{64}$/;

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
    imported: true,
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

export const deleteSong = (id) =>
  delMany([`song:${id}`, `blob:${id}`, `cover:${id}`, `analysis:${id}`], store);
