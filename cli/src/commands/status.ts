import { buildClients, readRequest, REQUEST_STATUS, formatUsdc, txUrl } from "../chain.js";
import { die } from "../config.js";

export async function cmdStatus(requestIdStr: string): Promise<void> {
  let requestId: bigint;
  try {
    requestId = BigInt(requestIdStr);
  } catch {
    die(`Invalid request ID "${requestIdStr}". Must be a number.`);
  }

  const clients = buildClients();
  const req = await readRequest(clients, requestId);

  if (req.walletId === 0n && req.agent === "0x0000000000000000000000000000000000000000") {
    const result = { status: "error", error: "RequestNotFound", requestId: requestIdStr };
    console.log(JSON.stringify(result, null, 2));
    console.error(`\nRequest #${requestIdStr} not found.`);
    process.exit(1);
  }

  const statusLabel = REQUEST_STATUS[req.status] ?? "unknown";
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(req.expiresAt);
  const timeLeft = expiresAt > now ? expiresAt - now : 0;

  const result = {
    requestId:  requestIdStr,
    status:     statusLabel,
    walletId:   req.walletId.toString(),
    agent:      req.agent,
    to:         req.to,
    amount:     formatUsdc(req.amount),
    memo:       req.memo,
    expiresAt:  new Date(expiresAt * 1000).toISOString(),
    timeLeftSec: timeLeft,
  };

  console.log(JSON.stringify(result, null, 2));

  const statusLine =
    statusLabel === "pending"
      ? `Pending approval — ${Math.ceil(timeLeft / 60)} min left`
      : statusLabel === "approved"
        ? "Approved and paid"
        : statusLabel === "rejected"
          ? "Rejected by owner"
          : "Expired";

  console.log(`\nRequest #${requestIdStr}: ${statusLine}. Amount: ${formatUsdc(req.amount)}. To: ${req.to}`);
}
