#!/usr/bin/env bash
# commoncrawl-backlinks.sh
# Free domain-level backlink audit using Common Crawl's quarterly hyperlink graph + DuckDB.
# Complements competitor-backlinks.mjs (paid DataForSEO) with a zero-API-cost alternative.
#
# Methodology credit: Ben Word / @retlehs — https://gist.github.com/retlehs/cf0ac6c74476e766fba2f14076fff501
# Extended here to multi-domain competitive audits with gap analysis.
#
# Usage:
#   TARGETS=target.com COMPETITORS=a.com,b.com,c.com ./commoncrawl-backlinks.sh
#   CC_RELEASE=cc-main-2026-jan-feb-mar ./commoncrawl-backlinks.sh      # pin a release
#   CC_CACHE=/srv/cc ./commoncrawl-backlinks.sh                         # shared cache dir
#   CONFIG=./backlinks-config.json ./commoncrawl-backlinks.sh           # multi-segment batch
#
# Requirements: bash, curl, unzip, ~20 GB free disk for the CC cache, ~8 GB RAM for DuckDB.
# Output: data/seo/YYYY-MM-DD/commoncrawl-backlinks.txt + commoncrawl-backlinks.sql (replayable)

set -euo pipefail

# --- Config resolution -------------------------------------------------------

DATA_DIR="${SEO_DATA_DIR:-data/seo}"
TODAY="$(date -u +%F)"
OUT_DIR="${DATA_DIR}/${TODAY}"
mkdir -p "${OUT_DIR}"

# DuckDB binary location. Installs to $HOME/bin if missing.
DUCKDB_BIN="${DUCKDB_BIN:-${HOME}/bin/duckdb}"

# Cache location for the Common Crawl graph files. Safe to share across users/projects.
CC_CACHE="${CC_CACHE:-${HOME}/.cache/cc-backlinks}"

# CC release tag. If unset we pick the latest published release automatically.
CC_RELEASE="${CC_RELEASE:-}"

# Inputs: either (TARGETS + COMPETITORS) as comma-separated lists,
# or CONFIG pointing at a JSON file with named segments for multi-site batches.
TARGETS="${TARGETS:-}"
COMPETITORS="${COMPETITORS:-}"
CONFIG="${CONFIG:-}"

SQL_OUT="${OUT_DIR}/commoncrawl-backlinks.sql"
RESULT_OUT="${OUT_DIR}/commoncrawl-backlinks.txt"
LOG_OUT="${OUT_DIR}/commoncrawl-backlinks.log"

log() { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "${LOG_OUT}"; }

# --- Step 1: ensure DuckDB ---------------------------------------------------

if [[ ! -x "${DUCKDB_BIN}" ]]; then
  log "DuckDB not found at ${DUCKDB_BIN}; installing from GitHub releases"
  mkdir -p "$(dirname "${DUCKDB_BIN}")"
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64)   asset="duckdb_cli-linux-amd64.zip" ;;
    Linux-aarch64)  asset="duckdb_cli-linux-arm64.zip" ;;
    Darwin-arm64|Darwin-x86_64) asset="duckdb_cli-osx-universal.zip" ;;
    *) echo "Unsupported platform $(uname -s)-$(uname -m) — install DuckDB manually and set DUCKDB_BIN" >&2; exit 1 ;;
  esac
  tmp="$(mktemp -d)"
  curl -fsSL -o "${tmp}/duckdb.zip" "https://github.com/duckdb/duckdb/releases/latest/download/${asset}"
  unzip -qo "${tmp}/duckdb.zip" -d "$(dirname "${DUCKDB_BIN}")"
  chmod +x "${DUCKDB_BIN}"
  rm -rf "${tmp}"
  log "installed $("${DUCKDB_BIN}" --version)"
fi

# --- Step 2: resolve CC release ---------------------------------------------

if [[ -z "${CC_RELEASE}" ]]; then
  log "No CC_RELEASE set; probing Common Crawl for the most recent published release"
  year=$(date -u +%Y)
  declare -a candidates=(
    "cc-main-${year}-oct-nov-dec"
    "cc-main-${year}-jul-aug-sep"
    "cc-main-${year}-apr-may-jun"
    "cc-main-${year}-jan-feb-mar"
    "cc-main-$((year-1))-oct-nov-dec"
    "cc-main-$((year-1))-jul-aug-sep"
  )
  for rel in "${candidates[@]}"; do
    url="https://data.commoncrawl.org/projects/hyperlinkgraph/${rel}/domain/${rel}-domain-vertices.txt.gz"
    if curl -sfI "${url}" > /dev/null 2>&1; then
      CC_RELEASE="${rel}"
      log "resolved CC_RELEASE=${CC_RELEASE}"
      break
    fi
  done
  [[ -z "${CC_RELEASE}" ]] && { echo "Could not locate a published CC release. Set CC_RELEASE manually." >&2; exit 1; }
