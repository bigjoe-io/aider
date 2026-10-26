import { describe, expect, test } from "bun:test";
import { AmountError, formatUsdc, parseUsdcAmount, usd } from "../src/amount";

describe("parseUsdcAmount", () => {
  const ok: Array<[string, bigint]> = [
    ["0.05", 50_000n],
    ["$0.05", 50_000n],
    ["1", 1_000_000n],
    ["1.5", 1_500_000n],
    [".5", 500_000n],
    ["1.", 1_000_000n],
    ["00.10", 100_000n],
    [" 1 ", 1_000_000n],
    ["$1.234567", 1_234_567n],
    ["0.000001", 1n],
    ["1000000", 1_000_000_000_000n],
  ];
  for (const [input, raw] of ok) {
    test(`accepts ${JSON.stringify(input)}`, () => {
      expect(parseUsdcAmount(input)).toBe(raw);
    });
  }

  const bad: Array<[string, RegExp]> = [
    ["0", /greater than 0/],
    ["0.000000", /greater than 0/],
    ["$0", /greater than 0/],
    ["0.0000001", /7 decimal places/],
    ["1.0000000", /7 decimal places/],
    ["-1", /negative/],
    ["$-1", /negative/],
    ["+1", /not a valid amount/],
    ["1e3", /exponent/],
    ["1,000", /thousands separators/],
    ["$", /empty/],
    ["", /empty/],
    ["   ", /empty/],
    [".", /not a valid amount/],
    ["$ 1", /not a valid amount/],
    ["$$1", /not a valid amount/],
    ["1.2.3", /not a valid amount/],
    ["abc", /not a valid amount/],
    ["Infinity", /not a valid amount/],
    ["NaN", /not a valid amount/],
    ["0x10", /not a valid amount/],
    ["bash.05", /not a valid amount/],
    ["1".repeat(80), /too large/],
  ];
  for (const [input, msg] of bad) {
    test(`rejects ${JSON.stringify(input.length > 20 ? `${input.slice(0, 20)}…` : input)}`, () => {
      expect(() => parseUsdcAmount(input)).toThrow(AmountError);
      expect(() => parseUsdcAmount(input)).toThrow(msg);
    });
  }
});

describe("formatUsdc", () => {
  const cases: Array<[bigint, string]> = [
    [0n, "0.00"],
    [1n, "0.000001"],
    [10n, "0.00001"],
    [50_000n, "0.05"],
    [100_000n, "0.10"],
    [1_000_000n, "1.00"],
    [1_500_000n, "1.50"],
    [1_230_000n, "1.23"],
    [1_230_001n, "1.230001"],
    [1_234_567n, "1.234567"],
    [100_000_000n, "100.00"],
    [123_456_789_000_000n, "123456789.00"],
    [-50_000n, "-0.05"],
  ];
  for (const [raw, text] of cases) {
    test(`${raw} -> ${text}`, () => {
      expect(formatUsdc(raw)).toBe(text);
    });
  }

  test("round-trips every parsed amount exactly", () => {
    for (const s of ["0.05", "1.234567", "0.000001", "42", "1000.5"]) {
      expect(parseUsdcAmount(formatUsdc(parseUsdcAmount(s)))).toBe(parseUsdcAmount(s));
    }
  });

  test("usd() adds a dollar sign for human lines", () => {
    expect(usd(50_000n)).toBe("$0.05");
    expect(usd(-1n)).toBe("-$0.000001");
  });
});
