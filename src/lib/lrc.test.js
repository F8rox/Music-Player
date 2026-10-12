import { describe, expect, it } from "vitest";
import { MAX_LRC_BYTES, activeIndex, isLrcName, matchSong, parseLrc, stemOf } from "./lrc";

describe("parseLrc", () => {
  it("reads timed lines and ignores tags and lines without a stamp", () => {
    const text = "[ar:Someone]\n[ti:Song]\n[00:12.50]First line\nplain text, no stamp\n[01:02.00]Second line";
    expect(parseLrc(text)).toEqual([{ time: 12.5, text: "First line" }, { time: 62, text: "Second line" }]);
  });

  it("accepts mm:ss, one to three fraction digits, and a colon before the fraction", () => {
    const times = parseLrc("[00:05]a\n[00:06.5]b\n[00:07.25]c\n[00:08.125]d\n[00:09:50]e").map((l) => l.time);
    expect(times).toEqual([5, 6.5, 7.25, 8.125, 9.5]);
  });

  it("makes one entry per stamp when a line has several, sorted by time", () => {
    const lines = parseLrc("[00:10.00][00:50.00]Chorus\n[00:30.00]Verse");
    expect(lines).toEqual([{ time: 10, text: "Chorus" }, { time: 30, text: "Verse" }, { time: 50, text: "Chorus" }]);
  });

  it("applies [offset:] in milliseconds: positive moves lines earlier, and never below 0", () => {
    expect(parseLrc("[offset:+500]\n[00:10.00]a\n[00:00.20]b").map((l) => l.time)).toEqual([0, 9.5]);
    expect(parseLrc("[offset:-1000]\n[00:10.00]a")[0].time).toBe(11);
  });

  it("keeps an empty text as a gap and strips enhanced word timings", () => {
    const lines = parseLrc("[00:01.00]\n[00:02.00]<00:02.00>Hel<00:02.50>lo");
    expect(lines).toEqual([{ time: 1, text: "" }, { time: 2, text: "Hello" }]);
  });

  it("handles Windows and old Mac line endings", () => {
    expect(parseLrc("[00:01.00]a\r\n[00:02.00]b\r[00:03.00]c")).toHaveLength(3);
  });

  it("drops malformed stamps: seconds of 60 or more, no digits, an unclosed bracket", () => {
    expect(parseLrc("[00:75.00]late\n[aa:bb]x\n[00:1.00]short\n[00:10.00 broken\n[00:20.00]ok")).toEqual([{ time: 20, text: "ok" }]);
  });

  it("returns [] for empty, non-string, stamp-free and oversized input", () => {
    expect(parseLrc("")).toEqual([]);
    expect(parseLrc(null)).toEqual([]);
    expect(parseLrc({ evil: 1 })).toEqual([]);
    expect(parseLrc("just words\nno times")).toEqual([]);
    expect(parseLrc("[00:01.00]x".padEnd(MAX_LRC_BYTES + 1, "y"))).toEqual([]);
  });

  it("cleans and caps text, and caps the number of lines", () => {
    expect(parseLrc("[00:01.00]He\u0007llo ")[0].text).toBe("Hello");
    expect(parseLrc(`[00:01.00]${"x".repeat(500)}`)[0].text).toHaveLength(200);
    const many = Array.from({ length: 3000 }, (_, i) => `[00:${String(i % 60).padStart(2, "0")}.00]l`).join("\n");
    expect(parseLrc(many)).toHaveLength(2000);
  });

  it("renders markup as plain text, never as HTML structure", () => {
    expect(parseLrc("[00:01.00]<img src=x onerror=alert(1)>")[0].text).toContain("<img");
  });
});

describe("activeIndex", () => {
  const lines = [{ time: 5 }, { time: 10 }, { time: 10.5 }, { time: 30 }];

  it("is -1 before the first line, then the last line that has started", () => {
    expect(activeIndex(lines, 0)).toBe(-1);
    expect(activeIndex(lines, 4.99)).toBe(-1);
    expect(activeIndex(lines, 5)).toBe(0);
    expect(activeIndex(lines, 10.2)).toBe(1);
    expect(activeIndex(lines, 29.9)).toBe(2);
    expect(activeIndex(lines, 9999)).toBe(3);
  });

  it("handles no lines and a single line", () => {
    expect(activeIndex([], 10)).toBe(-1);
    expect(activeIndex([{ time: 1 }], 1)).toBe(0);
  });
});

describe("file names and matching", () => {
  it("recognises .lrc case-insensitively and takes the stem", () => {
    expect(isLrcName("Song.LRC")).toBe(true);
    expect(isLrcName("Song.mp3")).toBe(false);
    expect(isLrcName("lrc")).toBe(false);
    expect(stemOf("Artist - Song.name.lrc")).toBe("Artist - Song.name");
  });

  const candidates = [
    { id: "a", names: ["Payphone"] },
    { id: "b", names: ["Beggin'", "Maneskin - Beggin'"] },
    { id: "c", names: ["Intro"] },
    { id: "d", names: ["Intro"] },
  ];

  it("matches a name ignoring case, punctuation and spacing", () => {
    expect(matchSong("PAYPHONE", candidates)).toBe("a");
    expect(matchSong("maneskin  -  beggin", candidates)).toBe("b");
    expect(matchSong("Béggin'", candidates)).toBeNull();
  });

  it("gives null for no match, an ambiguous match, and an empty or symbol-only name", () => {
    expect(matchSong("Unknown song", candidates)).toBeNull();
    expect(matchSong("Intro", candidates)).toBeNull();
    expect(matchSong("", candidates)).toBeNull();
    expect(matchSong("!!!", candidates)).toBeNull();
    expect(matchSong("Payphone", [])).toBeNull();
  });
});
