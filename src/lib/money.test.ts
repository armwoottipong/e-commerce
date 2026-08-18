import { describe, expect, it } from "vitest";
import { formatThb, thb } from "./money";

describe("money helpers", () => {
  it("stores THB as satang-like integer", () => {
    expect(thb(1290)).toBe(129000);
  });

  it("formats Thai baht", () => {
    expect(formatThb(129000)).toContain("1,290");
  });
});
