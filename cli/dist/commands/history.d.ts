/** Arc's eth_getLogs accepts at most 10,000 blocks (inclusive); stay safely under it. */
export declare const WINDOW_BLOCKS = 9500n;
export interface HistoryOptions {
    limit?: string;
    blocks?: string;
}
/**
 * Block windows to scan, newest first: [from, to] inclusive, each at most `size` blocks,
 * covering exactly [floor, latest].
 */
export declare function scanWindows(latest: bigint, floor: bigint, size?: bigint): Array<[bigint, bigint]>;
export declare function cmdHistory(opts: HistoryOptions): Promise<void>;
//# sourceMappingURL=history.d.ts.map