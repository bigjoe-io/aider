import { describe, expect, test } from "bun:test";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  HttpRequestError,
  InsufficientFundsError,
  NonceTooLowError,
  RawContractError,
  encodeErrorResult,
  getContractError,
  type Hex,
} from "viem";
import { AIDER_ABI } from "../src/abi";
import { CliError, EXPLAINED_ERRORS, decodeError, explainError, isContractRejection } from "../src/errors";

const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const SOLIDITY_ERROR = [{ type: "error", name: "Error", inputs: [{ name: "message", type: "string" }] }] as const;
const SOLIDITY_PANIC = [{ type: "error", name: "Panic", inputs: [{ name: "code", type: "uint256" }] }] as const;

/** The error viem throws from simulateContract when the node returns revert `data`. */
function simulateRevert(data: Hex, functionName = "agentPay"): ContractFunctionExecutionError {
  return getContractError(new RawContractError({ data }), {
    abi: AIDER_ABI,
    address: CONTRACT,
    args: [],
    functionName,
  }) as ContractFunctionExecutionError;
}

/** The same error built by hand, the way viem nests it. */
function wrapped(data: Hex): ContractFunctionExecutionError {
  const cause = new ContractFunctionRevertedError({ abi: AIDER_ABI, data, functionName: "agentPay" });
  return new ContractFunctionExecutionError(cause, { abi: AIDER_ABI, functionName: "agentPay", args: [] });
}

const abiErrors = AIDER_ABI.filter((e) => e.type === "error").map((e) => e.name);

describe("decodeError: every contract error in the ABI", () => {
  test("the ABI has all v1 and v2 errors", () => {
    for (const name of [
      "OverPerPaymentLimit",
      "OverDailyLimit",
      "InsufficientBalance",
      "AgentRevokedError",
      "AgentNotActive",
      "AgentExpired",
      "WalletPaused",
      "RecipientBlocked",
      "RecipientNotAllowed",
      "RequestNotFound",
      "InvalidRecipient",
      "TooManyOpenRequests",
    ]) {
      expect(abiErrors).toContain(name);
    }
  });

  for (const name of abiErrors) {
    test(`${name} decodes by name (getContractError path and nested path)`, () => {
      const data = encodeErrorResult({ abi: AIDER_ABI, errorName: name });
      for (const err of [simulateRevert(data), wrapped(data)]) {
        const d = decodeError(err);
        expect(d).toEqual({ name, kind: "contract" });
        expect(isContractRejection(d)).toBe(true);
      }
    });

    test(`${name} has a specific explanation and hint`, () => {
      expect(EXPLAINED_ERRORS).toContain(name);
      const e = explainError({ name, kind: "contract" });
      expect(e.message.length).toBeGreaterThan(10);
      expect(e.hint.length).toBeGreaterThan(10);
    });
  }

  test("the selectors that the old hard-coded map got wrong now decode", () => {
    // K6: `pay 1.00` over a 0.10 limit printed UnknownError instead of creating a request.
    const d = decodeError(simulateRevert(encodeErrorResult({ abi: AIDER_ABI, errorName: "OverPerPaymentLimit" })));
    expect(d.name).toBe("OverPerPaymentLimit");
  });
});

describe("decodeError: other revert shapes", () => {
  test("require strings become their reason", () => {
    for (const reason of ["WALLET_NOT_FOUND", "USDC_TRANSFER_FAILED", "USDC_TRANSFER_FROM_FAILED"]) {
      const data = encodeErrorResult({ abi: SOLIDITY_ERROR, errorName: "Error", args: [reason] });
      expect(decodeError(simulateRevert(data))).toEqual({ name: reason, kind: "require" });
      expect(EXPLAINED_ERRORS).toContain(reason);
    }
  });

  test("panics", () => {
    const data = encodeErrorResult({ abi: SOLIDITY_PANIC, errorName: "Panic", args: [0x11n] });
    const d = decodeError(simulateRevert(data));
    expect(d.name).toBe("Panic");
    expect(d.kind).toBe("panic");
    expect(d.detail).toContain("overflow");
  });

  test("unknown custom error selector", () => {
    const d = decodeError(simulateRevert("0xdeadbeef"));
    expect(d).toEqual({ name: "UnknownContractError", kind: "unknown_contract_error", detail: "0xdeadbeef" });
  });

  test("revert without data (e.g. a v2-only function on a v1 contract)", () => {
    const err = getContractError(new RawContractError({ data: "0x", message: "execution reverted" }), {
      abi: AIDER_ABI,
      address: CONTRACT,
      args: [1n],
      functionName: "getRequestState",
    });
    const d = decodeError(err);
    expect(d.kind).toBe("reverted");
    expect(isContractRejection(d)).toBe(true);
  });

  test("no contract at the address", () => {
    const err = new ContractFunctionExecutionError(new ContractFunctionZeroDataError({ functionName: "getWallet" }), {
      abi: AIDER_ABI,
      functionName: "getWallet",
      args: [1n],
    });
    expect(decodeError(err)).toEqual({ name: "NoContractCode", kind: "no_code" });
  });
});

describe("decodeError: client and network failures", () => {
  test("RPC unreachable", () => {
    const err = new HttpRequestError({ url: "http://127.0.0.1:1", details: "fetch failed" });
    const d = decodeError(err);
    expect(d.name).toBe("RpcError");
    expect(isContractRejection(d)).toBe(false);
  });

  test("no gas money", () => {
    expect(decodeError(new InsufficientFundsError()).name).toBe("InsufficientGasFunds");
  });

  test("nonce conflicts from parallel payments", () => {
    expect(decodeError(new NonceTooLowError()).name).toBe("NonceConflict");
  });

  test("plain Error with a network message", () => {
    expect(decodeError(new Error("fetch failed: ECONNREFUSED")).name).toBe("RpcError");
  });

  test("CliError passes through", () => {
    expect(decodeError(new CliError("KeyMissing", "m", "h")).name).toBe("KeyMissing");
  });
});

describe("explainError uses context", () => {
  const agent = {
    label: "Claude Code",
    perPaymentLimit: 100_000n,
    dailyLimit: 500_000n,
    expiresAt: 0n,
    active: true,
    spentToday: 450_000n,
    dayStart: 1_792_972_800n,
  };

  test("OverDailyLimit shows spent and remaining", () => {
    const e = explainError({ name: "OverDailyLimit", kind: "contract" }, { amount: 100_000n, agent, now: 1_792_972_800n + 60n });
    expect(e.message).toContain("$0.10");
    expect(e.message).toContain("spent $0.45 of $0.50");
    expect(e.message).toContain("$0.05 left");
  });

  test("InsufficientBalance says no request was created", () => {
    const e = explainError({ name: "InsufficientBalance", kind: "contract" }, { amount: 1_000_000n, walletId: 1n, wallet: { available: 20_000n, paused: false } });
    expect(e.message).toContain("only $0.02 available");
    expect(e.message).toContain("No approval request was created");
  });

  test("AgentNotActive is 'never added', not 'revoked'", () => {
    const e = explainError({ name: "AgentNotActive", kind: "contract" }, { agentAddress: "0xabc", walletId: 1n });
    expect(e.message).toContain("never added");
    expect(e.message).not.toContain("revoked");
  });
});
