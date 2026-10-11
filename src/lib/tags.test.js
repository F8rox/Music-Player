import { describe, expect, it } from "vitest";
import { cleanText, songInfo, titleFromFilename } from "./tags";

describe("cleanText", () => {
  it("trims and strips control characters", () => {
    expect(cleanText("  Pay\u0000phone\u0007 \n")).toBe("Payphone");
  });

  it("caps length at 200", () => {
    expect(cleanText("x".repeat(500))).toHaveLength(200);
  });

  it("returns empty for non-strings", () => {
    expect(cleanText(undefined)).toBe("");
    expect(cleanText(42)).toBe("");
    expect(cleanText({ toString: () => "evil" })).toBe("");
  });

  it("keeps markup as plain text (React renders it literally)", () => {
    expect(cleanText("<script>alert(1)</script>")).toBe("<script>alert(1)</script>");
  });
});

describe("titleFromFilename", () => {
  it("drops the extension and underscores", () => {
    expect(titleFromFilename("my_song_name.mp3")).toBe("my song name");
  });

  it("falls back to Untitled", () => {
    expect(titleFromFilename(".mp3")).toBe("Untitled");
  });
});

describe("songInfo", () => {
  it("uses tags when present", () => {
    expect(songInfo({ title: "Payphone", artist: "Maroon 5", album: "Overexposed" }, "x.mp3"))
      .toEqual({ title: "Payphone", artist: "Maroon 5", album: "Overexposed" });
  });

  it("falls back to the filename and Unknown artist", () => {
    expect(songInfo({}, "Beggin'.mp3")).toEqual({ title: "Beggin'", artist: "Unknown artist", album: "" });
    expect(songInfo(undefined, "a.mp3").title).toBe("a");
  });
});
