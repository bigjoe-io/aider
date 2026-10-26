import { type Ctx } from "./chain.js";
import { type EffectiveRequest, type RequestRecord } from "./state.js";
export declare function parseRequestId(raw: string): bigint;
export interface RequestView {
    json: Record<string, unknown>;
    effective: EffectiveRequest;
    request: RequestRecord;
    now: bigint;
    human: string;
}
export declare function duration(seconds: bigint): string;
/** Reads a request and works out what it means now: expired once its TTL passes, or once voided (v2). */
export declare function loadRequestView(ctx: Ctx, id: bigint): Promise<RequestView>;
//# sourceMappingURL=requests.d.ts.map