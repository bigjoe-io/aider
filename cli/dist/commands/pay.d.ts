import { type Address } from "viem";
export interface PayOptions {
    /** false when --no-request is passed. */
    request: boolean;
    ttl?: string;
    sendAnyway?: boolean;
}
export declare const DEFAULT_TTL_MINUTES = 30;
export declare const MAX_TTL_MINUTES: number;
export declare function parseRecipient(raw: string): Address;
export declare function parseAmountArg(raw: string): bigint;
export declare function parseMemo(raw: string): string;
export declare function parseTtl(raw: string | undefined): number;
export declare function cmdPay(toRaw: string, amountRaw: string, memoRaw: string, opts: PayOptions): Promise<void>;
//# sourceMappingURL=pay.d.ts.map