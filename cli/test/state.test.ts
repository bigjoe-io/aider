import { describe, expect, test } from "bun:test";
import { scanWindows, WINDOW_BLOCKS } from "../src/commands/history";
import { redact, registerSecret } from "../src/output";
import {
  agentExists,
  agentStatus,
  effectiveRequestStatus,
  effectiveSpentToday,
  maxDirectPayment,
  remainingToday,
  utcDayStart,
  type AgentRecord,
} from "../src/state";

const MIDNIGHT = 1_792_972_800n; // 2026-10-26T00:00:00Z
const NOON = MIDNIGHT + 43_200n;

const never: AgentRecord = {
  label: "",
  perPaymentLimit: 0n,
  dailyLimit: 0n,
  expiresAt: 0n,
  active: false,
  spentToday: 0n,
  dayStart: 0n,
};

const active: AgentRecord = {
  label: "Claude Code",
  perPaymentLimit: 100_000n,
  dailyLimit: 500_000n,
  expiresAt: NOON + 30n * 86_400n,
  active: true,
  spentToday: 130_000n,
  dayStart: MIDNIGHT,
};

describe("agent status", () => {
  test("never added -> not_added (not 'revoked')", () => {
    expect(agentExists(never)).toBe(false);
    expect(agentStatus(never, NOON)).toBe("not_added");
  });
  test("active", () => {
    expect(agentStatus(active, NOON)).toBe("active");
    expect(agentStatus({ ...active, expiresAt: 0n }, NOON)).toBe("active");
  });
  test("revoked", () => {
    expect(agentStatus({ ...active, active: false }, NOON)).toBe("revoked");
  });
  test("revoked wins over expired (contract check order)", () => {
    expect(agentStatus({ ...active, active: false, expiresAt: NOON - 1n }, NOON)).toBe("revoked");
  });
  test("expired only after expiresAt (block.timestamp > expiresAt)", () => {
    expect(agentStatus({ ...active, expiresAt: NOON }, NOON)).toBe("active");
    expect(agentStatus({ ...active, expiresAt: NOON - 1n }, NOON)).toBe("expired");
  });
  test("a revoked agent with only a label still exists", () => {
    expect(agentStatus({ ...never, label: "x" }, NOON)).toBe("revoked");
  });
});

describe("effective spentToday (v1 returns a stale value after midnight UTC)", () => {
  test("same UTC day keeps the stored value", () => {
    expect(effectiveSpentToday(active, NOON)).toBe(130_000n);
    expect(effectiveSpentToday(active, MIDNIGHT + 86_399n)).toBe(130_000n);
    expect(remainingToday(active, NOON)).toBe(370_000n);
  });
  test("after midnight UTC it is 0", () => {
    expect(effectiveSpentToday(active, MIDNIGHT + 86_400n)).toBe(0n);
    expect(remainingToday(active, MIDNIGHT + 86_400n)).toBe(500_000n);
  });
  test("v2's already-reset values are left alone", () => {
    const v2 = { ...active, spentToday: 0n, dayStart: MIDNIGHT + 86_400n };
    expect(effectiveSpentToday(v2, MIDNIGHT + 90_000n)).toBe(0n);
  });
  test("utcDayStart", () => {
    expect(utcDayStart(NOON)).toBe(MIDNIGHT);
    expect(utcDayStart(MIDNIGHT)).toBe(MIDNIGHT);
  });
  test("remaining never goes negative", () => {
    expect(remainingToday({ ...active, spentToday: 600_000n }, NOON)).toBe(0n);
  });
  test("maxDirectPayment = min(per-payment, remaining today, available), 0 when blocked", () => {
    const w = { available: 2_000_000n, paused: false };
    expect(maxDirectPayment(active, w, NOON)).toBe(100_000n);
    expect(maxDirectPayment({ ...active, spentToday: 450_000n }, w, NOON)).toBe(50_000n);
    expect(maxDirectPayment(active, { available: 20_000n, paused: false }, NOON)).toBe(20_000n);
    expect(maxDirectPayment(active, { ...w, paused: true }, NOON)).toBe(0n);
    expect(maxDirectPayment({ ...active, active: false }, w, NOON)).toBe(0n);
  });
});

