import { describe, expect, it } from "vitest";

import { formatPrice, parsePrice } from "./catalog-rules";

describe("catalog price rules", () => {
  it("converts Brazilian price input to cents", () => {
    expect(parsePrice("1.234,56")).toBe(123456);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });

  it("formats an optional price without adding currency text", () => {
    expect(formatPrice(18990)).toBe("189,90");
    expect(formatPrice(null)).toBe("");
  });
});
