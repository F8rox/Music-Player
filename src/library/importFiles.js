import { parseBlob } from "music-metadata";
import { MAX_LRC_BYTES, isLrcName, parseLrc } from "../lib/lrc";
import { songInfo } from "../lib/tags";
import { addSong, hasSong } from "./db";

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac)$/i;
const MAX_BYTES = 100 * 1024 * 1024;
const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER = 2 * 1024 * 1024;

// Pure pre-check: null when the file may be audio we accept, otherwise a status.
export const checkFile = (file) => {
  if (!AUDIO_EXT.test(file.name) || (file.type && !file.type.startsWith("audio/"))) return "invalid";
  return file.size > MAX_BYTES ? "too-big" : null;
};

export const isAudioName = (name) => AUDIO_EXT.test(name);

const hashId = async (file) => {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return "u:" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// The browser's own decoder decides whether this really is playable audio.
const probeDuration = (blob) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    const done = (value) => {
      audio.onloadedmetadata = audio.onerror = null;
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });

const readTags = async (file) => {
  try {
    return (await parseBlob(file, { duration: false })).common;
  } catch {
    return {};
  }
};

const pickCover = (common) => {
  const picture = common?.picture?.[0];
  if (!picture || !COVER_TYPES.includes(picture.format) || picture.data?.length > MAX_COVER) return null;
  return new Blob([picture.data], { type: picture.format });
};

const fits = async (bytes) => {
  const estimate = await navigator.storage?.estimate?.();
  return !estimate?.quota || estimate.usage + bytes < estimate.quota;
};

// A .lrc file's text, or a status when it can't be used (wrong type, over 200 KB, no timed lines).
export const readLyrics = async (file) => {
  if (!isLrcName(file.name) || file.size > MAX_LRC_BYTES) return { status: "bad-lyrics" };
  try {
    const text = await file.text();
    return parseLrc(text).length > 0 ? { text } : { status: "bad-lyrics" };
  } catch {
    return { status: "error" };
  }
};

// Returns { status, song? }. status: added | duplicate | invalid | too-big | no-space | error
export const importFile = async (file) => {
  const rejected = checkFile(file);
  if (rejected) return { status: rejected };
  try {
    const id = await hashId(file);
    if (await hasSong(id)) return { status: "duplicate", id };
    const durationSec = await probeDuration(file);
    if (!durationSec) return { status: "invalid" };
    const common = await readTags(file);
    const cover = pickCover(common);
    if (!(await fits(file.size + (cover?.size ?? 0)))) return { status: "no-space" };
    const song = {
      id, ...songInfo(common, file.name), durationSec, addedAt: Date.now(),
      mime: file.type, size: file.size, hasCover: Boolean(cover), imported: true,
    };
    await addSong(song, file, cover);
    return { status: "added", song };
  } catch {
    return { status: "error" };
  }
};

// Chromium only: collects audio files from a picked folder, recursively.
export const filesFromDirectory = async (dir) => {
  const files = [];
  for await (const entry of dir.values()) {
    if (entry.kind === "directory") files.push(...(await filesFromDirectory(entry)));
    else if (isAudioName(entry.name) || isLrcName(entry.name)) files.push(await entry.getFile());
  }
  return files;
};
