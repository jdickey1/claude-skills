# google-contacts-mcp

Plugin wrapper around [`@jdickey1/mcp-google-contacts`](https://www.npmjs.com/package/@jdickey1/mcp-google-contacts) — a small Google Contacts MCP server built on the official `googleapis` client.

Installing this plugin registers the Google Contacts MCP server with your Claude Code client. After the one-time OAuth setup, the six tools become available to the assistant.

## Tools exposed

| Tool | What it does |
|------|--------------|
| `search_contacts` | **Read.** Search by name across primary + "Other contacts". Returns names, emails, phones, and applied user-label names. |
| `get_contact` | **Read.** Fetch one contact by resource name. Returns full record including addresses, organizations, biographies, and labels. |
| `list_label_groups` | **Read.** List user-defined contact label groups (Clients, Vendors, etc.) with member counts. |
| `apply_label` | **Write.** Apply a label to a contact. Idempotent; auto-creates the label group on first use. |
| `remove_label` | **Write.** Remove a label from a contact. No-op if not labeled. |
| `update_contact` | **Write (additive-only).** Fills in missing fields (phone, address, organization, title, biography). Never overwrites existing values. |

## OAuth scopes

This plugin requests **three** scopes:

- `https://www.googleapis.com/auth/contacts.readonly` — primary contact read.
- `https://www.googleapis.com/auth/contacts.other.readonly` — read "Other contacts" (the implicit auto-saved set).
- `https://www.googleapis.com/auth/contacts` — **full contacts write**.

The write scope grants the API permission to mutate any contact field. The tools choose to restrain themselves to label CRUD plus additive-only field updates, but the **scope grant itself is not narrowed**. Review the [server README](https://www.npmjs.com/package/@jdickey1/mcp-google-contacts) before installing if you want a read-only configuration; you can fork the auth CLI and drop the third scope.

## One-time setup

You'll need a Google Cloud OAuth 2.0 Desktop client (free). Full walkthrough lives in the [server README on npm](https://www.npmjs.com/package/@jdickey1/mcp-google-contacts#setup). The short version:

1. Enable the **People API** in your Google Cloud project.
2. Create an OAuth Desktop client in Google Cloud Console → APIs & Services → Credentials.
3. Run the auth CLI once to authorize and store a refresh token:

   ```bash
   GOOGLE_OAUTH_CLIENT_ID=<id> GOOGLE_OAUTH_CLIENT_SECRET=<secret> \
     npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth
   ```

4. Restart your Claude Code session. `tools/list` should now include the six `google-contacts` tools.

## Where credentials live

- **macOS only (v1):** Login keychain entries under `cos-cron.google-contacts.*` (the `cos-cron` prefix is internal substrate naming preserved across the package's history; it has no functional meaning to new adopters).
- **Account override:** `MCP_GOOGLE_CONTACTS_ACCOUNT` env var sets the keychain account label (default `$USER`).
- **No file-backed fallback yet.** Linux and Windows are not supported in this version. A future minor version may add a `0600` JSON file under `$XDG_CONFIG_HOME` for cross-platform parity with `@jdickey1/mcp-gmail`.

## Source

The MCP server source lives in the **private** [`claude-skills-private`](https://github.com/jdickey1/claude-skills-private) repo at `mcp-servers/google-contacts/`. The plugin manifest declares the MCP via `npx`, so the published npm package is always the runtime; the source tree is closed for now but the published JS is fully open. Adopters can run `npm pack @jdickey1/mcp-google-contacts && tar -tf <file>` to inspect the shipped artifact.

## Caveats

- First boot of the plugin runs `npx -y @jdickey1/mcp-google-contacts`, which downloads the package on first use (~5–15s). Subsequent boots are cached.
- If the user already has a `google-contacts` entry in their MCP config, the plugin's entry will conflict — uninstall one or rename the other.
- Tested against Claude Code 2.x. The `mcpServers` field in `plugin.json` follows the current plugin schema.
- v1 is macOS-only for credential storage; see the server README for details and the future-roadmap notes.
