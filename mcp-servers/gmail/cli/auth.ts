#!/usr/bin/env bun
// One-time OAuth Desktop flow for the gmail MCP server. Stores client
// credentials and refresh token in the configured credential store
// (macOS keychain by default, file-backed elsewhere).

import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";
import {
  defaultCredentialStore,
  KEY_CLIENT_ID,
  KEY_CLIENT_SECRET,
  KEY_REFRESH_TOKEN,
  type CredentialStore,
} from "../src/credential-store.ts";
import { GMAIL_READONLY_SCOPE } from "../src/auth.ts";

const PORT_CANDIDATES = [44331, 44332, 44333];
const CALLBACK_TIMEOUT_MS = 5 * 60_000;

async function bindLoopback(): Promise<{ server: http.Server; port: number }> {
  for (const port of PORT_CANDIDATES) {
    try {
      return await new Promise<{ server: http.Server; port: number }>((resolve, reject) => {
        const server = http.createServer();
        const onError = (err: Error) => {
          server.removeListener("listening", onListen);
          reject(err);
        };
        const onListen = () => {
          server.removeListener("error", onError);
          resolve({ server, port });
        };
        server.once("error", onError);
        server.once("listening", onListen);
        server.listen(port, "127.0.0.1");
      });
    } catch {
      continue;
    }
  }
  throw new Error(
    `Could not bind any of ${PORT_CANDIDATES.join(", ")}. ` +
      `Free up a port or update PORT_CANDIDATES.`,
  );
}

function readClientCredentials(store: CredentialStore): {
  client_id: string;
  client_secret: string;
} {
  const envId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const envSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

  if (envId && envSecret) {
    store.store(KEY_CLIENT_ID, envId);
    store.store(KEY_CLIENT_SECRET, envSecret);
    console.log("✓ Stored client_id + client_secret (from env).");
    return { client_id: envId, client_secret: envSecret };
  }

  const storedId = store.read(KEY_CLIENT_ID);
  const storedSecret = store.read(KEY_CLIENT_SECRET);
  if (storedId && storedSecret) {
    return { client_id: storedId, client_secret: storedSecret };
  }

  console.error(
    [
      "Missing OAuth client credentials.",
      "First-run usage:",
      "  GOOGLE_OAUTH_CLIENT_ID=<id> GOOGLE_OAUTH_CLIENT_SECRET=<secret> bun run auth",
      "Source: GCP console → APIs & Services → Credentials → OAuth 2.0 Client IDs (Desktop app).",
      "See README.md for the full setup walkthrough.",
    ].join("\n"),
  );
  process.exit(2);
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  Bun.spawnSync({ cmd, stderr: "pipe" });
}

async function awaitCallback(server: http.Server, redirectUri: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for OAuth callback after ${CALLBACK_TIMEOUT_MS / 1000}s`));
    }, CALLBACK_TIMEOUT_MS);

    server.on("request", (req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, redirectUri);
      if (url.pathname !== "/callback") {
        res.writeHead(404).end("not found");
        return;
      }
      const errorParam = url.searchParams.get("error");
      if (errorParam) {
        res
          .writeHead(400, { "content-type": "text/plain" })
          .end(`Authorization denied: ${errorParam}`);
        clearTimeout(timer);
        reject(new Error(`Authorization denied: ${errorParam}`));
        return;
      }
      const code = url.searchParams.get("code");
      if (!code) {
        res.writeHead(400).end("missing authorization code");
        return;
      }
      res
        .writeHead(200, { "content-type": "text/html; charset=utf-8" })
        .end(
          "<!doctype html><meta charset=utf-8><title>mcp-gmail auth</title>" +
            "<h2>Authorization complete.</h2><p>You can close this tab.</p>",
        );
      clearTimeout(timer);
      resolve(code);
    });
  });
}

async function main(): Promise<void> {
  const store = defaultCredentialStore();
  const { client_id, client_secret } = readClientCredentials(store);

  const { server, port } = await bindLoopback();
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  const oauth2 = new google.auth.OAuth2({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri,
  });

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_READONLY_SCOPE],
  });

  console.log(`Opening browser for Google consent (loopback :${port})...`);
  console.log(`If the browser does not open, paste this URL manually:\n${authUrl}\n`);
  openBrowser(authUrl);

  let code: string;
  try {
    code = await awaitCallback(server, redirectUri);
  } finally {
    server.close();
  }

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google returned no refresh_token. Ensure this is a Desktop OAuth client " +
        "and that prompt=consent forced fresh consent. Try revoking access at " +
        "https://myaccount.google.com/permissions and re-running.",
    );
  }

  store.store(KEY_REFRESH_TOKEN, tokens.refresh_token);
  console.log("✓ Refresh token stored.");
  console.log("Next: register this MCP server in your client's mcp config (see README.md).");
  process.exit(0);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`auth failed: ${message}`);
  process.exit(1);
});
