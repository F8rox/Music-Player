import { describe, expect, it } from "vitest";
import { parse } from "./storage";

const songIds = new Set(["1", "2", "3"]);
const valid = {
  queue: {
    items: [
      { qid: "a", songId: "1", order: 0 },
      { qid: "b", songId: "2", order: 1 },
    ],
    currentQid: "b",
    shuffled: true,
  },
  volume: 0.3,
  position: 42,
  repeat: "one",
  playlists: [{ id: "p1", name: "Gym", songIds: ["1", "3"], createdAt: 7 }],
  settings: { crossfade: false, fadeSeconds: 10, beatMatch: true },
};
const defaults = { queue: { items: [], currentQid: null, shuffled: false }, volume: 0.5, position: 0, repeat: "off", playlists: [], settings: { crossfade: true, fadeSeconds: 6, beatMatch: false } };

describe("parse", () => {
  it("round-trips valid state", () => {
    expect(parse(JSON.stringify(valid), songIds)).toEqual(valid);
  });

  it("uses defaults for a missing key", () => {
    expect(parse(null, songIds)).toEqual(defaults);
  });

  it("uses defaults for non-JSON", () => {
    expect(parse("{not json", songIds)).toEqual(defaults);
  });

  it("uses defaults per field for wrong types", () => {
    const result = parse(JSON.stringify({ ...valid, queue: "junk", volume: "loud" }), songIds);
    expect(result).toEqual({ ...defaults, position: 42, repeat: "one", playlists: valid.playlists, settings: valid.settings });
  });

  it("drops unknown song ids and falls back to the first item", () => {
    const queue = { items: [{ qid: "x", songId: "999", order: 0 }, ...valid.queue.items], currentQid: "x" };
    const result = parse(JSON.stringify({ queue }), songIds);
    expect(result.queue.items.map((item) => item.qid)).toEqual(["a", "b"]);
    expect(result.queue.currentQid).toBe("a");
  });

  it("drops duplicate qids and malformed items", () => {
    const queue = { items: [valid.queue.items[0], valid.queue.items[0], null, { qid: 5 }], currentQid: "a" };
    expect(parse(JSON.stringify({ queue }), songIds).queue.items).toHaveLength(1);
  });

  it("rejects out-of-range volume and negative position", () => {
    const result = parse(JSON.stringify({ volume: 7, position: -3 }), songIds);
    expect(result.volume).toBe(0.5);
    expect(result.position).toBe(0);
  });

  it("ignores __proto__ and extra keys", () => {
    const text = '{"__proto__":{"polluted":true},"extra":1,"volume":0.2}';
    const result = parse(text, songIds);
    expect(result).toEqual({ ...defaults, volume: 0.2 });
    expect({}.polluted).toBeUndefined();
  });

  it("strips extra fields from queue items", () => {
    const queue = { items: [{ ...valid.queue.items[0], url: "https://evil.example/x.mp3" }], currentQid: "a" };
    expect(parse(JSON.stringify({ queue }), songIds).queue.items[0]).toEqual(valid.queue.items[0]);
  });

  it("falls back for an unknown repeat mode and non-boolean shuffled", () => {
    const text = JSON.stringify({ repeat: "sideways", queue: { ...valid.queue, shuffled: "yes" } });
    const result = parse(text, songIds);
    expect(result.repeat).toBe("off");
    expect(result.queue.shuffled).toBe(false);
  });

  it("drops bad playlists, unknown song ids and duplicate ids", () => {
    const playlists = [
      { id: "p1", name: "Gym", songIds: ["1", "999", "1", "2"], createdAt: 1 },
      { id: "p1", name: "Dup id", songIds: [], createdAt: 2 },
      { id: "p2", name: "   ", songIds: [] },
      { id: "p3", name: "No songs array", songIds: "1" },
      { id: 5, name: "Bad id", songIds: [] },
      "junk",
      { id: "p4", name: "x".repeat(61), songIds: [] },
    ];
    const result = parse(JSON.stringify({ playlists }), songIds).playlists;
    expect(result).toEqual([{ id: "p1", name: "Gym", songIds: ["1", "2"], createdAt: 1 }]);
  });

  it("uses an empty list when playlists isn't an array", () => {
    expect(parse('{"playlists":"junk"}', songIds).playlists).toEqual([]);
  });

  it.each([
    [{ crossfade: "yes", fadeSeconds: 6 }],
    [{ crossfade: true, fadeSeconds: 99 }],
    [{ crossfade: true, fadeSeconds: 6.5 }],
    ["junk"],
  ])("falls back to default settings for %j", (settings) => {
    expect(parse(JSON.stringify({ settings }), songIds).settings).toEqual({ crossfade: true, fadeSeconds: 6, beatMatch: false });
  });
});
