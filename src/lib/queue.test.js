import { describe, expect, it } from "vitest";
import {
  afterEnded, append, current, emptyQueue, fromList, insertNext, move, next, prev, remove, removeSong, shuffle, unshuffle,
} from "./queue";

const ids = () => {
  let n = 0;
  return () => `q${n++}`;
};
const songsOf = (queue) => queue.items.map((item) => item.songId);
const build = (start = 0) => fromList(["a", "b", "c"], start, ids());

describe("fromList", () => {
  it("keeps list order and starts at the clicked song", () => {
    const queue = build(1);
    expect(songsOf(queue)).toEqual(["a", "b", "c"]);
    expect(current(queue).songId).toBe("b");
    expect(queue.items.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  it("gives a null current for an empty list", () => {
    expect(fromList([], 0, ids()).currentQid).toBeNull();
  });
});

describe("current", () => {
  it("is null for an empty queue", () => {
    expect(current(emptyQueue)).toBeNull();
  });
});

describe("next", () => {
  it("advances", () => {
    expect(current(next(build(0), "off").queue).songId).toBe("b");
  });

  it("stops at the end with repeat off", () => {
    const result = next(build(2), "off");
    expect(result.stopped).toBe(true);
    expect(current(result.queue).songId).toBe("c");
  });

  it("wraps at the end with repeat all", () => {
    const result = next(build(2), "all");
    expect(result.stopped).toBe(false);
    expect(current(result.queue).songId).toBe("a");
  });

  it("stops on an empty queue", () => {
    expect(next(emptyQueue, "all").stopped).toBe(true);
  });

  it("works with a single item", () => {
    const single = fromList(["a"], 0, ids());
    expect(next(single, "off").stopped).toBe(true);
    expect(next(single, "all").queue.currentQid).toBe(single.currentQid);
  });
});

describe("prev", () => {
  it("goes back one", () => {
    expect(current(prev(build(2))).songId).toBe("b");
  });

  it("returns the same queue at the first item", () => {
    const queue = build(0);
    expect(prev(queue)).toBe(queue);
  });
});

describe("insertNext / append", () => {
  it("inserts directly after the current item", () => {
    const queue = insertNext(build(0), "z", "new");
    expect(songsOf(queue)).toEqual(["a", "z", "b", "c"]);
    expect(current(next(queue, "off").queue).songId).toBe("z");
  });

  it("appends to the end and renumbers order", () => {
    const queue = append(build(0), "z", "new");
    expect(songsOf(queue)).toEqual(["a", "b", "c", "z"]);
    expect(queue.items.map((item) => item.order)).toEqual([0, 1, 2, 3]);
  });

  it("allows the same song twice with distinct qids", () => {
    const queue = append(build(0), "a", "dup");
    expect(songsOf(queue)).toEqual(["a", "b", "c", "a"]);
    expect(new Set(queue.items.map((item) => item.qid)).size).toBe(4);
  });

  it("makes the first added song current on an empty queue", () => {
    const queue = append(emptyQueue, "a", "first");
    expect(queue.currentQid).toBe("first");
    expect(insertNext(emptyQueue, "a", "x").currentQid).toBe("x");
  });
});

describe("remove", () => {
  it("removes an item before the current one", () => {
    const queue = build(1);
    const result = remove(queue, queue.items[0].qid);
    expect(songsOf(result)).toEqual(["b", "c"]);
    expect(current(result).songId).toBe("b");
  });

  it("removes an item after the current one", () => {
    const queue = build(0);
    expect(songsOf(remove(queue, queue.items[2].qid))).toEqual(["a", "b"]);
  });

  it("refuses to remove the current item", () => {
    const queue = build(0);
    expect(remove(queue, queue.currentQid)).toBe(queue);
  });
});

describe("move", () => {
  it("moves an item up", () => {
    const queue = build(0);
    expect(songsOf(move(queue, queue.items[2].qid, 0))).toEqual(["c", "a", "b"]);
  });

  it("moves an item down and renumbers order", () => {
    const queue = build(0);
    const moved = move(queue, queue.items[0].qid, 2);
    expect(songsOf(moved)).toEqual(["b", "c", "a"]);
    expect(moved.items.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  it("is a no-op for the same index or an unknown qid", () => {
    const queue = build(0);
    expect(move(queue, queue.items[1].qid, 1)).toBe(queue);
    expect(move(queue, "nope", 0)).toBe(queue);
  });

  it("keeps the current item current when it moves", () => {
    const queue = build(0);
    const moved = move(queue, queue.currentQid, 2);
    expect(current(moved).songId).toBe("a");
    expect(next(moved, "all").queue.currentQid).toBe(moved.items[0].qid);
  });

  it("clamps an out-of-range index", () => {
    const queue = build(0);
    expect(songsOf(move(queue, queue.items[0].qid, 99))).toEqual(["b", "c", "a"]);
    expect(songsOf(move(queue, queue.items[2].qid, -5))).toEqual(["c", "a", "b"]);
  });
});
// Deterministic LCG so shuffle tests are repeatable.
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const big = (start) => fromList(["a", "b", "c", "d", "e", "f", "g", "h"], start, ids());

describe("shuffle / unshuffle", () => {
  it("keeps items up to the current one fixed and permutes the rest", () => {
    const queue = big(2);
    const shuffled = shuffle(queue, seeded(42));
    expect(songsOf(shuffled).slice(0, 3)).toEqual(["a", "b", "c"]);
    expect([...songsOf(shuffled)].sort()).toEqual(songsOf(queue));
    expect(songsOf(shuffled)).not.toEqual(songsOf(queue));
    expect(shuffled.currentQid).toBe(queue.currentQid);
    expect(shuffled.shuffled).toBe(true);
  });

  it("is deterministic for the same seed", () => {
    expect(songsOf(shuffle(big(0), seeded(7)))).toEqual(songsOf(shuffle(big(0), seeded(7))));
  });

  it("unshuffle restores the original order", () => {
    const queue = big(0);
    const restored = unshuffle(shuffle(queue, seeded(42)));
    expect(songsOf(restored)).toEqual(songsOf(queue));
    expect(restored.shuffled).toBe(false);
  });

  it("keeps a song added while shuffled, after the originals", () => {
    const shuffled = append(shuffle(big(0), seeded(42)), "z", "added");
    const restored = unshuffle(shuffled);
    expect(songsOf(restored)).toEqual(["a", "b", "c", "d", "e", "f", "g", "h", "z"]);
  });

  it("removing while shuffled doesn't break unshuffle", () => {
    const shuffled = shuffle(big(0), seeded(42));
    const removed = remove(shuffled, shuffled.items.find((item) => item.songId === "d").qid);
    expect(songsOf(unshuffle(removed))).toEqual(["a", "b", "c", "e", "f", "g", "h"]);
  });

  it("only reorders after the current item when unshuffling mid-queue", () => {
    const shuffled = shuffle(big(0), seeded(42));
    const advanced = next(next(shuffled, "off").queue, "off").queue;
    const restored = unshuffle(advanced);
    expect(songsOf(restored).slice(0, 3)).toEqual(songsOf(advanced).slice(0, 3));
    expect(current(restored).qid).toBe(advanced.currentQid);
  });

  it("handles an empty queue", () => {
    expect(shuffle(emptyQueue, seeded(1)).items).toEqual([]);
    expect(unshuffle(emptyQueue).items).toEqual([]);
  });
});

describe("afterEnded (repeat modes)", () => {
  it("repeat one keeps the same item", () => {
    const queue = build(1);
    const result = afterEnded(queue, "one");
    expect(result.queue.currentQid).toBe(queue.currentQid);
    expect(result.stopped).toBe(false);
  });

  it("repeat all wraps at the end", () => {
    expect(current(afterEnded(build(2), "all").queue).songId).toBe("a");
  });

  it("repeat off stops at the end", () => {
    expect(afterEnded(build(2), "off").stopped).toBe(true);
  });

  it("the Next button still advances with repeat one (caller passes all)", () => {
    expect(current(next(build(1), "all").queue).songId).toBe("c");
  });
});
describe("removeSong (library delete)", () => {
  it("removes every copy of a non-current song", () => {
    const queue = append(build(0), "b", "dup");
    const result = removeSong(queue, "b");
    expect(songsOf(result)).toEqual(["a", "c"]);
    expect(result.currentQid).toBe(queue.currentQid);
  });

  it("moves to the next remaining item when the current song is removed", () => {
    const queue = build(0);
    const result = removeSong(queue, "a");
    expect(current(result).songId).toBe("b");
  });

  it("skips later copies of the same song when choosing the next item", () => {
    const queue = insertNext(build(0), "a", "copy");
    expect(current(removeSong(queue, "a")).songId).toBe("b");
  });

  it("stops (null current) when the removed current song was last", () => {
    expect(removeSong(build(2), "c").currentQid).toBeNull();
  });

  it("returns the same queue when the song isn't in it", () => {
    const queue = build(0);
    expect(removeSong(queue, "zzz")).toBe(queue);
  });
});