/** Where the owner's Aider app runs. Override with --app or AIDR_APP_URL. */
export declare const DEFAULT_APP_URL = "https://aider-smoky.vercel.app";
export declare function resolveAppUrl(flag: string | undefined): string;
export interface ConnectLinkInput {
    appUrl: string;
    agent: string;
    name: string;
    chainId: number;
    contract: string;
}
/** The link the owner opens to add this agent: the app pre-fills the Add agent form from it. */
export declare function connectLink({ appUrl, agent, name, chainId, contract }: ConnectLinkInput): string;
//# sourceMappingURL=link.d.ts.map