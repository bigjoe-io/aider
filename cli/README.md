# aidr

The command-line tool that lets an AI agent pay USDC from an [Aider](https://github.com/bigjoe-io/aider) wallet on Arc, inside the limits the wallet's owner set.

> Experimental and unaudited. Use small amounts.

## Install

Requires Node 18 or newer.

```bash
npm install -g aidr-cli
```

## Connect an agent

```bash
aidr setup --name "Claude Code"
```

This makes the agent its own key (saved in `~/.aidr/key`, never printed) and prints a link. The wallet owner opens the link in the Aider app, chooses the limits and clicks **Add agent**. Then:

```bash
aidr balance
```

The link opens the Aider app at https://aider-smoky.vercel.app. If the owner runs their own copy (for example `http://localhost:5173` while developing), pass its address: `aidr setup --app http://localhost:5173` (or set `AIDR_APP_URL`).

## Pay

```bash
aidr pay 0xRecipient 0.05 "API credits"
aidr wait 42          # if the payment needed the owner's approval
aidr history
```

Every command prints one JSON object. `aidr --help` lists all commands.

## For AI agents

Give your agent [SKILL.md](./SKILL.md) (included in this package). It explains when to check the balance, how to read each result and what never to do.

## Remove

```bash
aidr reset --yes      # deletes this machine's agent key
npm uninstall -g aidr-cli
```

## License

MIT