fi

CC_DIR="${CC_CACHE}/${CC_RELEASE}"
VERTICES="${CC_DIR}/${CC_RELEASE}-domain-vertices.txt.gz"
EDGES="${CC_DIR}/${CC_RELEASE}-domain-edges.txt.gz"
mkdir -p "${CC_DIR}"

# --- Step 3: cache CC graph files (resumable) --------------------------------

for pair in "vertices:${VERTICES}" "edges:${EDGES}"; do
  name="${pair%%:*}"
  path="${pair##*:}"
  url="https://data.commoncrawl.org/projects/hyperlinkgraph/${CC_RELEASE}/domain/${CC_RELEASE}-domain-${name}.txt.gz"
  if [[ -s "${path}" ]]; then
    log "cache hit: ${name} ($(du -h "${path}" | awk '{print $1}'))"
  else
    log "downloading ${name} from Common Crawl (resumable); this can take 10-30 min for edges"
    curl -L --fail -C - -o "${path}" "${url}"
    log "downloaded ${name} ($(du -h "${path}" | awk '{print $1}'))"
  fi
done

# --- Step 4: build the SQL ---------------------------------------------------

pairs_file="$(mktemp)"
trap 'rm -f "${pairs_file}" "${pairs_file}.bak"' EXIT

if [[ -n "${CONFIG}" ]]; then
  # JSON config: { "segments": { "name": { "target": "...", "competitors": [...] }, ... } }
  if ! command -v jq >/dev/null 2>&1; then
    echo "CONFIG mode requires jq — install jq or use TARGETS/COMPETITORS env vars" >&2; exit 1
  fi
  jq -r '
    .segments | to_entries[] as $s
    | ($s.value.target, ($s.value.competitors[]?))
    | "\($s.key),\(.)"
  ' "${CONFIG}" > "${pairs_file}"