describe("effective request status", () => {
  const req = { expiresAt: NOON + 1_800n, status: 0 };

  test("pending within its TTL, approvable up to and including expiresAt", () => {
    expect(effectiveRequestStatus(req, NOON).status).toBe("pending");
    const atDeadline = effectiveRequestStatus(req, NOON + 1_800n);
    expect(atDeadline.status).toBe("pending");
    expect(atDeadline.approvable).toBe(true);
  });

  test("pending past its TTL is expired (owner can't approve; funds still reserved)", () => {
    const e = effectiveRequestStatus(req, NOON + 1_801n);
    expect(e).toEqual({
      status: "expired",
      onchainStatus: "pending",
      expiredBecause: "ttl",
      approvable: false,
      reserved: true,
      blockedByRules: false,
    });
  });

  test("onchain approved / rejected / expired", () => {
    expect(effectiveRequestStatus({ ...req, status: 1 }, NOON).status).toBe("approved");
    expect(effectiveRequestStatus({ ...req, status: 2 }, NOON).status).toBe("rejected");
    const released = effectiveRequestStatus({ ...req, status: 3 }, NOON + 2_000n);
    expect(released.status).toBe("expired");
    expect(released.expiredBecause).toBe("ttl");
    expect(released.reserved).toBe(false);
  });

  test("v2: voided by revoke/agent expiry within the TTL -> expired (voided)", () => {
    const e = effectiveRequestStatus(req, NOON, { status: 0, approvable: false, releasable: true });
    expect(e.status).toBe("expired");
    expect(e.expiredBecause).toBe("voided");
    expect(e.reserved).toBe(true);
    // released early on v2 by expireRequest after a revoke
    expect(effectiveRequestStatus({ ...req, status: 3 }, NOON).expiredBecause).toBe("voided");
  });

  test("v2: not approvable but not releasable (recipient rules) stays pending", () => {
    const e = effectiveRequestStatus(req, NOON, { status: 0, approvable: false, releasable: false });
    expect(e.status).toBe("pending");
    expect(e.approvable).toBe(false);
    expect(e.blockedByRules).toBe(true);
  });

  test("v1 (no getRequestState): a revoked agent's request is still pending (v1 lets the owner approve it)", () => {
    expect(effectiveRequestStatus(req, NOON, null).status).toBe("pending");
  });
});

describe("history scan windows", () => {
  test("cover [floor, latest] exactly, newest first, each <= 9,500 blocks", () => {
    const w = scanWindows(100_000n, 69_000n);
    expect(w[0]).toEqual([100_000n - WINDOW_BLOCKS + 1n, 100_000n]);
    let expectTo = 100_000n;
    for (const [from, to] of w) {
      expect(to).toBe(expectTo);
      expect(to - from + 1n <= WINDOW_BLOCKS).toBe(true);
      expectTo = from - 1n;
    }
    expect(w[w.length - 1][0]).toBe(69_000n);
  });
  test("down to block 0", () => {
    const w = scanWindows(20_000n, 0n);
    expect(w.map(([f]) => f)).toEqual([10_501n, 1_001n, 0n]);
  });
  test("single block and empty ranges", () => {
    expect(scanWindows(5n, 5n)).toEqual([[5n, 5n]]);
    expect(scanWindows(4n, 5n)).toEqual([]);
  });
});

describe("output redaction", () => {
  test("the private key never appears, in any case, with or without 0x", () => {
    const key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    registerSecret(key);
    const text = `a ${key} b ${key.slice(2).toUpperCase()} c`;
    expect(redact(text)).toBe("a [redacted] b [redacted] c");
  });
});
