/** Registers a secret (the private key) that must never appear in any output, in any letter case. */
export declare function registerSecret(secret: string | undefined): void;
export declare function redact(text: string): string;
/** Prints the command's single JSON result (stdout) and an optional human line (stderr). */
export declare function emit(result: Record<string, unknown>, human?: string): void;
export declare function hasEmitted(): boolean;
/** Human-only line on stderr (progress, warnings). */
export declare function note(line: string): void;
/** Prints {"status":"error","error","message","hint",...extra} and sets exit code 1. */
export declare function emitError(code: string, message: string, hint: string, extra?: Record<string, unknown>): void;
//# sourceMappingURL=output.d.ts.map