# mcp-gmail

A small, read-only Gmail MCP server. Searches and reads your messages over the official Gmail API. ~500 lines of TypeScript, four tools, no surprise dependencies.

Built because the popular Gmail MCPs on the registry are abandoned, ship third-party auth handlers, or expose a sprawling write surface that's hard to audit. This one stays narrow on purpose: read-only scope, four tools, official `googleapis` client, OS keychain for credentials.

[![npm version](https://img.shields.io/npm/v/@jdickey1/mcp-gmail.svg)](https://www.npmjs.com/package/@jdickey1/mcp-gmail)

## Tools

| Tool | What it does |
|---|---|
| `search_emails(query, max?)` | Search using Gmail q-syntax (e.g. `from:foo@example.com after:2024/01/01`). Returns up to `max` hits (default 20, cap 100) with id, headers, snippet, label ids, and attachment flag. |
| `read_email(id, format?)` | Fetch one message. Returns decoded plain-text and HTML bodies, headers, label ids, and attachment metadata. `format: "raw"` adds the original RFC 822 bytes. |
| `get_thread(id)` | Fetch all messages in a thread, in order. Same shape as `read_email`. |
| `list_labels()` | Returns system labels (INBOX, SENT, DRAFT, …) and user labels with id, name, and type. |

OAuth scope: `https://www.googleapis.com/auth/gmail.readonly`. The server cannot send, draft, delete, or modify mail — that's enforced by Google, not by us.

## Install

You need Node.js 20 or newer and a Google Cloud OAuth Desktop client (free; setup steps below).

### Option A — Claude Code marketplace (recommended)

Install the [`gmail-mcp` plugin](https://github.com/jdickey1/claude-skills/tree/main/plugins/gmail-mcp) from the `claude-skills` marketplace. The MCP wires itself up; only the one-time auth flow remains.

### Option B — Manual MCP config

Add the server to your MCP client (`~/.claude.json` for Claude Code, `claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@jdickey1/mcp-gmail"]
    }
  }
}
```

In `~/.claude/settings.json`, allow the tools you want to use:

```json
{
  "permissions": {
    "allow": [
      "mcp__gmail__search_emails",
      "mcp__gmail__read_email",
      "mcp__gmail__get_thread",
      "mcp__gmail__list_labels"
    ]
  }
}
```

## Setup

### 1. Enable the Gmail API and create a Desktop OAuth client

1. Open the [Google Cloud Console](https://console.cloud.google.com/). Create a project or select one.
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.
3. **APIs & Services → Credentials** → **Create Credentials → OAuth client ID**.
   - **Application type:** Desktop app
   - **Name:** anything (e.g. `mcp-gmail`)
4. Copy the **Client ID** and **Client secret**.

If your project is in **Testing** publishing status (the default), add your own Google account as a test user under **OAuth consent screen → Test users**.

### 2. Run the auth flow once

```bash
GOOGLE_OAUTH_CLIENT_ID=<your-client-id> \
GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret> \
  npx -p @jdickey1/mcp-gmail mcp-gmail-auth
```

A browser tab opens for Google consent. After approval the refresh token is stored in your keychain (or the credential file on Linux/Windows). Re-runs reuse the stored client credentials, so subsequent invocations don't need the env vars.

If your default browser doesn't open, copy the URL printed to the terminal.

### 3. Verify

Restart your MCP client, then ask: "Use the gmail MCP to list my labels." You should see your INBOX, SENT, and any user labels.

## Credential storage

| Platform | Location |
|---|---|
| macOS | Login keychain. Service `mcp-gmail.{client-id, client-secret, refresh-token}`, account = `$USER`. |
| Linux / Windows | `$XDG_CONFIG_HOME/mcp-gmail/credentials.json` (or `~/.config/mcp-gmail/credentials.json`), mode `0600`. |

### Overrides

| Variable | Effect |
|---|---|
| `MCP_GMAIL_ACCOUNT` | macOS keychain account label (default `$USER`). Useful for multi-account setups. |
| `MCP_GMAIL_STORE_PATH` | Force file-backed storage at the given path (any platform). Useful for tests, Docker, CI. |
| `MCP_GMAIL_CLIENT_ID` / `MCP_GMAIL_CLIENT_SECRET` / `MCP_GMAIL_REFRESH_TOKEN` | Read-time override. Wins over the underlying store. Useful when you want to bake credentials into a launchd plist or a container env without going through the auth CLI. |

## Inspecting and re-running auth

```bash
# Drop the cached refresh token and re-authorize:
security delete-generic-password -s mcp-gmail.refresh-token -a "$USER"  # macOS
rm ~/.config/mcp-gmail/credentials.json                                  # Linux/Windows

npx -p @jdickey1/mcp-gmail mcp-gmail-auth
```

To rotate the OAuth client itself, set both `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` again on the auth re-run.

## Design notes

- **Read-only by scope.** The OAuth scope is `gmail.readonly`. Even if a future bug somehow tried to send or mutate mail, Google rejects it. This is the strongest possible defense — no wrapper allowlist needed for safety, only for ergonomics.
- **No raw API responses leak past `tools.ts`.** Every tool projects to a stable shape so a Gmail API change doesn't silently reshape your MCP responses.
- **Sequential metadata fetches.** `search_emails` does N+1 calls (one list, then one `get` per id) to surface headers in the search result. For the common case (under 50 hits) it's fast and quota-cheap. We chose explicit sequential reads over the unsupported batch endpoint to keep the code small and easy to audit.
- **HTML entity decoding on snippets.** Gmail returns snippets with `&#39;` etc. — we decode the common entities so callers don't have to.
- **Cross-platform credential store.** macOS keychain is preferred; everything else falls back to a `chmod 600` JSON file. Env-var overrides win for headless contexts.

## Why a new MCP?

The popular community Gmail MCPs were unsuitable for production use:

- One vendored its own OAuth handler instead of using the official `googleapis` client (large attack surface, harder to audit).
- One was abandoned (no commits in over a year).
- One exposed every Gmail write tool as default — sending, deleting, labeling, filter manipulation — with no scope discipline.

This one is intentionally minimal so other people can read every line in one sitting.

## Contributing

Source lives at [`mcp-servers/gmail/`](https://github.com/jdickey1/claude-skills/tree/main/mcp-servers/gmail) in the [`claude-skills`](https://github.com/jdickey1/claude-skills) repo. Issues and PRs welcome.

```bash
git clone https://github.com/jdickey1/claude-skills.git
cd claude-skills/mcp-servers/gmail
npm install               # or: bun install
npx tsx --test src/**/*.test.ts   # 19 unit tests, mocks the Gmail client
npx tsc --noEmit          # typecheck
npm run build             # produces dist/ for publish
```

Source layout:

```
src/
  index.ts            # MCP server, tool registration
  auth.ts             # OAuth client construction
  credential-store.ts # keychain (macOS) + file (everywhere else) + env override
  tools.ts            # search_emails, read_email, get_thread, list_labels
  mime.ts             # base64url decode + multipart body walking
  tools.test.ts       # unit tests
cli/
  auth.ts             # one-time OAuth Desktop flow
```

For Linux/Windows users: if the file-backed credential store has a rough edge on your platform, file an issue with the platform details.

## License

MIT. See [LICENSE](./LICENSE).
