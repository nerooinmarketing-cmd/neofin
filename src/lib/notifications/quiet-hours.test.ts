import { describe, expect, it } from "vitest";
import { isWithinQuietHours } from "./quiet-hours";

describe("isWithinQuietHours", () => {
  it("returns false when either bound is missing", () => {
    expect(isWithinQuietHours(23, null, 6)).toBe(false);
    expect(isWithinQuietHours(23, 22, null)).toBe(false);
  });

  it("handles a same-day range (e.g. 09-17)", () => {
    expect(isWithinQuietHours(10, 9, 17)).toBe(true);
    expect(isWithinQuietHours(8, 9, 17)).toBe(false);
    expect(isWithinQuietHours(17, 9, 17)).toBe(false);
  });

  it("handles a midnight-wrapping range (e.g. 22-06)", () => {
    expect(isWithinQuietHours(23, 22, 6)).toBe(true);
    expect(isWithinQuietHours(3, 22, 6)).toBe(true);
    expect(isWithinQuietHours(12, 22, 6)).toBe(false);
  });

  it("treats an equal start/end as no restriction", () => {
    expect(isWithinQuietHours(5, 8, 8)).toBe(false);
  });
});
