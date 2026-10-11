import { describe, expect, it } from "vitest";
import { formatTime } from "./format";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [59.9, "0:59"],
    [60, "1:00"],
    [3599, "59:59"],
    [NaN, "0:00"],
    [Infinity, "0:00"],
    [-5, "0:00"],
    [undefined, "0:00"],
  ])("%s -> %s", (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });
});
