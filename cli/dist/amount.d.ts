export declare const USDC_DECIMALS = 6;
export declare class AmountError extends Error {
    constructor(message: string);
}
/**
 * Parses a USDC amount typed by an agent: "0.05", "$0.05", "1", "1.5", ".5", "1." (surrounding
 * whitespace is ignored). Rejects anything else — signs, exponents, commas, more than 6 decimals,
 * zero — with a message that says what to type instead.
 */
export declare function parseUsdcAmount(input: string): bigint;
/**
 * Formats smallest units as a decimal USDC string with full precision and at least two decimals:
 * 50000n -> "0.05", 1000000n -> "1.00", 1234567n -> "1.234567", 1n -> "0.000001".
 */
export declare function formatUsdc(raw: bigint): string;
/** "$1.50" for human lines on stderr. */
export declare function usd(raw: bigint): string;
//# sourceMappingURL=amount.d.ts.map