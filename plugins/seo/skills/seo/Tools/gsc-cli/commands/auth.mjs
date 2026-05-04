// gsc auth login / status / logout
import { runConsentFlow, authStatus } from '../lib/auth.mjs';
import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CREDS_PATH = process.env.GSC_CLI_CONFIG_DIR
  ? join(process.env.GSC_CLI_CONFIG_DIR, 'credentials.json')
  : join(homedir(), '.config', 'gsc-cli', 'credentials.json');

export async function authLogin() {
  console.log('Starting OAuth2 consent flow…');
  const result = await runConsentFlow();
  console.log(`\n✓ Authenticated as ${result.email || '(email lookup failed)'}`);
  console.log(`  Refresh token saved to ${CREDS_PATH}`);
  console.log(`  Scopes: ${result.scope}\n`);
}

export async function authStatusCmd() {
  const status = await authStatus();
  if (!status.authenticated) {
    console.log('✗ Not authenticated');
    if (status.error) console.log(`  Error: ${status.error}`);
    console.log('  Run: gsc auth login');
    process.exitCode = 1;
    return;
  }
  console.log(`✓ Authenticated as ${status.email}`);
  console.log(`  Obtained: ${status.obtained_at}`);
  console.log(`  Scopes: ${status.scope}`);
}

export async function authLogout() {
  if (!existsSync(CREDS_PATH)) {
    console.log('No credentials stored.');
    return;
  }
  unlinkSync(CREDS_PATH);
  console.log(`Removed ${CREDS_PATH}`);
}
