// db.mjs — pg client for seo_db. Connects via SSH tunnel to seo@VPS by default.
//
// Connection precedence:
//   1. process.env.DATABASE_URL — used as-is (skip tunnel)
//   2. otherwise: open SSH tunnel to seo alias, connect to seo_db via 127.0.0.1
//
// Usage:
//   import { withDb } from './lib/db.mjs';
//   await withDb(async (db) => {
//     const { rows } = await db.query('select 1');
//   });
//
// withDb opens the tunnel + pool, runs the callback, closes both.

import pg from 'pg';
import { openTunnel } from './tunnel.mjs';

const { Pool } = pg;

const DB_NAME = process.env.GSC_DB_NAME || 'seo_db';
const DB_USER = process.env.GSC_DB_USER || 'seo';

export async function withDb(fn) {
  let tunnel = null;
  let pool = null;
  try {
    if (process.env.DATABASE_URL) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
    } else {
      tunnel = await openTunnel();
      // Connect via the forwarded unix socket. pg's `host` accepts a directory
      // and looks for `<dir>/.s.PGSQL.<port>`. No TCP, so peer auth applies.
      pool = new Pool({
        host: tunnel.sockDir,
        port: tunnel.port,
        user: DB_USER,
        database: DB_NAME,
        max: 4,
      });
    }
    const db = {
      query: (text, params) => pool.query(text, params),
      withClient: async (cb) => {
        const client = await pool.connect();
        try { return await cb(client); } finally { client.release(); }
      },
    };
    return await fn(db);
  } finally {
    if (pool) await pool.end().catch(() => {});
    if (tunnel) await tunnel.close().catch(() => {});
  }
}

// Deterministic, SQL-safe partition name from a site_url.
// 'sc-domain:jdkey.com' -> 'gsc_perf__sc_domain_jdkey_com'
// 'https://example.com/' -> 'gsc_perf__https_example_com'
export function partitionName(siteUrl) {
  const cleaned = siteUrl
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `gsc_perf__${cleaned}`;
}

// Postgres rejects parameter binding in DDL FOR VALUES clauses, so we
// quote the literal ourselves (doubled single quotes per SQL spec).
function quoteLiteral(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

// Ensure a list-partition exists for this site_url. Idempotent.
// partitionName() output is restricted to [a-z0-9_] so safe to inline as
// an identifier; siteUrl is escaped via quoteLiteral.
export async function ensurePartition(db, siteUrl) {
  const name = partitionName(siteUrl);
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`unsafe partition name: ${name}`);
  const { rowCount } = await db.query(
    'select 1 from pg_class where relname = $1',
    [name]
  );
  if (rowCount === 0) {
    await db.query(
      `create table ${name} partition of gsc_perf for values in (${quoteLiteral(siteUrl)})`
    );
  }
  return name;
}

// Upsert a site row. Returns the site_url.
export async function upsertSite(db, { siteUrl, displayName, primaryDomain, digestEmail = null, active = true }) {
  await db.query(
    `insert into sites (site_url, display_name, primary_domain, digest_email, active)
       values ($1, $2, $3, $4, $5)
       on conflict (site_url) do update set
         display_name   = excluded.display_name,
         primary_domain = excluded.primary_domain,
         digest_email   = excluded.digest_email,
         active         = excluded.active`,
    [siteUrl, displayName, primaryDomain, digestEmail, active]
  );
  return siteUrl;
}
