// Cross-platform credential storage for OAuth secrets.
//
// macOS: stores items in the user's login keychain via the `security` CLI.
// Other platforms: stores in `$XDG_CONFIG_HOME/mcp-gmail/credentials.json` (or
// `~/.config/mcp-gmail/credentials.json`), with file mode 0600.
//
// All inputs are passed as argv (never through a shell). Reads return null
// when an item is absent; throws only on unexpected errors.

import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";

export interface CredentialStore {
  store(key: string, value: string): void;
  read(key: string): string | null;
  delete(key: string): void;
}

const SERVICE_PREFIX = "mcp-gmail";

// macOS implementation backed by `security add/find/delete-generic-password`.
class KeychainStore implements CredentialStore {
  constructor(private readonly account: string) {}

  store(key: string, value: string): void {
    const r = Bun.spawnSync({
      cmd: [
        "security",
        "add-generic-password",
        "-s",
        `${SERVICE_PREFIX}.${key}`,
        "-a",
        this.account,
        "-w",
        value,
        "-U",
      ],
      stderr: "pipe",
    });
    if (r.exitCode !== 0) {
      const err = new TextDecoder().decode(r.stderr);
      throw new Error(`keychain store failed for ${key}: ${err.trim()}`);
    }
  }

  read(key: string): string | null {
    const r = Bun.spawnSync({
      cmd: [
        "security",
        "find-generic-password",
        "-s",
        `${SERVICE_PREFIX}.${key}`,
        "-a",
        this.account,
        "-w",
      ],
      stderr: "pipe",
    });
    if (r.exitCode !== 0) return null;
    return new TextDecoder().decode(r.stdout).replace(/\n+$/, "");
  }

  delete(key: string): void {
    Bun.spawnSync({
      cmd: [
        "security",
        "delete-generic-password",
        "-s",
        `${SERVICE_PREFIX}.${key}`,
        "-a",
        this.account,
      ],
      stderr: "pipe",
    });
  }
}

// File-backed JSON store for Linux/Windows. Single JSON object, mode 0600.
class FileStore implements CredentialStore {
  constructor(private readonly path: string) {}

  private load(): Record<string, string> {
    if (!existsSync(this.path)) return {};
    try {
      const raw = readFileSync(this.path, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private save(data: Record<string, string>): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(data, null, 2), { mode: 0o600 });
    try {
      chmodSync(this.path, 0o600);
    } catch {
      // Best-effort on systems that ignore mode (e.g. Windows).
    }
  }

  store(key: string, value: string): void {
    const data = this.load();
    data[key] = value;
    this.save(data);
  }

  read(key: string): string | null {
    const data = this.load();
    return data[key] ?? null;
  }

  delete(key: string): void {
    const data = this.load();
    if (key in data) {
      delete data[key];
      if (Object.keys(data).length === 0) {
        try {
          unlinkSync(this.path);
        } catch {
          /* ignore */
        }
      } else {
        this.save(data);
      }
    }
  }
}

// Env-var override: anything in `MCP_GMAIL_<KEY>` (uppercased, dashes→underscores)
// wins over the underlying store. Used by tests and Docker/CI deployments.
class EnvOverrideStore implements CredentialStore {
  constructor(private readonly inner: CredentialStore) {}

  private envKey(key: string): string {
    return `MCP_GMAIL_${key.toUpperCase().replace(/[-.]/g, "_")}`;
  }

  store(key: string, value: string): void {
    this.inner.store(key, value);
  }

  read(key: string): string | null {
    const env = process.env[this.envKey(key)];
    if (env && env.length > 0) return env;
    return this.inner.read(key);
  }

  delete(key: string): void {
    this.inner.delete(key);
  }
}

export function defaultCredentialStore(): CredentialStore {
  if (process.env.MCP_GMAIL_STORE_PATH) {
    return new EnvOverrideStore(new FileStore(process.env.MCP_GMAIL_STORE_PATH));
  }
  if (platform() === "darwin") {
    const account = process.env.MCP_GMAIL_ACCOUNT ?? process.env.USER ?? "default";
    return new EnvOverrideStore(new KeychainStore(account));
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return new EnvOverrideStore(new FileStore(join(xdg, "mcp-gmail", "credentials.json")));
}

export const KEY_CLIENT_ID = "client-id";
export const KEY_CLIENT_SECRET = "client-secret";
export const KEY_REFRESH_TOKEN = "refresh-token";
