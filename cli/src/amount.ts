// USDC amounts as bigint smallest units (6 decimals). No floating point anywhere.

export const USDC_DECIMALS = 6;
const SCALE = 10n ** BigInt(USDC_DECIMALS);
const MAX_UINT256 = 2n ** 256n - 1n;
const PLAIN_DECIMAL = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export class AmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmountError";
  }
}

/**
 * Parses a USDC amount typed by an agent: "0.05", "$0.05", "1", "1.5", ".5", "1." (surrounding
 * whitespace is ignored). Rejects anything else — signs, exponents, commas, more than 6 decimals,
 * zero — with a message that says what to type instead.
 */
export function parseUsdcAmount(input: string): bigint {
  const trimmed = input.trim();
  const body = trimmed.startsWith("$") ? trimmed.slice(1) : trimmed;

  if (body === "") {
    throw new AmountError("Amount is empty. Use a USDC amount like 0.05 or $0.05.");
  }
  if (body.startsWith("-")) {
    throw new AmountError(`"${input}" is negative. The amount must be greater than 0.`);
  }
  if (!PLAIN_DECIMAL.test(body)) {
    const hint = body.includes(",")
      ? " Don't use thousands separators."
      : /e/i.test(body)
        ? " Don't use exponent notation."
        : "";
    throw new AmountError(
      `"${input}" is not a valid amount. Use a plain decimal like 0.05 or $0.05.${hint}`,
    );
  }

  const dot = body.indexOf(".");
  const whole = dot === -1 ? body : body.slice(0, dot);
  const fraction = dot === -1 ? "" : body.slice(dot + 1);

  if (fraction.length > USDC_DECIMALS) {
    throw new AmountError(
      `"${input}" has ${fraction.length} decimal places. USDC has ${USDC_DECIMALS} (the smallest amount is 0.000001).`,
    );
  }

  const raw = BigInt(whole === "" ? "0" : whole) * SCALE + BigInt(fraction.padEnd(USDC_DECIMALS, "0"));

  if (raw === 0n) {
    throw new AmountError("The amount must be greater than 0.");
  }
  if (raw > MAX_UINT256) {
    throw new AmountError(`"${input}" is too large.`);
  }
  return raw;
}

/**
 * Formats smallest units as a decimal USDC string with full precision and at least two decimals:
 * 50000n -> "0.05", 1000000n -> "1.00", 1234567n -> "1.234567", 1n -> "0.000001".
 */
export function formatUsdc(raw: bigint): string {
  const sign = raw < 0n ? "-" : "";
  const abs = raw < 0n ? -raw : raw;
  const whole = abs / SCALE;
  let fraction = (abs % SCALE).toString().padStart(USDC_DECIMALS, "0");
  while (fraction.length > 2 && fraction.endsWith("0")) fraction = fraction.slice(0, -1);
  return `${sign}${whole}.${fraction}`;
}

/** "$1.50" for human lines on stderr. */
export function usd(raw: bigint): string {
  const s = formatUsdc(raw);
  return s.startsWith("-") ? `-$${s.slice(1)}` : `$${s}`;
}
