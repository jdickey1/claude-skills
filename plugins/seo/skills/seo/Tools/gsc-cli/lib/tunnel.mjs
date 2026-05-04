// tunnel.mjs — SSH tunnel helper for connecting to seo_db on the VPS.
//
// Forwards a *unix socket* (not TCP) so peer auth on the postgres side still
// applies — the connection arrives at the postgres socket as user `seo` (the
// SSH login user), matching the existing `local seo_db seo peer` pg_hba rule.
// This avoids opening any TCP port on the VPS for postgres.
//
// Spawns: ssh -L <localSock>:/var/run/postgresql/.s.PGSQL.5432 seo -N
// Returns: { sockDir, port, close }
//   - pg connects with `postgresql://seo@/seo_db?host=<sockDir>&port=5432`
//   - sockDir contains a file named `.s.PGSQL.5432` (pg's required name)
//
// Relies on the `seo` SSH alias (~/.ssh/config) and ControlMaster reuse.

import { spawn } from 'node:child_process';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const REMOTE_SOCKET = process.env.GSC_DB_REMOTE_SOCKET || '/var/run/postgresql/.s.PGSQL.5432';
const REMOTE_PORT = parseInt(process.env.GSC_DB_REMOTE_PORT || '5432', 10);
const SSH_ALIAS = process.env.GSC_DB_SSH_ALIAS || 'seo';

async function waitForSocket(sockPath, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const s = await stat(sockPath);
      if (s.isSocket()) return;
    } catch {}
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error(`tunnel: local socket ${sockPath} did not appear within ${timeoutMs}ms`);
}

export async function openTunnel() {
  const sockDir = await mkdtemp(path.join(tmpdir(), 'gsc-pgsock-'));
  // pg's required socket file naming: <dir>/.s.PGSQL.<port>
  const localSock = path.join(sockDir, `.s.PGSQL.${REMOTE_PORT}`);

  // Disable ControlMaster/ControlPath for this tunnel — sharing the master
  // makes SIGTERM teardown unreliable (the master refuses to exit while other
  // forwards are open). A fresh connection per tunnel is cheap with key auth.
  const args = [
    '-N',
    '-o', 'ControlMaster=no',
    '-o', 'ControlPath=none',
    '-o', 'ExitOnForwardFailure=yes',
    '-L', `${localSock}:${REMOTE_SOCKET}`,
    SSH_ALIAS,
  ];
  const child = spawn('ssh', args, { stdio: ['ignore', 'ignore', 'pipe'] });

  let stderr = '';
  child.stderr.on('data', d => { stderr += d.toString(); });
  const exited = new Promise((_, reject) => {
    child.on('exit', code => reject(new Error(`ssh tunnel exited (code ${code}): ${stderr.trim()}`)));
    child.on('error', reject);
  });

  try {
    await Promise.race([waitForSocket(localSock), exited]);
  } catch (e) {
    try { child.kill('SIGTERM'); } catch {}
    await rm(sockDir, { recursive: true, force: true }).catch(() => {});
    throw e;
  }

  const exitPromise = new Promise(r => child.once('exit', r));

  return {
    sockDir,
    port: REMOTE_PORT,
    async close() {
      if (child.exitCode === null) {
        child.kill('SIGTERM');
        // Give SSH 1s to exit cleanly; SIGKILL if it doesn't.
        const killed = await Promise.race([
          exitPromise.then(() => true),
          new Promise(r => setTimeout(() => r(false), 1000)),
        ]);
        if (!killed) {
          child.kill('SIGKILL');
          await exitPromise;
        }
      }
      await rm(sockDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}
