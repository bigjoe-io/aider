import { CliError } from "./errors.js";

/** Where the owner's Aider app runs. Override with --app or AIDR_APP_URL. */
export const DEFAULT_APP_URL = "https://aider-smoky.vercel.app";

export function resolveAppUrl(flag: string | undefined): string {
  const raw = (flag ?? process.env.AIDR_APP_URL ?? DEFAULT_APP_URL).trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CliError("InvalidAppUrl", `"${raw}" is not a URL.`, "Pass the Aider app's address, e.g. --app https://aider.example.com");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CliError("InvalidAppUrl", `The app URL must be http(s), got ${url.protocol}`, "Pass the Aider app's address, e.g. --app https://aider.example.com");
  }
  return url.origin + url.pathname.replace(/\/+$/, "");
}

export interface ConnectLinkInput {
  appUrl: string;
  agent: string;
  name: string;
  chainId: number;
  contract: string;
}

/** The link the owner opens to add this agent: the app pre-fills the Add agent form from it. */
export function connectLink({ appUrl, agent, name, chainId, contract }: ConnectLinkInput): string {
  const q = new URLSearchParams({ agent, name, chain: String(chainId), contract });
  return `${appUrl}/connect?${q.toString()}`;
}
