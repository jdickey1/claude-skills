# gmail-mcp

Plugin wrapper around [`@jdickey1/mcp-gmail`](https://www.npmjs.com/package/@jdickey1/mcp-gmail) — a small, auditable, read-only Gmail MCP server built on the official `googleapis` client.

Installing this plugin registers the Gmail MCP server with your Claude Code client. After the one-time OAuth setup, the four read-only tools become available to the assistant.

## Tools exposed

| Tool | What it does |
|------|--------------|
| `search_emails` | Search using Gmail q-syntax (e.g. `from:foo@example.com after:2024/01/01`). Returns headers + snippet, no body. |
| `read_email` | Fetch a single message by id with decoded plain-text + HTML bodies and attachment metadata. |
| `get_thread` | Fetch every message in a thread, ordered. |
| `list_labels` | List system + user labels. |

The OAuth scope is `gmail.readonly`. The server cannot send, draft, delete, or modify messages.

## One-time setup

You'll need a Google Cloud OAuth 2.0 Desktop client (free). Full walkthrough lives in the [server README](https://github.com/jdickey1/claude-skills/tree/main/mcp-servers/gmail#setup). The short version:

1. Create an OAuth Desktop client in Google Cloud Console → APIs & Services → Credentials.
2. Run the auth CLI once to authorize and store a refresh token:

   ```bash
   GOOGLE_OAUTH_CLIENT_ID=<id> GOOGLE_OAUTH_CLIENT_SECRET=<secret> \
     npx -p @jdickey1/mcp-gmail mcp-gmail-auth
   ```

3. Restart your Claude Code session. `tools/list` should now include the four `gmail` tools.

## Where credentials live

- **macOS:** Login keychain entries under `mcp-gmail.*`.
- **Linux/Windows:** `$XDG_CONFIG_HOME/mcp-gmail/credentials.json` (mode 0600).
- **Override (CI/Docker):** `MCP_GMAIL_CLIENT_ID`, `MCP_GMAIL_CLIENT_SECRET`, `MCP_GMAIL_REFRESH_TOKEN` env vars take precedence.

## Source

The MCP server source lives in [`mcp-servers/gmail/`](https://github.com/jdickey1/claude-skills/tree/main/mcp-servers/gmail) of this repo. The plugin manifest declares the MCP via `npx`, so the published npm package is always the runtime; the source tree is for reading and contributing.

## Caveats

- First boot of the plugin runs `npx -y @jdickey1/mcp-gmail`, which downloads the package on first use (~5–15s). Subsequent boots are cached.
- If the user already has a `gmail` entry in their MCP config, the plugin's entry will conflict — uninstall one or rename the other.
- Tested against Claude Code 2.x. The `mcpServers` field in `plugin.json` follows the current plugin schema.
