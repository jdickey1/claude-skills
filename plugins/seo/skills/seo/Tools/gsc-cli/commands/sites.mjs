// gsc sites list/delete — manage GSC properties
import { listSites, deleteSite } from '../lib/api.mjs';

export async function sitesList({ json = false } = {}) {
  const sites = await listSites();
  if (json) {
    console.log(JSON.stringify(sites, null, 2));
    return;
  }
  if (sites.length === 0) {
    console.log('No verified sites found for this Google account.');
    return;
  }
  console.log(`\n${sites.length} verified properties:\n`);
  console.log('  PERMISSION         SITE');
  console.log('  ─────────────────  ────────────────────────────────────');
  for (const s of sites) {
    const perm = (s.permissionLevel || '').padEnd(17);
    console.log(`  ${perm}  ${s.siteUrl}`);
  }
  console.log('');
}

export async function sitesDelete({ site }) {
  if (!site) throw new Error('--site required');
  await deleteSite(site);
  console.log(`✓ Removed ${site} from this Google account's GSC view`);
}
