export interface InitOptions {
    wallet: string;
    key?: string;
    network?: string;
    mainnet?: boolean;
    contract?: string;
    rpc?: string;
    deployBlock?: string;
}
type TargetOptions = Pick<InitOptions, "network" | "mainnet" | "contract" | "rpc" | "deployBlock">;
export declare function cmdInit(opts: InitOptions): Promise<void>;
export interface SetupOptions extends TargetOptions {
    wallet?: string;
    name?: string;
    app?: string;
}
/**
 * One-step setup on the agent's machine: makes the agent's own key (or keeps the saved one), saves
 * the config and prints a link the owner opens to add this agent. Nobody copies a key.
 */
export declare function cmdSetup(opts: SetupOptions): Promise<void>;
/** Deletes this machine's agent key and config. */
export declare function cmdReset(opts: {
    yes?: boolean;
}): void;
export {};
//# sourceMappingURL=init.d.ts.map