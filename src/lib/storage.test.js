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
  },
  volume: 0.3,
  position: 42,
};
const defaults = { queue: { items: [], currentQid: null }, volume: 0.5, position: 0 };

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
    expect(result).toEqual({ ...defaults, position: 42 });
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
});