else
  [[ -z "${TARGETS}" ]] && { echo "Set TARGETS (comma-separated) or CONFIG=path.json" >&2; exit 1; }
  segment="${SEGMENT:-audit}"
  {
    for d in ${TARGETS//,/ }; do echo "${segment},${d}"; done
    for d in ${COMPETITORS//,/ }; do echo "${segment},${d}"; done
  } > "${pairs_file}"
fi

[[ ! -s "${pairs_file}" ]] && { echo "No target/competitor domains provided." >&2; exit 1; }

# Emit VALUES rows with a proper final-row terminator (semicolon on the last line, commas elsewhere).
values_sql="$(awk -F, -v q="'" '
  function reverse(d,   a,n,i,r) { n=split(d,a,"."); r=""; for(i=n;i>=1;i--) r=r (r?".":"") a[i]; return r }
  { rows[NR] = sprintf("  (%s%s%s, %s%s%s, %s%s%s)", q,$1,q, q,$2,q, q,reverse($2),q) }
  END { for (i=1;i<=NR;i++) printf "%s%s\n", rows[i], (i==NR ? ";" : ",") }
' "${pairs_file}")"

{
  cat <<'HEADER'
.mode csv
.header on
.print '=== Common Crawl Backlink Audit ==='

-- Target + competitor domains (one row per domain, reversed for CC lookup).
CREATE TEMP TABLE targets(segment VARCHAR, domain VARCHAR, rev_domain VARCHAR);
INSERT INTO targets VALUES
HEADER
  printf '%s\n' "${values_sql}"

  cat <<SQL_BODY

-- Load CC vertices once (id <-> reversed-domain <-> host count).
CREATE TEMP TABLE vertices AS
SELECT * FROM read_csv(
  '${VERTICES}',
  delim='\t', header=false,
  columns={'id':'BIGINT','rev_domain':'VARCHAR','num_hosts':'BIGINT'}
);

-- Resolve each target to its CC id.
CREATE TEMP TABLE target_ids AS
SELECT t.segment, t.domain, t.rev_domain, v.id AS target_id, v.num_hosts AS target_num_hosts
FROM targets t
LEFT JOIN vertices v ON v.rev_domain = t.rev_domain;

.print ''
.print '=== TARGET RESOLUTION (NULL target_id == not in CC graph) ==='
SELECT segment, domain, target_id, target_num_hosts FROM target_ids ORDER BY segment, domain;

-- Scan edges once, keep only inbound edges landing on any target.
CREATE TEMP TABLE inbound AS
SELECT e.from_id, e.to_id, ti.segment, ti.domain AS target_domain
FROM read_csv(
  '${EDGES}',
  delim='\t', header=false,
  columns={'from_id':'BIGINT','to_id':'BIGINT'}
) e
JOIN target_ids ti ON e.to_id = ti.target_id;

.print ''
.print '=== BACKLINK SUMMARY PER TARGET ==='
SELECT
  segment,
  target_domain,
  COUNT(*) AS backlink_count,
  SUM(v.num_hosts) AS total_linking_hosts
FROM inbound i
JOIN vertices v ON v.id = i.from_id
GROUP BY segment, target_domain
ORDER BY segment, backlink_count DESC;

.print ''
.print '=== TOP 25 LINKING DOMAINS PER TARGET ==='
SELECT segment, target_domain, linking_domain, num_hosts, rn FROM (
  SELECT
    i.segment,
    i.target_domain,
    array_to_string(list_reverse(string_split(v.rev_domain, '.')), '.') AS linking_domain,
    v.num_hosts,
    ROW_NUMBER() OVER (PARTITION BY i.target_domain ORDER BY v.num_hosts DESC, v.rev_domain) AS rn
  FROM inbound i
  JOIN vertices v ON v.id = i.from_id
) WHERE rn <= 25
ORDER BY segment, target_domain, rn;

-- Gap analysis: per segment, find domains linking to any competitor but not the primary target.
-- "Primary target" = the first domain listed per segment.
CREATE TEMP TABLE primary_target AS
SELECT segment, MIN(domain) AS primary_domain
FROM (
  SELECT segment, domain, ROW_NUMBER() OVER (PARTITION BY segment ORDER BY rowid) AS rn
  FROM targets
) WHERE rn = 1
GROUP BY segment;

.print ''
.print '=== GAP ANALYSIS: LINKS TO COMPETITORS BUT NOT TO PRIMARY TARGET ==='
WITH competitor_links AS (
  SELECT DISTINCT i.segment, i.from_id
  FROM inbound i
  JOIN primary_target p USING (segment)
  WHERE i.target_domain <> p.primary_domain
),
our_links AS (
  SELECT DISTINCT i.segment, i.from_id
  FROM inbound i
  JOIN primary_target p USING (segment)
  WHERE i.target_domain = p.primary_domain
),
gap AS (
  SELECT cl.segment, cl.from_id
  FROM competitor_links cl
  LEFT JOIN our_links ol ON ol.segment = cl.segment AND ol.from_id = cl.from_id
  WHERE ol.from_id IS NULL
)
SELECT
  g.segment,
  array_to_string(list_reverse(string_split(v.rev_domain, '.')), '.') AS linking_domain,
  v.num_hosts,
  (SELECT string_agg(DISTINCT target_domain, ', ')
     FROM inbound i2 WHERE i2.from_id = g.from_id AND i2.segment = g.segment) AS links_to_competitors
FROM gap g
JOIN vertices v ON v.id = g.from_id
QUALIFY ROW_NUMBER() OVER (PARTITION BY g.segment ORDER BY v.num_hosts DESC, v.rev_domain) <= 50
ORDER BY g.segment, v.num_hosts DESC, linking_domain;
SQL_BODY
} > "${SQL_OUT}"

log "SQL generated → ${SQL_OUT}"

# --- Step 5: run the query ---------------------------------------------------

log "running DuckDB query (typical runtime 10-15 min, depends on disk speed)"
start=$(date +%s)
"${DUCKDB_BIN}" < "${SQL_OUT}" > "${RESULT_OUT}" 2>> "${LOG_OUT}"
elapsed=$(( $(date +%s) - start ))
log "query complete in ${elapsed}s → ${RESULT_OUT}"

# --- Step 6: summary ---------------------------------------------------------

{
  echo
  echo "=== SUMMARY ==="
  echo "Release:  ${CC_RELEASE}"
  echo "Cache:    ${CC_DIR}"
  echo "SQL:      ${SQL_OUT}"
  echo "Result:   ${RESULT_OUT} ($(wc -l < "${RESULT_OUT}") lines)"
  echo "Runtime:  ${elapsed}s"
  echo
  echo "Next steps:"
  echo "  1. Review 'BACKLINK SUMMARY PER TARGET' — confirm target resolved in CC graph."
  echo "  2. Review 'GAP ANALYSIS' for outreach targets (domains linking to competitors but not you)."
  echo "  3. Feed highest-authority gap rows into backlink-outreach.mjs as an outreach seed."
  echo "  4. Re-run next quarter with a new CC_RELEASE to track new/lost backlinks over time."
} | tee -a "${LOG_OUT}"
