import { afterEach, describe, expect, test } from "bun:test";
import { connectLink, DEFAULT_APP_URL, resolveAppUrl } from "../src/link.js";

describe("connect link", () => {
  const prevEnv = process.env.AIDR_APP_URL;
  afterEach(() => {
    if (prevEnv === undefined) delete process.env.AIDR_APP_URL;
    else process.env.AIDR_APP_URL = prevEnv;
  });

  test("encodes the agent, name, chain and contract", () => {
    const link = connectLink({
      appUrl: "https://aider.example.com",
      agent: "0x4958d86bF603d0CEcaBa94f6212d6D3b01c2F192",
      name: "Claude Code & co",
      chainId: 5042002,
      contract: "0xeb0d286eb7ce6ae7b211511db66a6ed94bf416b2",
    });
    const u = new URL(link);
    expect(u.origin + u.pathname).toBe("https://aider.example.com/connect");
    expect(u.searchParams.get("agent")).toBe("0x4958d86bF603d0CEcaBa94f6212d6D3b01c2F192");
    expect(u.searchParams.get("name")).toBe("Claude Code & co");
    expect(u.searchParams.get("chain")).toBe("5042002");
    expect(u.searchParams.get("contract")).toBe("0xeb0d286eb7ce6ae7b211511db66a6ed94bf416b2");
  });

  test("app URL: flag beats env beats default, trailing slashes and query dropped", () => {
    delete process.env.AIDR_APP_URL;
    expect(resolveAppUrl(undefined)).toBe(DEFAULT_APP_URL);
    process.env.AIDR_APP_URL = "https://env.example.com/";
    expect(resolveAppUrl(undefined)).toBe("https://env.example.com");
    expect(resolveAppUrl("https://flag.example.com/base/?x=1")).toBe("https://flag.example.com/base");
  });

  test("app URL must be http(s)", () => {
    expect(() => resolveAppUrl("javascript:alert(1)")).toThrow();
    expect(() => resolveAppUrl("not a url")).toThrow();
  });
});
