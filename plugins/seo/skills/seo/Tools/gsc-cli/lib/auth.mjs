// auth.mjs — OAuth2 token management for Google Search Console + Indexing APIs
// Stores client + refresh token in ~/.config/gsc-cli/{oauth-client,credentials}.json (mode 600)

import { readFileSync, writeFileSync, existsSync, chmodSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { URL } from 'node:url';

const CONFIG_DIR = process.env.GSC_CLI_CONFIG_DIR || join(homedir(), '.config', 'gsc-cli');
const CLIENT_PATH = join(CONFIG_DIR, 'oauth-client.json');
const CREDS_PATH = join(CONFIG_DIR, 'credentials.json');

export const SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/indexing',
];

let cachedAccessToken = null;
let cachedExpiresAt = 0;

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
}

export function loadClient() {
  if (!existsSync(CLIENT_PATH)) {
    throw new Error(`OAuth client missing at ${CLIENT_PATH}. Place the Google Cloud Console JSON there.`);
  }
  const raw = JSON.parse(readFileSync(CLIENT_PATH, 'utf8'));
  const node = raw.installed || raw.web;
  if (!node) throw new Error(`Unsupported OAuth client format in ${CLIENT_PATH}`);
  return {
    client_id: node.client_id,
    client_secret: node.client_secret,
    auth_uri: node.auth_uri || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: node.token_uri || 'https://oauth2.googleapis.com/token',
  };
}

export function loadCreds() {
  if (!existsSync(CREDS_PATH)) return null;
  return JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
}

function saveCreds(creds) {
  ensureConfigDir();
  writeFileSync(CREDS_PATH, JSON.stringify(creds, null, 2));
  chmodSync(CREDS_PATH, 0o600);
}

function pkce() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

function openBrowser(url) {
  const opener = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'cmd'
    : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  spawn(opener, args, { detached: true, stdio: 'ignore' }).unref();
}

// Run interactive OAuth2 flow with PKCE; returns { refresh_token, access_token, expires_at, email }
export async function runConsentFlow() {
  const client = loadClient();
  const { verifier, challenge } = pkce();
  const state = randomBytes(16).toString('hex');

  // Find a free port for the localhost callback
  const port = await new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
    srv.on('error', reject);
  });
  const redirectUri = `http://127.0.0.1:${port}`;

  const authUrl = new URL(client.auth_uri);
  authUrl.searchParams.set('client_id', client.client_id);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  console.log(`\nOpening browser for Google consent…\n  ${authUrl.toString()}\n`);
  openBrowser(authUrl.toString());

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const reqUrl = new URL(req.url, redirectUri);
      const gotState = reqUrl.searchParams.get('state');
      const gotCode = reqUrl.searchParams.get('code');
      const gotErr = reqUrl.searchParams.get('error');
      if (gotErr) {
        res.end(`Error: ${gotErr}. You can close this tab.`);
        server.close();
        return reject(new Error(gotErr));
      }
      if (gotState !== state) {
        res.end('State mismatch. You can close this tab.');
        server.close();
        return reject(new Error('OAuth state mismatch'));
      }
      res.end('Authorized. You can close this tab and return to the terminal.');
      server.close();
      resolve(gotCode);
    });
    server.listen(port, '127.0.0.1');
    setTimeout(() => { server.close(); reject(new Error('OAuth timeout (5min)')); }, 5 * 60_000);
  });

  const tokenRes = await fetch(client.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: client.client_id,
      client_secret: client.client_secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
  if (!tokenData.refresh_token) {
    throw new Error('No refresh_token returned. Revoke prior consent at https://myaccount.google.com/permissions and retry.');
  }

  // Best-effort: fetch the authenticated email for display
  let email = null;
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (r.ok) email = (await r.json()).email;
  } catch { /* non-fatal */ }

  const creds = {
    refresh_token: tokenData.refresh_token,
    scope: tokenData.scope,
    email,
    obtained_at: new Date().toISOString(),
  };
  saveCreds(creds);
  return { ...creds, access_token: tokenData.access_token, expires_at: Date.now() + tokenData.expires_in * 1000 };
}

// Returns a fresh access token, minting via refresh token when needed. Cached in-process.
export async function getAccessToken() {
  if (cachedAccessToken && Date.now() < cachedExpiresAt - 60_000) return cachedAccessToken;
  const creds = loadCreds();
  if (!creds?.refresh_token) {
    throw new Error('Not authenticated. Run: gsc auth login');
  }
  const client = loadClient();
  const r = await fetch(client.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.client_id,
      client_secret: client.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Refresh failed: ${JSON.stringify(data)}`);
  cachedAccessToken = data.access_token;
  cachedExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedAccessToken;
}

export async function authStatus() {
  const creds = loadCreds();
  if (!creds) return { authenticated: false };
  try {
    const token = await getAccessToken();
    const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const info = r.ok ? await r.json() : null;
    return {
      authenticated: true,
      email: info?.email || creds.email,
      scope: creds.scope,
      obtained_at: creds.obtained_at,
    };
  } catch (e) {
    return { authenticated: false, error: e.message };
  }
}
