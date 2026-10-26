import { buildClients, readRequest, REQUEST_STATUS, formatUsdc, txUrl } from "../chain.js";
import { die } from "../config.js";

const POLL_INTERVAL_MS = 5000; // 5 s

export async function cmdWait(requestIdStr: string): Promise<void> {
  let requestId: bigint;
  try {
    requestId = BigInt(requestIdStr);
  } catch {
    die(`Invalid request ID "${requestIdStr}". Must be a number.`);
  }

  const clients = buildClients();

  console.error(`Watching request #${requestIdStr} (polling every 5 s, Ctrl-C to stop)...`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const req = await readRequest(clients, requestId);
    const now = Math.floor(Date.now() / 1000);
    const statusLabel = REQUEST_STATUS[req.status] ?? "unknown";

    if (req.status !== 0 /* PENDING */) {
      const result = {
        requestId:  requestIdStr,
        status:     statusLabel,
        amount:     formatUsdc(req.amount),
        to:         req.to,
        memo:       req.memo,
        resolvedAt: new Date().toISOString(),
      };
      console.log(JSON.stringify(result, null, 2));

      const label =
        statusLabel === "approved"
          ? `Approved and paid to ${req.to}`
          : statusLabel === "rejected"
            ? "Rejected by the wallet owner"
            : "Expired without approval";

      console.log(`\nRequest #${requestIdStr}: ${label}.`);
      return;
    }

    // Still pending — show countdown
    const timeLeft = Number(req.expiresAt) - now;
    if (timeLeft <= 0) {
      console.error(`Waiting... (TTL passed — owner may still approve; or run \`leash status ${requestIdStr}\`)`);
    } else {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      process.stderr.write(`\r  pending — ${mins}m ${secs}s left      `);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
