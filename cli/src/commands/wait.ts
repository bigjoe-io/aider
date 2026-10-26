import { loadContext } from "../chain.js";
import { CliError } from "../errors.js";
import { emit, emitError, note } from "../output.js";
import { duration, loadRequestView, parseRequestId, type RequestView } from "../requests.js";

const POLL_MS = 5_000;
/** Consecutive failed polls (RPC hiccups) tolerated before giving up. */
const MAX_POLL_FAILURES = 5;

function parseTimeout(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const v = raw.trim();
  const minutes = /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(v) ? Number(v) : NaN;
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 525_600) {
    throw new CliError(
      "InvalidTimeout",
      `--timeout "${raw}" is not a number of minutes.`,
      "Pass minutes greater than 0, e.g. --timeout 1.5 (decimals allowed).",
    );
  }
  return minutes;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function cmdWait(requestIdRaw: string, opts: { timeout?: string }): Promise<void> {
  const id = parseRequestId(requestIdRaw);
  const timeoutMinutes = parseTimeout(opts.timeout);
  const ctx = loadContext();
  const started = Date.now();
  const deadline = timeoutMinutes === undefined ? undefined : started + timeoutMinutes * 60_000;

  let view: RequestView = await loadRequestView(ctx, id);
  if (view.effective.status === "pending") {
    note(
      `Waiting for the owner to decide on request #${id} (${duration(view.request.expiresAt - view.now)} left` +
        `${timeoutMinutes !== undefined ? `; giving up after ${timeoutMinutes} min` : ""}; checking every ${POLL_MS / 1000} s)…`,
    );
  }

  let failures = 0;
  for (;;) {
    if (view.effective.status !== "pending") {
      emit({ ...view.json, waitedSeconds: Math.round((Date.now() - started) / 1000) }, view.human);
      return;
    }
    if (deadline !== undefined && Date.now() >= deadline) {
      emitError(
        "Timeout",
        `Request #${id} is still pending after ${timeoutMinutes} min. ${view.json.note as string}`,
        `Run \`aidr wait ${id}\` again to keep waiting, or \`aidr status ${id}\` later. Don't create a duplicate request.`,
        {
          requestId: id.toString(),
          requestStatus: view.effective.status,
          expiresAt: view.json.expiresAt,
          secondsLeft: view.json.secondsLeft,
        },
      );
      return;
    }

    await sleep(deadline === undefined ? POLL_MS : Math.max(0, Math.min(POLL_MS, deadline - Date.now())));

    try {
      view = await loadRequestView(ctx, id);
      failures = 0;
    } catch (err) {
      if (err instanceof CliError && err.code === "RpcError" && ++failures < MAX_POLL_FAILURES) {
        note(`Couldn't reach the RPC (attempt ${failures} of ${MAX_POLL_FAILURES}); retrying…`);
        continue;
      }
      throw err;
    }
  }
}
