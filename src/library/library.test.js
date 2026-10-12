import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { set, createStore } from "idb-keyval";
import { addSong, deleteSong, getBlob, getLyrics, hasSong, listAnalysis, listSongs, putAnalysis, putLyrics, validAnalysis, validSong } from "./db";
import { checkFile, readLyrics } from "./importFiles";

const id = (n) => "u:" + String(n).repeat(64).slice(0, 64);
const record = (n, extra = {}) => ({
  id: id(n), title: `Song ${n}`, artist: "A", album: "", durationSec: 180, addedAt: n,
  mime: "audio/mpeg", size: 10, hasCover: false, imported: true, ...extra,
});
const rawStore = createStore("music-player", "library");

describe("validSong", () => {
  it("accepts a good record and sanitises its text", () => {
    expect(validSong(record(1, { title: " Hi\u0000 " })).title).toBe("Hi");
  });

  it.each([
    ["bad id", { id: "u:xyz" }],
    ["zero duration", { durationSec: 0 }],
    ["string duration", { durationSec: "180" }],
  ])("rejects %s", (_, extra) => {
    expect(validSong(record(1, extra))).toBeNull();
  });

  it("rejects non-objects", () => {
    expect(validSong(null)).toBeNull();
    expect(validSong([1])).toBeNull();
  });
});

describe("db", () => {
  it("stores, lists, reads the blob and deletes", async () => {
    await addSong(record(1), new Blob(["abc"], { type: "audio/mpeg" }));
    expect(await hasSong(id(1))).toBe(true);
    expect((await listSongs()).songs.map((s) => s.id)).toContain(id(1));
    expect(await getBlob(id(1))).toBeInstanceOf(Blob);
    await deleteSong(id(1));
    expect(await hasSong(id(1))).toBe(false);
    expect(await getBlob(id(1))).toBeNull();
  });

  it("drops corrupt records on load and counts them", async () => {
    await addSong(record(2), new Blob(["x"]));
    await set(`song:${id(3)}`, { id: id(3), title: "<b>", durationSec: "lots" }, rawStore);
    const { songs, dropped } = await listSongs();
    expect(songs.map((s) => s.id)).toContain(id(2));
    expect(songs.map((s) => s.id)).not.toContain(id(3));
    expect(dropped).toBe(1);
    expect((await listSongs()).dropped).toBe(0);
  });
});

describe("checkFile", () => {
  const file = (name, type, size = 1000) => ({ name, type, size });

  it("accepts audio files", () => {
    expect(checkFile(file("a.mp3", "audio/mpeg"))).toBeNull();
    expect(checkFile(file("a.FLAC", ""))).toBeNull();
  });

  it("rejects non-audio by extension or type", () => {
    expect(checkFile(file("a.txt", "text/plain"))).toBe("invalid");
    expect(checkFile(file("a.mp3", "text/plain"))).toBe("invalid");
  });

  it("rejects files over 100 MB", () => {
    expect(checkFile(file("a.mp3", "audio/mpeg", 101 * 1024 * 1024))).toBe("too-big");
  });
});

describe("lyrics", () => {
  const lrc = "[00:01.00]one\n[00:02.00]two";
  const lrcFile = (name, text, size = text.length) => ({ name, size, text: async () => text });

  it("round-trips through IndexedDB as parsed lines, and a song with none gives []", async () => {
    await putLyrics(id(7), lrc);
    expect(await getLyrics(id(7))).toEqual([{ time: 1, text: "one" }, { time: 2, text: "two" }]);
    expect(await getLyrics(id(8))).toEqual([]);
  });

  it("treats a corrupt stored value as no lyrics", async () => {
    for (const bad of [42, { evil: 1 }, ["[00:01.00]x"], null, "x".repeat(300 * 1024)]) {
      await set(`lyrics:${id(9)}`, bad, rawStore);
      expect(await getLyrics(id(9))).toEqual([]);
    }
  });

  it("is removed with its song", async () => {
    await addSong(record(6), new Blob(["a"]), null);
    await putLyrics(id(6), lrc);
    await deleteSong(id(6));
    expect(await getLyrics(id(6))).toEqual([]);
  });

  it("readLyrics returns the text of a good .lrc file", async () => {
    expect(await readLyrics(lrcFile("a.LRC", lrc))).toEqual({ text: lrc });
  });

  it("readLyrics rejects wrong types, oversize files and files with no timed lines", async () => {
    expect(await readLyrics(lrcFile("a.txt", lrc))).toEqual({ status: "bad-lyrics" });
    expect(await readLyrics(lrcFile("a.lrc", lrc, 300 * 1024))).toEqual({ status: "bad-lyrics" });
    expect(await readLyrics(lrcFile("a.lrc", "just words"))).toEqual({ status: "bad-lyrics" });
    expect(await readLyrics({ name: "a.lrc", size: 5, text: async () => { throw new Error("unreadable"); } })).toEqual({ status: "error" });
  });
});

describe("analysis records", () => {
  const good = () => ({
    v: 2, envelope: new Uint8Array([1, 2]), loudness: -12, onsetDensity: 2, introEnd: 1, outroStart: 180,
    bpm: 120, bpmConfidence: 0.7, beatOffset: 0.2, bpmOverride: null, keyTonic: 9, keyMode: "minor", keyConfidence: 0.8,
  });

  it("accepts a valid result and strips extra fields", () => {
    expect(validAnalysis({ ...good(), evil: "x" })).toEqual(good());
  });

  it.each([
    ["old version", { v: 0 }],
    ["bpm outside the folded range", { bpm: 200 }],
    ["confidence above 1", { bpmConfidence: 2 }],
    ["outro before intro", { introEnd: 50, outroStart: 10 }],
    ["envelope not bytes", { envelope: [1, 2] }],
    ["absurd override", { bpmOverride: 5000 }],
    ["key tonic out of range", { keyTonic: 12 }],
    ["fractional key tonic", { keyTonic: 3.5 }],
    ["unknown key mode", { keyMode: "dorian" }],
    ["tonic without a mode", { keyMode: null }],
    ["key confidence above 1", { keyConfidence: 2 }],
  ])("rejects %s", (_, extra) => {
    expect(validAnalysis({ ...good(), ...extra })).toBeNull();
  });

  it("reads a version 1 result with no key and keeps its tempo override", () => {
    const legacy = { ...good(), v: 1, bpmOverride: 110 };
    ["keyTonic", "keyMode", "keyConfidence"].forEach((field) => delete legacy[field]);
    expect(validAnalysis(legacy)).toMatchObject({ v: 1, bpmOverride: 110, keyTonic: null, keyMode: null, keyConfidence: 0 });
  });

  it("allows a null key (nothing fitted)", () => {
    expect(validAnalysis({ ...good(), keyTonic: null, keyMode: null, keyConfidence: 0 })).not.toBeNull();
  });

  it("allows a null tempo (no beat found)", () => {
    expect(validAnalysis({ ...good(), bpm: null, beatOffset: null })).not.toBeNull();
  });

  it("round-trips through IndexedDB and skips invalid records", async () => {
    await putAnalysis("1", good());
    await putAnalysis("2", { ...good(), v: 99 });
    const all = await listAnalysis();
    expect(all["1"].bpm).toBe(120);
    expect(all["2"]).toBeUndefined();
  });
});
