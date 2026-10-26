// Every command prints exactly one JSON object on stdout and a short human line on stderr.
// Nothing printed may ever contain the agent's private key: every write is redacted.

const secretPatterns: RegExp[] = [];
let emitted = false;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Registers a secret (the private key) that must never appear in any output, in any letter case. */
export function registerSecret(secret: string | undefined): void {
  const s = secret?.trim();
  if (!s || s.length < 16) return;
  secretPatterns.push(new RegExp(escapeRegExp(s), "gi"));
  const bare = s.replace(/^0x/i, "");
  if (bare !== s && bare.length >= 16) secretPatterns.push(new RegExp(escapeRegExp(bare), "gi"));
}

export function redact(text: string): string {
  return secretPatterns.reduce((out, p) => out.replace(p, "[redacted]"), text);
}

function toJson(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) => (typeof v === "bigint" ? v.toString() : v), 2);
}

/** Prints the command's single JSON result (stdout) and an optional human line (stderr). */
export function emit(result: Record<string, unknown>, human?: string): void {
  if (emitted) {
    // A second result would break "one JSON object per command"; keep it on stderr instead.
    process.stderr.write(redact(`${toJson(result)}\n`));
    return;
  }
  emitted = true;
  process.stdout.write(redact(`${toJson(result)}\n`));
  if (human) process.stderr.write(redact(`${human}\n`));
}

export function hasEmitted(): boolean {
  return emitted;
}

/** Human-only line on stderr (progress, warnings). */
export function note(line: string): void {
  process.stderr.write(redact(`${line}\n`));
}

/** Prints {"status":"error","error","message","hint",...extra} and sets exit code 1. */
export function emitError(
  code: string,
  message: string,
  hint: string,
  extra: Record<string, unknown> = {},
): void {
  emit(
    { status: "error", error: code, message, hint, ...extra },
    `Error (${code}): ${message}${hint ? `\nHint: ${hint}` : ""}`,
  );
  process.exitCode = 1;
}
