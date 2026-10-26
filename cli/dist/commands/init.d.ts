export interface InitOptions {
    wallet: string;
    key?: string;
    network?: string;
    mainnet?: boolean;
    contract?: string;
    rpc?: string;
    deployBlock?: string;
}
export declare function cmdInit(opts: InitOptions): Promise<void>;
//# sourceMappingURL=init.d.ts.map