import { describe, expect, it } from "vitest";
import { append, current, emptyQueue, fromList, insertNext, move, next, prev, remove } from "./queue";

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