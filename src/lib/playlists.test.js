import { describe, expect, it } from "vitest";
import {
  addSong, create, moveSong, remove, removeSong, removeSongEverywhere, rename, validateName,
} from "./playlists";

const gym = () => [{ id: "p1", name: "Gym", songIds: ["a", "b", "c"], createdAt: 1 }];
const ids = (list) => list[0].songIds;

describe("validateName", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["x".repeat(61), null],
    ["x".repeat(60), "x".repeat(60)],
    ["  Gym  ", "Gym"],
    [undefined, null],
    [42, null],
  ])("%j -> %j", (input, expected) => {
    expect(validateName(input)).toBe(expected);
  });
});

describe("create / rename / remove", () => {
  it("creates with a trimmed name", () => {
    expect(create([], "  Chill ", "p2", 5)).toEqual([{ id: "p2", name: "Chill", songIds: [], createdAt: 5 }]);
  });

  it("ignores an invalid name on create and rename", () => {
    const list = gym();
    expect(create(list, "  ", "p2", 5)).toBe(list);
    expect(rename(list, "p1", "")[0].name).toBe("Gym");
  });

  it("renames and removes", () => {
    expect(rename(gym(), "p1", "Run")[0].name).toBe("Run");
    expect(remove(gym(), "p1")).toEqual([]);
  });
});

describe("songs", () => {
  it("adds a new song and refuses a duplicate", () => {
    const first = addSong(gym(), "p1", "d");
    expect(first.added).toBe(true);
    expect(ids(first.list)).toEqual(["a", "b", "c", "d"]);
    const again = addSong(first.list, "p1", "a");
    expect(again.added).toBe(false);
    expect(again.list).toBe(first.list);
  });

  it("refuses to add to an unknown playlist", () => {
    expect(addSong(gym(), "nope", "d").added).toBe(false);
  });

  it("removes a song", () => {
    expect(ids(removeSong(gym(), "p1", "b"))).toEqual(["a", "c"]);
  });

  it("moves the last song to the top and the first to the bottom", () => {
    expect(ids(moveSong(gym(), "p1", "c", 0))).toEqual(["c", "a", "b"]);
    expect(ids(moveSong(gym(), "p1", "a", 2))).toEqual(["b", "c", "a"]);
  });

  it("clamps the move index and ignores unknown songs", () => {
    expect(ids(moveSong(gym(), "p1", "a", 99))).toEqual(["b", "c", "a"]);
    expect(ids(moveSong(gym(), "p1", "zzz", 0))).toEqual(["a", "b", "c"]);
  });

  it("removes a deleted library song from every playlist", () => {
    const list = [...gym(), { id: "p2", name: "Other", songIds: ["b", "x"], createdAt: 2 }];
    const result = removeSongEverywhere(list, "b");
    expect(result.map((p) => p.songIds)).toEqual([["a", "c"], ["x"]]);
  });
});
