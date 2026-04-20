# Texas GIS Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone GIS data service that ingests Texas geodata (ERCOT queue, boundaries, substations), generates vector map tiles, serves them via API, and integrates an interactive ERCOT queue map into Hyperscale News — live before the ERCOT event ~March 29, 2026.

**Architecture:** Python pipeline (GeoPandas, DuckDB Spatial, rapidfuzz, gridstatus) processes raw data into DuckDB databases and generates PMTiles via Tippecanoe. Bun/Hono server at `tiles.hyperscalenews.com` serves PMTiles via HTTP range requests. Hyperscale News (Next.js) embeds a MapLibre GL JS component at `/map`. Editorial map CLI generates PNG exports for newsletters/social.

**Tech Stack:** Python 3.12+, GeoPandas, DuckDB (spatial), rapidfuzz, gridstatus, Tippecanoe, Bun, Hono, pmtiles (JS), MapLibre GL JS, Playwright (export rendering)

**Spec:** `docs/superpowers/specs/2026-03-22-texas-gis-platform-design.md`

**Key constraint:** ERCOT event ~March 29. Hyperscale `/map` page must be live and usable on mobile at the conference.

---

## File Structure

### texas-gis project (`/home/texasgis/app/`)

```
pipeline/
├── __init__.py
├── config.py                  # Paths, DB locations, data source URLs, validation thresholds
├── ingest/
│   ├── __init__.py
│   ├── ercot_queue.py         # ERCOT GIS queue via gridstatus library
│   ├── substations.py         # HIFLD substation data (download + filter TX)
│   ├── boundaries.py          # Census TIGER counties, cities, districts; TWDB GCDs
│   └── puct.py                # PUCT Interchange large load filings
├── spatial/
│   ├── __init__.py
│   ├── fuzzy_match.py         # ERCOT POI → HIFLD substation matching (rapidfuzz)
│   └── validate.py            # Spatial validation (point-in-polygon county check)
├── tiles/
│   ├── __init__.py
│   └── generate.py            # DuckDB → GeoJSON → Tippecanoe → PMTiles
├── export/
│   ├── __init__.py
│   ├── render.py              # CLI: parameterized Playwright + MapLibre PNG/SVG export
│   └── templates/
│       └── map.html           # MapLibre template loaded by Playwright for rendering
├── run.py                     # Main pipeline orchestrator (ingest → match → tile → export)
└── requirements.txt           # Python dependencies

server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts               # Hono server entry point
│   ├── routes/
│   │   ├── tiles.ts           # PMTiles static file serving with range request support
│   │   ├── static.ts          # Pre-rendered PNG serving
│   │   ├── dev.ts             # Dev mode: live DuckDB query → GeoJSON (Mini IP only)
│   │   └── health.ts          # Health check: PMTiles existence + freshness
│   └── middleware/
│       └── restrict.ts        # IP allowlist middleware (returns 404, not 403)
└── bun.lock

data/                          # gitignored
├── raw/                       # Downloaded source files
├── duckdb/                    # Processed DuckDB databases
├── geojson/                   # Intermediate GeoJSON exports
└── tiles/                     # Generated PMTiles archives

deploy.sh
ecosystem.config.js
```

### Hyperscale project additions (`/home/hyperscale/app/`)

```
src/
├── app/map/
│   └── page.tsx               # /map route — full-screen MapLibre map
├── components/
│   ├── Map.tsx                # MapLibre GL JS wrapper (client component, dynamic import)
│   ├── MapPopup.tsx           # ERCOT queue project detail popup
│   └── MapFilters.tsx         # Technology type, MW range, status filter controls
└── lib/
    └── tiles.ts               # Tile server URL config + pmtiles protocol setup
```

---

## Task 1: VPS Infrastructure Setup

**Delegate to `/new-project` skill** for standard infrastructure. This task documents the inputs and deviations from the standard Next.js template.

**Files:**
- Create: VPS user, directories, SSH, PM2 systemd, nginx, SSL
- Modify: `/home/nonrootadmin/VPS_GUIDE.md` (port allocation)
- Modify: `/etc/nginx/sites-available/hyperscale` or new `texasgis` config
- Modify: `/etc/ssh/sshd_config.d/20-allowusers.conf`

**New-project inputs:**

| Input | Value |
|-------|-------|
| Project name | `texasgis` |
| Domain | `tiles.hyperscalenews.com` |
| Parent domain | `hyperscalenews.com` |
| App structure | `~/app` |
| GitHub repo | `jdickey1/texas-gis` |
| Port block | Next available from VPS_GUIDE.md |
| Email | None (API-only service) |

**Deviations from standard new-project:**

- [ ] **Step 1: Skip PostgreSQL (Phase A6)** — no Postgres database needed. All data lives in DuckDB files managed by the Python pipeline.

- [ ] **Step 2: Install Python dependencies** — after user creation (Phase A), install Python packages:
```bash
sudo -u texasgis bash -c 'python3 -m venv ~/app/pipeline/.venv'
sudo -u texasgis bash -c 'source ~/app/pipeline/.venv/bin/activate && pip install geopandas shapely duckdb rapidfuzz gridstatus requests pyarrow'
```

- [ ] **Step 3: Install Tippecanoe** — compile from source (not in apt repos):
```bash
sudo apt-get install -y build-essential libsqlite3-dev zlib1g-dev
cd /tmp && git clone https://github.com/felt/tippecanoe.git && cd tippecanoe && make -j$(nproc) && sudo make install
tippecanoe --version  # verify
```

- [ ] **Step 4: Install Bun for tile server** — copy from existing user per VPS standards:
```bash
sudo cp -r /home/books/.bun /home/texasgis/.bun
sudo chown -R texasgis:texasgis /home/texasgis/.bun
sudo -u texasgis bash -c 'echo "export BUN_INSTALL=\"\$HOME/.bun\"" >> ~/.bashrc && echo "export PATH=\"\$BUN_INSTALL/bin:\$PATH\"" >> ~/.bashrc'
```

- [ ] **Step 5: Create data directories** (gitignored):
```bash
sudo -u texasgis mkdir -p ~/app/data/{raw,duckdb,geojson,tiles}
```

- [ ] **Step 6: Nginx config customization** — the nginx config for `tiles.hyperscalenews.com` needs special handling for PMTiles range requests:
```nginx
# Add to the location / block:
proxy_request_buffering off;
proxy_http_version 1.1;

# Add CORS headers:
add_header Access-Control-Allow-Origin $cors_origin always;
add_header Access-Control-Allow-Headers "Range" always;
add_header Access-Control-Expose-Headers "Content-Range, Content-Length" always;
add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;

# Handle OPTIONS preflight
if ($request_method = 'OPTIONS') {
    return 204;
}
```
With an upstream `map` block for the CORS allowlist:
```nginx
map $http_origin $cors_origin {
    default "";
    "https://hyperscalenews.com" $http_origin;
    "https://www.hyperscalenews.com" $http_origin;
    "https://jdkey.com" $http_origin;
    "https://www.jdkey.com" $http_origin;
    "https://txelectionresults.com" $http_origin;
    "https://www.txelectionresults.com" $http_origin;
}
```

- [ ] **Step 7: SSL — expand existing hyperscalenews.com cert** to include `tiles.hyperscalenews.com`:
```bash
# Check current cert domains
sudo certbot certificates | grep -A5 hyperscale

# Expand to include tiles subdomain
sudo certbot certonly --nginx --expand -d hyperscalenews.com -d www.hyperscalenews.com -d dev.hyperscalenews.com -d tiles.hyperscalenews.com
```

- [ ] **Step 8: DNS — add tiles subdomain** via hostinger-dns MCP:
```
dns_add_records("hyperscalenews.com", overwrite=false, records=[
  {name: "tiles", type: "A", ttl: 3600, records: [{content: "74.82.63.199"}]}
])
```
Verify: `dig +short tiles.hyperscalenews.com` → `74.82.63.199`

- [ ] **Step 9: Run `/new-project` for remaining standard phases** — PM2 systemd, monitoring integration, VPS_GUIDE.md update, project-status doc, Obsidian folder.

- [ ] **Step 10: Commit infrastructure files**
```bash
git add deploy.sh ecosystem.config.js .gitignore CLAUDE.md
git commit -m "feat: project infrastructure scaffold"
```

---

## Task 2: ERCOT Queue Ingestion Pipeline

**Files:**
- Create: `pipeline/config.py`
- Create: `pipeline/__init__.py`
- Create: `pipeline/ingest/__init__.py`
- Create: `pipeline/ingest/ercot_queue.py`
- Create: `pipeline/requirements.txt`
- Test: `pipeline/tests/test_ercot_ingest.py`

- [ ] **Step 1: Create pipeline config**

```python
# pipeline/config.py
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
DUCKDB_DIR = DATA_DIR / "duckdb"
GEOJSON_DIR = DATA_DIR / "geojson"
TILES_DIR = DATA_DIR / "tiles"

# DuckDB database paths
ERCOT_DB = DUCKDB_DIR / "ercot.duckdb"
BOUNDARIES_DB = DUCKDB_DIR / "boundaries.duckdb"
PUCT_DB = DUCKDB_DIR / "puct.duckdb"
ELECTIONS_DB = DUCKDB_DIR / "elections.duckdb"

# Validation thresholds
ERCOT_QUEUE_MIN_ROWS = 1000
ERCOT_QUEUE_MAX_ROWS = 3000
PMTILES_MIN_SIZE_BYTES = 1024  # 1KB minimum
```

- [ ] **Step 2: Write failing test for ERCOT queue ingestion**

```python
# pipeline/tests/test_ercot_ingest.py
import pytest
from pathlib import Path
from pipeline.ingest.ercot_queue import ingest_ercot_queue
from pipeline.config import ERCOT_DB

def test_ingest_ercot_queue_creates_db(tmp_path):
    """Ingesting ERCOT queue should create a DuckDB with the queue table."""
    db_path = tmp_path / "ercot.duckdb"
    result = ingest_ercot_queue(db_path=db_path)
    assert db_path.exists(), "DuckDB file should be created"
    assert result["row_count"] > 1000, f"Expected 1000+ rows, got {result['row_count']}"
    assert "technology" in result["columns"], "Should have technology column"
    assert "poi_location" in result["columns"], "Should have poi_location column"
    assert "capacity_mw" in result["columns"], "Should have capacity_mw column"
    assert "county" in result["columns"], "Should have county column"
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd ~/app && source pipeline/.venv/bin/activate
python -m pytest pipeline/tests/test_ercot_ingest.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'pipeline.ingest.ercot_queue'`

- [ ] **Step 4: Implement ERCOT queue ingestion**

```python
# pipeline/ingest/ercot_queue.py
"""Ingest ERCOT Generation Interconnection Status queue into DuckDB."""
import duckdb
import gridstatus
from pathlib import Path


def ingest_ercot_queue(db_path: Path) -> dict:
    """Download ERCOT GIS queue via gridstatus and store in DuckDB.

    Returns dict with row_count and columns for validation.
    """
    ercot = gridstatus.Ercot()
    df = ercot.get_interconnection_queue()

    # Standardize column names to snake_case
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]

    # Ensure key columns exist (gridstatus normalizes these)
    required = ["project_name", "capacity_mw", "county", "status"]
    for col in required:
        if col not in df.columns:
            # Try common alternatives
            alt_map = {
                "capacity_mw": ["nameplate_capacity_mw", "mw", "capacity"],
                "project_name": ["name", "project"],
                "county": ["county_name"],
                "status": ["queue_status"],
            }
            for alt in alt_map.get(col, []):
                if alt in df.columns:
                    df = df.rename(columns={alt: col})
                    break

    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(db_path))
    con.install_extension("spatial")
    con.load_extension("spatial")

    # Drop and recreate table
    con.execute("DROP TABLE IF EXISTS ercot_queue")
    con.execute("CREATE TABLE ercot_queue AS SELECT * FROM df")

    row_count = con.execute("SELECT COUNT(*) FROM ercot_queue").fetchone()[0]
    columns = [desc[0] for desc in con.execute("SELECT * FROM ercot_queue LIMIT 0").description]
    con.close()

    return {"row_count": row_count, "columns": columns}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
python -m pytest pipeline/tests/test_ercot_ingest.py -v
```
Expected: PASS. Note: this test hits the ERCOT API — may take 30-60 seconds. Check the actual column names returned by gridstatus and adjust the test assertions and column mapping if needed.

- [ ] **Step 6: Inspect actual schema**

After the test passes, inspect what gridstatus actually returns to verify our assumptions:
```bash
python -c "
import duckdb
con = duckdb.connect('/tmp/ercot_test.duckdb', read_only=True) if False else None
# Or just:
import gridstatus
ercot = gridstatus.Ercot()
df = ercot.get_interconnection_queue()
print('Columns:', list(df.columns))
print('Shape:', df.shape)
print('Sample POI values:', df['Point of Interconnection'].head(5).tolist() if 'Point of Interconnection' in df.columns else 'POI column name differs')
print('Technology values:', df['Technology'].unique().tolist() if 'Technology' in df.columns else 'Tech column name differs')
"
```
Document actual column names. Update `ercot_queue.py` column mapping if names differ from assumptions.

- [ ] **Step 7: Commit**
```bash
git add pipeline/config.py pipeline/__init__.py pipeline/ingest/ pipeline/tests/ pipeline/requirements.txt
git commit -m "feat: ERCOT GIS queue ingestion via gridstatus into DuckDB"
```

---

## Task 3: HIFLD Substation Ingestion

**Files:**
- Create: `pipeline/ingest/substations.py`
- Test: `pipeline/tests/test_substations.py`

- [ ] **Step 1: Write failing test**

```python
# pipeline/tests/test_substations.py
import pytest
from pathlib import Path
from pipeline.ingest.substations import ingest_substations

def test_ingest_substations_texas_only(tmp_path):
    """Should download HIFLD substations, filter to Texas, store in DuckDB with geometry."""
    db_path = tmp_path / "ercot.duckdb"
    result = ingest_substations(db_path=db_path)
    assert result["row_count"] > 3000, f"Expected 3000+ TX substations, got {result['row_count']}"
    assert result["row_count"] < 10000, f"Should be filtered to TX only, got {result['row_count']}"
    assert "name" in result["columns"]
    assert "latitude" in result["columns"]
    assert "longitude" in result["columns"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest pipeline/tests/test_substations.py -v
```
Expected: FAIL

- [ ] **Step 3: Implement substation ingestion**

```python
# pipeline/ingest/substations.py
"""Download HIFLD Electric Substations dataset and filter to Texas."""
import duckdb
import geopandas as gpd
import pandas as pd
from pathlib import Path

HIFLD_URL = "https://opendata.arcgis.com/api/v3/datasets/4a7e57c4a98c4591a0a0d471b401a16e_0/downloads/data?format=csv&spatialRefId=4326"
# Fallback: Kaggle mirror CSV


def ingest_substations(db_path: Path) -> dict:
    """Download HIFLD substations, filter to Texas, store in DuckDB."""
    # Download CSV
    df = pd.read_csv(HIFLD_URL)

    # Filter to Texas
    tx_df = df[df["STATE"].str.upper() == "TX"].copy()

    # Normalize column names
    tx_df.columns = [c.lower() for c in tx_df.columns]

    # Keep key columns
    keep_cols = [c for c in ["name", "city", "state", "county", "latitude", "longitude",
                              "type", "status", "owner", "naics_code"] if c in tx_df.columns]
    tx_df = tx_df[keep_cols].copy()

    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(db_path))
    con.install_extension("spatial")
    con.load_extension("spatial")

    con.execute("DROP TABLE IF EXISTS substations")
    con.execute("CREATE TABLE substations AS SELECT * FROM tx_df")

    row_count = con.execute("SELECT COUNT(*) FROM substations").fetchone()[0]
    columns = [desc[0] for desc in con.execute("SELECT * FROM substations LIMIT 0").description]
    con.close()

    return {"row_count": row_count, "columns": columns}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
python -m pytest pipeline/tests/test_substations.py -v
```
Expected: PASS. Note: downloads ~80MB CSV. If HIFLD URL fails, fall back to Kaggle mirror.

- [ ] **Step 5: Commit**
```bash
git add pipeline/ingest/substations.py pipeline/tests/test_substations.py
git commit -m "feat: HIFLD substation ingestion filtered to Texas"
```

---

## Task 4: ERCOT Queue Fuzzy Matching to Substations

**Files:**
- Create: `pipeline/spatial/__init__.py`
- Create: `pipeline/spatial/fuzzy_match.py`
- Create: `pipeline/spatial/validate.py`
- Test: `pipeline/tests/test_fuzzy_match.py`

- [ ] **Step 1: Write failing test**

```python
# pipeline/tests/test_fuzzy_match.py
import pytest
from pipeline.spatial.fuzzy_match import clean_poi_name, match_queue_to_substations

def test_clean_poi_name_strips_voltage():
    assert clean_poi_name("60385 Solstice 138kV") == "solstice"

def test_clean_poi_name_strips_poib():
    assert clean_poi_name("HORNSBY Substation POIB# 7047") == "hornsby"

def test_clean_poi_name_strips_numeric_prefix():
    assert clean_poi_name("12345 Big Hill Switch") == "big hill switch"

def test_clean_poi_name_handles_simple():
    assert clean_poi_name("Limestone") == "limestone"

def test_match_produces_coordinates(tmp_path):
    """End-to-end: match queue entries to substations, produce lat/lon."""
    # This test requires Task 2 and 3 to have run first (needs populated DuckDB)
    db_path = tmp_path / "ercot.duckdb"
    # Ingest first
    from pipeline.ingest.ercot_queue import ingest_ercot_queue
    from pipeline.ingest.substations import ingest_substations
    ingest_ercot_queue(db_path=db_path)
    ingest_substations(db_path=db_path)

    result = match_queue_to_substations(db_path=db_path)
    assert result["matched_count"] > 0, "Should match at least some entries"
    assert result["total_count"] > 1000
    assert result["match_rate"] > 0.3, f"Match rate too low: {result['match_rate']}"
    # Note: rows_with_coords will only equal total_count AFTER Task 5 wires up
    # county centroid fallback. For now, just verify matched entries have coords.
    assert result["rows_with_coords"] >= result["matched_count"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest pipeline/tests/test_fuzzy_match.py::test_clean_poi_name_strips_voltage -v
```
Expected: FAIL

- [ ] **Step 3: Implement POI name cleaning**

```python
# pipeline/spatial/fuzzy_match.py
"""Fuzzy match ERCOT queue POI locations to HIFLD substations."""
import re
import duckdb
import pandas as pd
from rapidfuzz import fuzz, process
from pathlib import Path


def clean_poi_name(poi: str) -> str:
    """Strip voltage, POIB numbers, and numeric prefixes from POI location string."""
    if not poi or not isinstance(poi, str):
        return ""
    s = poi.strip()
    # Remove voltage (e.g., 138kV, 345kV, 69kV)
    s = re.sub(r'\b\d+\s*kV\b', '', s, flags=re.IGNORECASE)
    # Remove POIB references (e.g., POIB# 7047)
    s = re.sub(r'POIB#?\s*\d+', '', s, flags=re.IGNORECASE)
    # Remove "Substation" / "Switch" suffixes
    s = re.sub(r'\b(substation|switch)\b', '', s, flags=re.IGNORECASE)
    # Remove leading numeric prefix (e.g., "60385")
    s = re.sub(r'^\d+\s+', '', s)
    # Clean up whitespace
    s = re.sub(r'\s+', ' ', s).strip().lower()
    return s


def match_queue_to_substations(db_path: Path, score_threshold: int = 80) -> dict:
    """Match ERCOT queue entries to HIFLD substations via fuzzy string matching.

    For entries that don't match, falls back to county centroid.
    Creates ercot_queue_geo table with latitude, longitude, match_source, match_score.
    """
    con = duckdb.connect(str(db_path))
    con.install_extension("spatial")
    con.load_extension("spatial")

    # Load queue and substations
    queue_df = con.execute("SELECT * FROM ercot_queue").df()
    subs_df = con.execute("SELECT * FROM substations").df()

    # Find the POI column (gridstatus may name it differently)
    poi_col = None
    for candidate in ["poi_location", "point_of_interconnection", "poi"]:
        if candidate in queue_df.columns:
            poi_col = candidate
            break

    if poi_col is None:
        # Try to find it case-insensitively
        for col in queue_df.columns:
            if "poi" in col.lower() or "interconnection" in col.lower():
                poi_col = col
                break

    # Clean POI names
    queue_df["_clean_poi"] = queue_df[poi_col].apply(clean_poi_name) if poi_col else ""

    # Build substation name lookup
    sub_names = subs_df["name"].dropna().unique().tolist()
    sub_lookup = {name.lower(): row for _, row in subs_df.iterrows()
                  for name in [row["name"]] if pd.notna(name)}

    # Fuzzy match each queue entry
    matches = []
    for idx, row in queue_df.iterrows():
        clean_name = row["_clean_poi"]
        if not clean_name:
            matches.append({"latitude": None, "longitude": None,
                          "match_source": "none", "match_score": 0})
            continue

        result = process.extractOne(clean_name, [n.lower() for n in sub_names],
                                     scorer=fuzz.token_sort_ratio)
        if result and result[1] >= score_threshold:
            matched_name = result[0]
            sub_row = sub_lookup.get(matched_name)
            if sub_row is not None:
                matches.append({
                    "latitude": sub_row["latitude"],
                    "longitude": sub_row["longitude"],
                    "match_source": "hifld",
                    "match_score": result[1],
                })
                continue

        # Fallback: county centroid (placeholder — will use boundaries DB in production)
        matches.append({"latitude": None, "longitude": None,
                       "match_source": "county_centroid", "match_score": 0})

    match_df = pd.DataFrame(matches)
    queue_df = pd.concat([queue_df.reset_index(drop=True), match_df], axis=1)
    queue_df = queue_df.drop(columns=["_clean_poi"])

    # Store result
    con.execute("DROP TABLE IF EXISTS ercot_queue_geo")
    con.execute("CREATE TABLE ercot_queue_geo AS SELECT * FROM queue_df")

    total = len(queue_df)
    matched = len([m for m in matches if m["match_source"] == "hifld"])
    with_coords = len([m for m in matches if m["latitude"] is not None])

    con.close()

    return {
        "total_count": total,
        "matched_count": matched,
        "match_rate": matched / total if total > 0 else 0,
        "rows_with_coords": with_coords,
    }
```

- [ ] **Step 4: Run POI cleaning tests**

```bash
python -m pytest pipeline/tests/test_fuzzy_match.py -k "clean_poi" -v
```
Expected: PASS for all 4 cleaning tests.

- [ ] **Step 5: Run full match test**

```bash
python -m pytest pipeline/tests/test_fuzzy_match.py::test_match_produces_coordinates -v --timeout=300
```
Expected: PASS. This test downloads data and runs fuzzy matching — may take 2-5 minutes.

**If match rate is below 30%:** Inspect the actual POI values and HIFLD names. The cleaning regex or matching scorer may need adjustment based on real data formats. Log unmatched entries for analysis:
```python
# Debug: show unmatched POI values
unmatched = queue_df[queue_df["match_source"] != "hifld"][poi_col].head(20)
print("Unmatched POI values:", unmatched.tolist())
```

- [ ] **Step 6: Commit**
```bash
git add pipeline/spatial/
git commit -m "feat: fuzzy match ERCOT queue POI locations to HIFLD substations"
```

---

## Task 5: County Centroid Fallback + Boundary Ingestion

**Files:**
- Create: `pipeline/ingest/boundaries.py`
- Test: `pipeline/tests/test_boundaries.py`

- [ ] **Step 1: Write failing test**

```python
# pipeline/tests/test_boundaries.py
import pytest
from pathlib import Path
from pipeline.ingest.boundaries import ingest_county_boundaries

def test_ingest_counties(tmp_path):
    """Should download TX county boundaries and store in DuckDB with geometry."""
    db_path = tmp_path / "boundaries.duckdb"
    result = ingest_county_boundaries(db_path=db_path)
    assert result["row_count"] == 254, f"Texas has 254 counties, got {result['row_count']}"
    assert "geometry" in result["columns"] or "geom" in result["columns"]
    assert "name" in result["columns"]
    assert "fips" in result["columns"] or "geoid" in result["columns"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest pipeline/tests/test_boundaries.py -v
```

- [ ] **Step 3: Implement county boundary ingestion**

```python
# pipeline/ingest/boundaries.py
"""Ingest geographic boundaries from Census TIGER and other sources."""
import duckdb
import geopandas as gpd
from pathlib import Path

# Census TIGER county boundaries (2023)
TIGER_COUNTIES_URL = "https://www2.census.gov/geo/tiger/TIGER2023/COUNTY/tl_2023_us_county.zip"

# State FIPS for Texas
TX_FIPS = "48"


def ingest_county_boundaries(db_path: Path) -> dict:
    """Download Census TIGER county boundaries, filter to Texas, store in DuckDB."""
    gdf = gpd.read_file(TIGER_COUNTIES_URL)
    tx_gdf = gdf[gdf["STATEFP"] == TX_FIPS].copy()

    # Normalize columns
    tx_gdf = tx_gdf.rename(columns={
        "NAME": "name",
        "GEOID": "geoid",
        "COUNTYFP": "fips",
        "ALAND": "land_area",
    })

    # Add centroid coordinates for fallback matching
    tx_gdf["centroid_lat"] = tx_gdf.geometry.centroid.y
    tx_gdf["centroid_lon"] = tx_gdf.geometry.centroid.x

    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(db_path))
    con.install_extension("spatial")
    con.load_extension("spatial")

    # Store as GeoJSON text (DuckDB spatial can handle this)
    tx_gdf["geom_wkt"] = tx_gdf.geometry.to_wkt()
    df = tx_gdf.drop(columns=["geometry"]).copy()

    con.execute("DROP TABLE IF EXISTS counties")
    con.execute("""
        CREATE TABLE counties AS
        SELECT *, ST_GeomFromText(geom_wkt) as geometry
        FROM df
    """)
    con.execute("ALTER TABLE counties DROP COLUMN geom_wkt")

    row_count = con.execute("SELECT COUNT(*) FROM counties").fetchone()[0]
    columns = [desc[0] for desc in con.execute("SELECT * FROM counties LIMIT 0").description]
    con.close()

    return {"row_count": row_count, "columns": columns}


def ingest_legislative_districts(db_path: Path) -> dict:
    """Download TX legislative district boundaries (2023 redistricting).

    Downloads State House (150), State Senate (31), and Congressional (38) districts.
    All geometries include vintage field for future historical overlay support.
    """
    results = {}

    district_sources = {
        "state_house": {
            "url": "https://www2.census.gov/geo/tiger/TIGER2023/SLDL/tl_2023_48_sldl.zip",
            "number_col": "SLDLST",
            "count": 150,
        },
        "state_senate": {
            "url": "https://www2.census.gov/geo/tiger/TIGER2023/SLDU/tl_2023_48_sldu.zip",
            "number_col": "SLDUST",
            "count": 31,
        },
        "congressional": {
            "url": "https://www2.census.gov/geo/tiger/TIGER2023/CD/tl_2023_us_cd118.zip",
            "number_col": "CD118FP",
            "count": 38,
            "filter_state": True,
        },
    }

    con = duckdb.connect(str(db_path))
    con.install_extension("spatial")
    con.load_extension("spatial")

    for table_name, source in district_sources.items():
        gdf = gpd.read_file(source["url"])

        if source.get("filter_state"):
            gdf = gdf[gdf["STATEFP"] == TX_FIPS]

        gdf = gdf.rename(columns={source["number_col"]: "district_number"})
        gdf["district_number"] = gdf["district_number"].astype(int)
        gdf["vintage"] = 2023
        gdf["effective_from"] = "2023-01-01"
        gdf["effective_to"] = None  # Currently in effect
        gdf["source"] = "Census TIGER 2023"

        gdf["geom_wkt"] = gdf.geometry.to_wkt()
        df = gdf[["district_number", "vintage", "effective_from", "effective_to",
                   "source", "geom_wkt"]].copy()

        con.execute(f"DROP TABLE IF EXISTS {table_name}_districts")
        con.execute(f"""
            CREATE TABLE {table_name}_districts AS
            SELECT *, ST_GeomFromText(geom_wkt) as geometry
            FROM df
        """)
        con.execute(f"ALTER TABLE {table_name}_districts DROP COLUMN geom_wkt")

        count = con.execute(f"SELECT COUNT(*) FROM {table_name}_districts").fetchone()[0]
        results[table_name] = count

    con.close()
    return results


def ingest_city_boundaries(db_path: Path) -> dict:
    """Download Census TIGER Places (city/CDP boundaries) for Texas."""
    url = "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_48_place.zip"
    gdf = gpd.read_file(url)

    gdf = gdf.rename(columns={
        "NAME": "name",
        "GEOID": "geoid",
        "CLASSFP": "class_fips",  # C1=incorporated, U1=CDP, etc.
    })
    gdf["is_incorporated"] = gdf["class_fips"].str.startswith("C")

    gdf["geom_wkt"] = gdf.geometry.to_wkt()
    df = gdf[["name", "geoid", "class_fips", "is_incorporated", "geom_wkt"]].copy()

    con = duckdb.connect(str(db_path))
    con.install_extension("spatial")
    con.load_extension("spatial")

    con.execute("DROP TABLE IF EXISTS cities")
    con.execute("""
        CREATE TABLE cities AS
        SELECT *, ST_GeomFromText(geom_wkt) as geometry FROM df
    """)
    con.execute("ALTER TABLE cities DROP COLUMN geom_wkt")

    row_count = con.execute("SELECT COUNT(*) FROM cities").fetchone()[0]
    columns = [desc[0] for desc in con.execute("SELECT * FROM cities LIMIT 0").description]
    con.close()

    return {"row_count": row_count, "columns": columns}


def ingest_gcd_boundaries(db_path: Path) -> dict:
    """Download Groundwater Conservation District boundaries from TWDB.

    Note: TWDB shapefiles sometimes have geometry issues. If download fails,
    try the TCEQ alternative or manual download.
    """
    # TWDB GCD boundaries - URL may change, check twdb.texas.gov/mapping
    url = "https://www3.twdb.texas.gov/mapping/gisdata/shapefiles/GCD.zip"

    try:
        gdf = gpd.read_file(url)
    except Exception:
        # Fallback: try TCEQ source
        url = "https://gis-tceq.opendata.arcgis.com/datasets/groundwater-conservation-districts.zip"
        gdf = gpd.read_file(url)

    # Fix any invalid geometries
    gdf["geometry"] = gdf.geometry.buffer(0)

    # Normalize columns (varies by source)
    name_col = None
    for candidate in ["GCD_NAME", "NAME", "DIST_NAME", "name"]:
        if candidate in gdf.columns:
            name_col = candidate
            break

    if name_col:
        gdf = gdf.rename(columns={name_col: "name"})

    gdf["geom_wkt"] = gdf.geometry.to_wkt()
    df = gdf[["name", "geom_wkt"]].copy() if "name" in gdf.columns else gdf[["geom_wkt"]].copy()

    con = duckdb.connect(str(db_path))
    con.install_extension("spatial")
    con.load_extension("spatial")

    con.execute("DROP TABLE IF EXISTS gcds")
    con.execute("""
        CREATE TABLE gcds AS
        SELECT *, ST_GeomFromText(geom_wkt) as geometry FROM df
    """)
    con.execute("ALTER TABLE gcds DROP COLUMN geom_wkt")

    row_count = con.execute("SELECT COUNT(*) FROM gcds").fetchone()[0]
    columns = [desc[0] for desc in con.execute("SELECT * FROM gcds LIMIT 0").description]
    con.close()

    return {"row_count": row_count, "columns": columns}
```

- [ ] **Step 4: Run tests**

```bash
python -m pytest pipeline/tests/test_boundaries.py -v --timeout=300
```

- [ ] **Step 5: Update fuzzy_match.py to use county centroids as fallback**

After boundaries are ingested, update the `match_queue_to_substations` function to look up county centroids from `boundaries.duckdb` for unmatched entries.

- [ ] **Step 6: Commit**
```bash
git add pipeline/ingest/boundaries.py pipeline/tests/test_boundaries.py
git commit -m "feat: county, city, district, GCD boundary ingestion from Census TIGER and TWDB"
```

---

## Task 6: Tile Generation Pipeline (DuckDB → GeoJSON → Tippecanoe → PMTiles)

**Files:**
- Create: `pipeline/tiles/__init__.py`
- Create: `pipeline/tiles/generate.py`
- Test: `pipeline/tests/test_tiles.py`

- [ ] **Step 1: Write failing test**

```python
# pipeline/tests/test_tiles.py
import pytest
from pathlib import Path
from pipeline.tiles.generate import export_geojson, generate_pmtiles

def test_export_ercot_geojson(tmp_path):
    """Should export ERCOT queue with coordinates as GeoJSON."""
    # Requires ercot.duckdb with ercot_queue_geo table (from Task 4)
    db_path = tmp_path / "ercot.duckdb"
    # Setup: ingest + match (or use fixture)
    geojson_path = tmp_path / "ercot-queue.geojson"

    # This will fail until implementation exists
    export_geojson(
        db_path=db_path,
        table="ercot_queue_geo",
        output=geojson_path,
        lat_col="latitude",
        lon_col="longitude",
    )
    assert geojson_path.exists()

def test_generate_pmtiles(tmp_path):
    """Should run Tippecanoe on GeoJSON to produce PMTiles."""
    # Create a minimal GeoJSON for testing
    import json
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-97.7431, 30.2672]},
            "properties": {"name": "Test Project", "capacity_mw": 100}
        }]
    }
    geojson_path = tmp_path / "test.geojson"
    geojson_path.write_text(json.dumps(geojson))

    pmtiles_path = tmp_path / "test.pmtiles"
    generate_pmtiles(
        geojson_path=geojson_path,
        output_path=pmtiles_path,
        layer_name="test-layer",
        min_zoom=5,
        max_zoom=14,
    )
    assert pmtiles_path.exists()
    assert pmtiles_path.stat().st_size > 100  # Not empty
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest pipeline/tests/test_tiles.py::test_generate_pmtiles -v
```

- [ ] **Step 3: Implement tile generation**

```python
# pipeline/tiles/generate.py
"""Export DuckDB tables to GeoJSON and generate PMTiles via Tippecanoe."""
import json
import subprocess
import duckdb
from pathlib import Path


def export_geojson(db_path: Path, table: str, output: Path,
                   lat_col: str = "latitude", lon_col: str = "longitude",
                   properties: list[str] | None = None) -> int:
    """Export a DuckDB table with lat/lon columns as GeoJSON FeatureCollection.

    Returns feature count.
    """
    con = duckdb.connect(str(db_path), read_only=True)
    df = con.execute(f"SELECT * FROM {table} WHERE {lat_col} IS NOT NULL AND {lon_col} IS NOT NULL").df()
    con.close()

    if properties is None:
        properties = [c for c in df.columns if c not in [lat_col, lon_col]]

    features = []
    for _, row in df.iterrows():
        props = {col: _serialize(row.get(col)) for col in properties if col in row.index}
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(row[lon_col]), float(row[lat_col])]
            },
            "properties": props,
        })

    geojson = {"type": "FeatureCollection", "features": features}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(geojson))

    return len(features)


def export_polygon_geojson(db_path: Path, table: str, output: Path,
                           geometry_col: str = "geometry",
                           properties: list[str] | None = None) -> int:
    """Export a DuckDB table with WKT geometry as GeoJSON (polygons/multipolygons)."""
    con = duckdb.connect(str(db_path), read_only=True)
    con.install_extension("spatial")
    con.load_extension("spatial")

    # Export geometry as GeoJSON text
    cols = [desc[0] for desc in con.execute(f"SELECT * FROM {table} LIMIT 0").description]
    non_geom = [c for c in cols if c != geometry_col]

    select_cols = ", ".join(non_geom)
    df = con.execute(f"""
        SELECT {select_cols}, ST_AsGeoJSON({geometry_col}) as geojson_geom
        FROM {table}
    """).df()
    con.close()

    if properties is None:
        properties = non_geom

    features = []
    for _, row in df.iterrows():
        props = {col: _serialize(row.get(col)) for col in properties if col in row.index}
        geom = json.loads(row["geojson_geom"]) if row["geojson_geom"] else None
        if geom:
            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": props,
            })

    geojson = {"type": "FeatureCollection", "features": features}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(geojson))

    return len(features)


def generate_pmtiles(geojson_path: Path, output_path: Path,
                     layer_name: str, min_zoom: int = 5, max_zoom: int = 14,
                     point_layer: bool = True) -> None:
    """Run Tippecanoe to generate PMTiles from GeoJSON."""
    cmd = [
        "tippecanoe",
        "-o", str(output_path),
        f"--minimum-zoom={min_zoom}",
        f"--maximum-zoom={max_zoom}",
        f"--layer={layer_name}",
        "--force",  # Overwrite existing
        "--no-tile-compression",  # PMTiles handles compression
    ]

    if point_layer:
        cmd.extend([
            "--drop-densest-as-needed",  # Thin points at low zoom
            "--cluster-distance=10",
        ])
    else:
        cmd.extend([
            "--coalesce-densest-as-needed",
            "--simplify-only-low-zooms",
        ])

    cmd.append(str(geojson_path))

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Tippecanoe failed: {result.stderr}")


def _serialize(val):
    """Make a value JSON-serializable."""
    if hasattr(val, 'isoformat'):
        return val.isoformat()
    if hasattr(val, 'item'):
        return val.item()
    return val
```

- [ ] **Step 4: Run tests**

```bash
python -m pytest pipeline/tests/test_tiles.py -v
```

- [ ] **Step 5: Commit**
```bash
git add pipeline/tiles/
git commit -m "feat: tile generation pipeline — DuckDB to GeoJSON to PMTiles via Tippecanoe"
```

---

## Task 7: Pipeline Orchestrator

**Files:**
- Create: `pipeline/run.py`
- Test: `pipeline/tests/test_pipeline.py`

- [ ] **Step 1: Write failing test**

```python
# pipeline/tests/test_pipeline.py
import pytest
from pathlib import Path
from pipeline.run import run_pipeline

def test_pipeline_produces_pmtiles(tmp_path):
    """Full pipeline should produce PMTiles files."""
    result = run_pipeline(data_dir=tmp_path)
    assert (tmp_path / "tiles" / "ercot-queue.pmtiles").exists()
    assert (tmp_path / "tiles" / "counties.pmtiles").exists()
    assert result["ercot_queue"]["status"] == "success"
    assert result["counties"]["status"] == "success"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest pipeline/tests/test_pipeline.py -v
```

- [ ] **Step 3: Implement orchestrator**

```python
# pipeline/run.py
"""Main pipeline orchestrator. Runs ingestion, matching, and tile generation."""
import sys
import logging
from pathlib import Path
from datetime import datetime
from pipeline.config import DATA_DIR, ERCOT_DB, BOUNDARIES_DB, TILES_DIR, GEOJSON_DIR
from pipeline.config import ERCOT_QUEUE_MIN_ROWS, ERCOT_QUEUE_MAX_ROWS, PMTILES_MIN_SIZE_BYTES

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def run_pipeline(data_dir: Path | None = None) -> dict:
    """Run the full pipeline: ingest → match → export → tile.

    Each source is independent — failure in one does not block others.
    Existing good PMTiles are never overwritten by a failed run.
    """
    if data_dir:
        # Override paths for testing
        duckdb_dir = data_dir / "duckdb"
        geojson_dir = data_dir / "geojson"
        tiles_dir = data_dir / "tiles"
    else:
        duckdb_dir = DATA_DIR / "duckdb"
        geojson_dir = GEOJSON_DIR
        tiles_dir = TILES_DIR

    duckdb_dir.mkdir(parents=True, exist_ok=True)
    geojson_dir.mkdir(parents=True, exist_ok=True)
    tiles_dir.mkdir(parents=True, exist_ok=True)

    ercot_db = duckdb_dir / "ercot.duckdb"
    boundaries_db = duckdb_dir / "boundaries.duckdb"

    results = {}

    # --- ERCOT Queue ---
    results["ercot_queue"] = _run_stage("ERCOT queue", lambda: _ingest_and_tile_ercot(
        ercot_db, boundaries_db, geojson_dir, tiles_dir
    ))

    # --- County Boundaries ---
    results["counties"] = _run_stage("Counties", lambda: _ingest_and_tile_boundaries(
        boundaries_db, "counties", geojson_dir, tiles_dir
    ))

    # --- Legislative Districts ---
    results["districts"] = _run_stage("Districts", lambda: _ingest_districts(
        boundaries_db, geojson_dir, tiles_dir
    ))

    # --- Cities ---
    results["cities"] = _run_stage("Cities", lambda: _ingest_and_tile_boundaries(
        boundaries_db, "cities", geojson_dir, tiles_dir,
        ingest_func="ingest_city_boundaries", min_zoom=7
    ))

    # --- GCDs ---
    results["gcds"] = _run_stage("GCDs", lambda: _ingest_and_tile_boundaries(
        boundaries_db, "gcds", geojson_dir, tiles_dir,
        ingest_func="ingest_gcd_boundaries", min_zoom=6
    ))

    # --- Summary ---
    succeeded = sum(1 for r in results.values() if r["status"] == "success")
    failed = sum(1 for r in results.values() if r["status"] == "error")
    log.info(f"Pipeline complete: {succeeded} succeeded, {failed} failed")

    return results


def _run_stage(name: str, func) -> dict:
    """Run a pipeline stage with error isolation."""
    try:
        log.info(f"Starting: {name}")
        result = func()
        log.info(f"Completed: {name}")
        return {"status": "success", **result}
    except Exception as e:
        log.error(f"Failed: {name} — {e}")
        return {"status": "error", "error": str(e)}


def _ingest_and_tile_ercot(ercot_db, boundaries_db, geojson_dir, tiles_dir):
    from pipeline.ingest.ercot_queue import ingest_ercot_queue
    from pipeline.ingest.substations import ingest_substations
    from pipeline.spatial.fuzzy_match import match_queue_to_substations
    from pipeline.tiles.generate import export_geojson, generate_pmtiles

    # Ingest
    q_result = ingest_ercot_queue(db_path=ercot_db)
    assert q_result["row_count"] >= ERCOT_QUEUE_MIN_ROWS, \
        f"ERCOT queue row count {q_result['row_count']} below minimum {ERCOT_QUEUE_MIN_ROWS}"

    s_result = ingest_substations(db_path=ercot_db)

    # Fuzzy match
    m_result = match_queue_to_substations(db_path=ercot_db)

    # Export and tile
    geojson_path = geojson_dir / "ercot-queue.geojson"
    feature_count = export_geojson(ercot_db, "ercot_queue_geo", geojson_path)

    pmtiles_path = tiles_dir / "ercot-queue.pmtiles"
    pmtiles_tmp = tiles_dir / "ercot-queue.pmtiles.tmp"
    generate_pmtiles(geojson_path, pmtiles_tmp, "ercot-queue", min_zoom=5, max_zoom=14)

    # Validate before replacing
    assert pmtiles_tmp.stat().st_size > PMTILES_MIN_SIZE_BYTES
    pmtiles_tmp.rename(pmtiles_path)

    # Also tile substations
    sub_geojson = geojson_dir / "substations.geojson"
    export_geojson(ercot_db, "substations", sub_geojson)
    sub_pmtiles = tiles_dir / "substations.pmtiles"
    generate_pmtiles(sub_geojson, sub_pmtiles, "substations", min_zoom=7, max_zoom=14)

    return {"features": feature_count, "match_rate": m_result["match_rate"]}


def _ingest_and_tile_boundaries(boundaries_db, table_name, geojson_dir, tiles_dir,
                                 ingest_func="ingest_county_boundaries", min_zoom=4):
    from pipeline.ingest import boundaries as b
    from pipeline.tiles.generate import export_polygon_geojson, generate_pmtiles

    func = getattr(b, ingest_func)
    func(db_path=boundaries_db)

    geojson_path = geojson_dir / f"{table_name}.geojson"
    feature_count = export_polygon_geojson(boundaries_db, table_name, geojson_path)

    pmtiles_path = tiles_dir / f"{table_name}.pmtiles"
    generate_pmtiles(geojson_path, pmtiles_path, table_name,
                     min_zoom=min_zoom, max_zoom=12, point_layer=False)

    return {"features": feature_count}


def _ingest_districts(boundaries_db, geojson_dir, tiles_dir):
    from pipeline.ingest.boundaries import ingest_legislative_districts
    from pipeline.tiles.generate import export_polygon_geojson, generate_pmtiles

    results = ingest_legislative_districts(db_path=boundaries_db)

    for table_name in ["state_house", "state_senate", "congressional"]:
        geojson_path = geojson_dir / f"{table_name}.geojson"
        export_polygon_geojson(boundaries_db, f"{table_name}_districts", geojson_path)

        pmtiles_path = tiles_dir / f"{table_name}.pmtiles"
        generate_pmtiles(geojson_path, pmtiles_path, f"{table_name}-districts",
                        min_zoom=5, max_zoom=12, point_layer=False)

    return {"district_counts": results}


if __name__ == "__main__":
    run_pipeline()
```

- [ ] **Step 4: Run pipeline test** (this is a long integration test — 5-10 minutes)

```bash
python -m pytest pipeline/tests/test_pipeline.py -v --timeout=600
```

- [ ] **Step 5: Commit**
```bash
git add pipeline/run.py pipeline/tests/test_pipeline.py
git commit -m "feat: pipeline orchestrator with failure isolation and validation gates"
```

---

## Task 8: Bun/Hono Tile Server

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/src/routes/tiles.ts`
- Create: `server/src/routes/static.ts`
- Create: `server/src/routes/health.ts`
- Create: `server/src/routes/dev.ts`
- Create: `server/src/middleware/restrict.ts`

- [ ] **Step 1: Initialize server project**

```bash
cd ~/app/server
bun init -y
bun add hono
bun add -d @types/bun
```

Create `server/package.json`:
```json
{
  "name": "texas-gis-server",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts"
  },
  "dependencies": {
    "hono": "latest"
  }
}
```

- [ ] **Step 2: Implement IP restriction middleware**

```typescript
// server/src/middleware/restrict.ts
import type { Context, Next } from "hono";

// Mini's IP — update with actual IP
const ALLOWED_IPS = new Set([
  "127.0.0.1",
  "::1",
  // Add Mini's public IP here
]);

export async function restrictToMini(c: Context, next: Next) {
  const ip = c.req.header("x-real-ip") || c.req.header("x-forwarded-for") || "unknown";
  if (!ALLOWED_IPS.has(ip)) {
    return c.notFound(); // 404, not 403
  }
  return next();
}
```

- [ ] **Step 3: Implement tile serving route**

```typescript
// server/src/routes/tiles.ts
import { Hono } from "hono";
import { resolve } from "path";
import { stat } from "fs/promises";

const TILES_DIR = resolve(import.meta.dir, "../../../data/tiles");

const tiles = new Hono();

tiles.get("/:layer.pmtiles", async (c) => {
  const layer = c.req.param("layer");
  const filePath = resolve(TILES_DIR, `${layer}.pmtiles`);

  // Prevent path traversal
  if (!filePath.startsWith(TILES_DIR)) {
    return c.notFound();
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return c.notFound();
  }

  const fileSize = file.size;
  const rangeHeader = c.req.header("range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : fileSize - 1;
      const chunk = file.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": String(end - start + 1),
          "Content-Type": "application/octet-stream",
          "Accept-Ranges": "bytes",
        },
      });
    }
  }

  return new Response(file, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
    },
  });
});

export default tiles;
```

- [ ] **Step 4: Implement health check route**

```typescript
// server/src/routes/health.ts
import { Hono } from "hono";
import { resolve } from "path";
import { readdir, stat } from "fs/promises";

const TILES_DIR = resolve(import.meta.dir, "../../../data/tiles");
const STALE_HOURS = 168; // 7 days

const health = new Hono();

health.get("/", async (c) => {
  const layers: Record<string, any> = {};
  let allHealthy = true;

  try {
    const files = await readdir(TILES_DIR);
    const pmtilesFiles = files.filter((f) => f.endsWith(".pmtiles"));

    for (const file of pmtilesFiles) {
      const filePath = resolve(TILES_DIR, file);
      const fileStat = await stat(filePath);
      const ageHours = (Date.now() - fileStat.mtimeMs) / (1000 * 60 * 60);
      const stale = ageHours > STALE_HOURS;

      if (stale || fileStat.size === 0) allHealthy = false;

      layers[file.replace(".pmtiles", "")] = {
        size: fileStat.size,
        updated: new Date(fileStat.mtimeMs).toISOString(),
        age_hours: Math.round(ageHours),
        stale,
      };
    }
  } catch {
    allHealthy = false;
  }

  return c.json({ status: allHealthy ? "healthy" : "degraded", layers });
});

export default health;
```

- [ ] **Step 5: Implement dev mode route**

```typescript
// server/src/routes/dev.ts
import { Hono } from "hono";
import { restrictToMini } from "../middleware/restrict";
import { resolve } from "path";
import { spawn } from "child_process";

const dev = new Hono();
dev.use("*", restrictToMini);

const PIPELINE_DIR = resolve(import.meta.dir, "../../../pipeline");
const VENV_PYTHON = resolve(PIPELINE_DIR, ".venv/bin/python");

dev.get("/query", async (c) => {
  const query = c.req.query("q");
  const db = c.req.query("db") || "ercot";

  if (!query) {
    return c.json({ error: "Missing query parameter ?q=" }, 400);
  }

  // Allowlist database names
  const allowedDbs = ["ercot", "boundaries", "puct", "elections"];
  if (!allowedDbs.includes(db)) {
    return c.json({ error: "Invalid database" }, 400);
  }

  try {
    const result = await runDuckDBQuery(db, query);
    return c.json(JSON.parse(result));
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

function runDuckDBQuery(db: string, query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dbPath = `../data/duckdb/${db}.duckdb`;
    // Pass query via stdin to avoid shell injection
    const proc = spawn(VENV_PYTHON, [
      resolve(import.meta.dir, "../../../pipeline/dev_query.py"),
      "--db", dbPath,
    ]);

    // Send query via stdin (safe — no shell interpolation)
    proc.stdin.write(query);
    proc.stdin.end();

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code: number) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `Exit code ${code}`));
    });
  });
}

// pipeline/dev_query.py — companion script for safe DuckDB queries
// ```python
// """Execute a DuckDB query received via stdin. Read-only mode only."""
// import argparse, duckdb, json, sys
//
// parser = argparse.ArgumentParser()
// parser.add_argument("--db", required=True)
// args = parser.parse_args()
//
// query = sys.stdin.read().strip()
// if not query:
//     print(json.dumps({"error": "Empty query"}))
//     sys.exit(1)
//
// con = duckdb.connect(args.db, read_only=True)
// con.load_extension("spatial")
// result = con.execute(query).df()
// print(json.dumps({"rows": len(result), "data": result.head(1000).to_dict(orient="records")}, default=str))
// con.close()
// ```

export default dev;
```

- [ ] **Step 6: Wire up main server**

```typescript
// server/src/index.ts
import { Hono } from "hono";
import tiles from "./routes/tiles";
import health from "./routes/health";
import dev from "./routes/dev";

const app = new Hono();

// Static image serving
app.get("/static/:filename", async (c) => {
  const filename = c.req.param("filename");
  const filePath = `../data/tiles/${filename}`; // Static exports live alongside tiles
  const file = Bun.file(filePath);
  if (!(await file.exists())) return c.notFound();
  return new Response(file, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
});

app.route("/tiles", tiles);
app.route("/health", health);
app.route("/dev", dev);

const port = parseInt(process.env.PORT || "3070");
console.log(`Texas GIS tile server listening on port ${port}`);

export default { port, fetch: app.fetch };
```

- [ ] **Step 7: Test server locally**

```bash
cd ~/app/server && bun run dev
# In another terminal:
curl http://localhost:3070/health
```

- [ ] **Step 8: Create ecosystem.config.js and deploy.sh**

`ecosystem.config.js` — use the port from VPS_GUIDE.md (allocated in Task 1):
```javascript
module.exports = {
  apps: [{
    name: "texasgis",
    script: "server/src/index.ts",
    interpreter: "/home/texasgis/.bun/bin/bun",
    cwd: "/home/texasgis/current",
    env: { PORT: PROD_PORT, NODE_ENV: "production" },
  }],
};
```

`deploy.sh` — copy from reference and customize per VPS standards.

- [ ] **Step 9: First deploy**

```bash
./deploy.sh prod
```
Run `/post-deploy-verify texasgis`

- [ ] **Step 10: Commit**
```bash
git add server/ ecosystem.config.js deploy.sh
git commit -m "feat: Bun/Hono tile server with PMTiles range serving, health check, and dev mode"
```

---

## Task 9: Hyperscale MapLibre Integration

**Files:**
- Modify: `/home/hyperscale/app/package.json` (add maplibre-gl, pmtiles)
- Create: `/home/hyperscale/app/src/lib/tiles.ts`
- Create: `/home/hyperscale/app/src/components/Map.tsx`
- Create: `/home/hyperscale/app/src/components/MapPopup.tsx`
- Create: `/home/hyperscale/app/src/components/MapFilters.tsx`
- Create: `/home/hyperscale/app/src/app/map/page.tsx`

**Important:** This task modifies the Hyperscale project, not texas-gis. Work as the `hyperscale` user.

- [ ] **Step 1: Install MapLibre dependencies in Hyperscale**

```bash
ssh hyperscale  # or sudo -u hyperscale bash
cd ~/app
bun add maplibre-gl pmtiles
```

- [ ] **Step 2: Create tile config**

```typescript
// src/lib/tiles.ts
// NOTE: Do NOT import maplibregl statically here — it breaks SSR.
// The pmtiles protocol is registered in Map.tsx using the dynamically imported instance.

const TILE_SERVER = process.env.NEXT_PUBLIC_TILE_SERVER || "https://tiles.hyperscalenews.com";

export function tileUrl(layer: string): string {
  return `pmtiles://${TILE_SERVER}/tiles/${layer}.pmtiles`;
}

/**
 * Register pmtiles protocol on a dynamically imported maplibregl instance.
 * Call this once in the Map component after dynamic import.
 */
let protocolAdded = false;
export function initPMTilesProtocol(maplibregl: any) {
  if (protocolAdded) return;
  import("pmtiles").then(({ Protocol }) => {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    protocolAdded = true;
  });
}

// Technology type color mapping
export const TECH_COLORS: Record<string, string> = {
  SOL: "#f59e0b",  // amber — solar
  WIN: "#3b82f6",  // blue — wind
  GAS: "#ef4444",  // red — gas
  BES: "#8b5cf6",  // purple — battery storage
  BIO: "#22c55e",  // green — biomass
  COA: "#6b7280",  // gray — coal
  NUC: "#06b6d4",  // cyan — nuclear
};

export const TECH_LABELS: Record<string, string> = {
  SOL: "Solar",
  WIN: "Wind",
  GAS: "Natural Gas",
  BES: "Battery Storage",
  BIO: "Biomass",
  COA: "Coal",
  NUC: "Nuclear",
};
```

- [ ] **Step 3: Create MapLibre wrapper component**

```typescript
// src/components/Map.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

interface MapProps {
  onLoad?: (map: MapLibreMap) => void;
  className?: string;
}

export default function Map({ onLoad, className }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues with WebGL
    Promise.all([
      import("maplibre-gl"),
      import("../lib/tiles"),
    ]).then(([maplibregl, { initPMTilesProtocol, tileUrl, TECH_COLORS }]) => {
      // Register pmtiles protocol on THIS maplibregl instance (avoids SSR mismatch)
      initPMTilesProtocol(maplibregl.default);

      // Import CSS
      import("maplibre-gl/dist/maplibre-gl.css");

      // Use demotiles basemap (free, no API key, includes roads/terrain)
      // Alternative: MapTiler, Stadia, or self-hosted tiles
      const BASEMAP = "https://demotiles.maplibre.org/style.json";

      const map = new maplibregl.default.Map({
        container: containerRef.current!,
        style: BASEMAP,
        center: [-99.5, 31.5], // Center of Texas
        zoom: 6,
        maxBounds: [[-107, 25], [-93, 37]], // Texas bounds
      });

      map.on("load", () => {
        // Add our data sources on top of the basemap
        map.addSource("ercot-queue", {
          type: "vector",
          url: tileUrl("ercot-queue"),
        });
        map.addSource("counties", {
          type: "vector",
          url: tileUrl("counties"),
        });
        map.addSource("substations", {
          type: "vector",
          url: tileUrl("substations"),
        });

        // County borders
        map.addLayer({
          id: "county-borders",
          type: "line",
          source: "counties",
          "source-layer": "counties",
          paint: {
            "line-color": "#374151",
            "line-width": 0.5,
            "line-opacity": 0.4,
          },
        });

        // ERCOT queue points
        map.addLayer({
          id: "ercot-queue-points",
          type: "circle",
          source: "ercot-queue",
          "source-layer": "ercot-queue",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              5, 3,
              10, 6,
              14, 10,
            ],
            "circle-color": [
              "match", ["get", "technology"],
              ...Object.entries(TECH_COLORS).flat(),
              "#9ca3af", // fallback gray
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });

        setLoaded(true);
        mapRef.current = map;
        onLoad?.(map);
      }); // end map.on("load")
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className={className || "w-full h-full"} />
  );
}
```

- [ ] **Step 4: Create popup component**

```typescript
// src/components/MapPopup.tsx
"use client";

import { useEffect } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { TECH_LABELS, TECH_COLORS } from "../lib/tiles";

export default function MapPopup({ map }: { map: MapLibreMap | null }) {
  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["ercot-queue-points"],
      });
      if (!features.length) return;

      const f = features[0].properties;
      const tech = f.technology || "Unknown";
      const techLabel = TECH_LABELS[tech] || tech;
      const color = TECH_COLORS[tech] || "#9ca3af";

      const { Popup } = await import("maplibre-gl");
      new Popup({ closeOnClick: true, maxWidth: "320px" })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: system-ui; padding: 4px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">
              ${f.project_name || "Unknown Project"}
            </h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 13px;">
              <span style="background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                ${techLabel}
              </span>
              <span style="color: #6b7280;">
                ${f.capacity_mw ? Math.round(f.capacity_mw) + " MW" : ""}
              </span>
            </div>
            ${f.status ? `<p style="margin: 6px 0 0; color: #6b7280; font-size: 12px;">Status: ${f.status}</p>` : ""}
            ${f.county ? `<p style="margin: 2px 0 0; color: #6b7280; font-size: 12px;">${f.county} County</p>` : ""}
          </div>
        `)
        .addTo(map);
    };

    map.on("click", handleClick);
    map.getCanvas().style.cursor = "pointer";

    return () => {
      map.off("click", handleClick);
    };
  }, [map]);

  return null;
}
```

- [ ] **Step 5: Create filter component**

```typescript
// src/components/MapFilters.tsx
"use client";

import { TECH_LABELS, TECH_COLORS } from "../lib/tiles";

interface MapFiltersProps {
  activeTech: Set<string>;
  onToggleTech: (tech: string) => void;
  minMW: number;
  onMinMWChange: (mw: number) => void;
}

export default function MapFilters({ activeTech, onToggleTech, minMW, onMinMWChange }: MapFiltersProps) {
  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 z-10 max-w-xs">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">ERCOT Queue Filters</h3>

      <div className="space-y-2 mb-4">
        {Object.entries(TECH_LABELS).map(([code, label]) => (
          <label key={code} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={activeTech.has(code)}
              onChange={() => onToggleTech(code)}
              className="rounded"
            />
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: TECH_COLORS[code] }}
            />
            <span className="text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="text-xs text-gray-500">Min capacity: {minMW} MW</label>
        <input
          type="range"
          min={0}
          max={1000}
          step={50}
          value={minMW}
          onChange={(e) => onMinMWChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create /map page**

```typescript
// src/app/map/page.tsx
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ERCOT Interconnection Queue Map | Hyperscale News",
  description: "Interactive map of 1,880+ projects and 415 GW in the ERCOT interconnection pipeline. Explore by technology, capacity, and location.",
  openGraph: {
    title: "ERCOT Interconnection Queue Map",
    description: "1,880+ projects. 415 GW. 5x Texas peak demand. Explore the full ERCOT queue.",
  },
};

// Dynamic import to prevent SSR of WebGL components
const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

export default function MapPage() {
  return (
    <div className="h-screen w-screen relative">
      <MapView />

      {/* Subscriber CTA */}
      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 z-10 max-w-sm">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          Get weekly ERCOT queue updates
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Subscribe to Hyperscale News — daily datacenter intelligence.
        </p>
        <a
          href="/"
          className="block text-center bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Subscribe
        </a>
      </div>
    </div>
  );
}
```

And the client-side MapView that wires everything together:

```typescript
// src/components/MapView.tsx
"use client";

import { useState, useCallback } from "react";
import Map from "./Map";
import MapPopup from "./MapPopup";
import MapFilters from "./MapFilters";
import type { Map as MapLibreMap } from "maplibre-gl";
import { TECH_LABELS } from "../lib/tiles";

export default function MapView() {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [activeTech, setActiveTech] = useState(new Set(Object.keys(TECH_LABELS)));
  const [minMW, setMinMW] = useState(0);

  const handleToggleTech = useCallback((tech: string) => {
    setActiveTech((prev) => {
      const next = new Set(prev);
      if (next.has(tech)) next.delete(tech);
      else next.add(tech);

      // Update map filter
      if (map) {
        map.setFilter("ercot-queue-points", [
          "all",
          ["in", "technology", ...Array.from(next)],
          [">=", "capacity_mw", minMW],
        ]);
      }

      return next;
    });
  }, [map, minMW]);

  const handleMinMWChange = useCallback((mw: number) => {
    setMinMW(mw);
    if (map) {
      map.setFilter("ercot-queue-points", [
        "all",
        ["in", "technology", ...Array.from(activeTech)],
        [">=", "capacity_mw", mw],
      ]);
    }
  }, [map, activeTech]);

  return (
    <>
      <Map onLoad={setMap} className="w-full h-full" />
      <MapPopup map={map} />
      <MapFilters
        activeTech={activeTech}
        onToggleTech={handleToggleTech}
        minMW={minMW}
        onMinMWChange={handleMinMWChange}
      />
    </>
  );
}
```

- [ ] **Step 7: Add NEXT_PUBLIC_TILE_SERVER to Hyperscale .env.local**

```bash
echo 'NEXT_PUBLIC_TILE_SERVER=https://tiles.hyperscalenews.com' >> ~/app/.env.local
```

- [ ] **Step 8: Test locally**

```bash
cd ~/app && bun run dev
# Visit http://localhost:3018/map
```
Verify: map renders, tiles load from tile server, popups work, filters work.

- [ ] **Step 9: Deploy Hyperscale**

```bash
cd ~/app && ./deploy.sh prod
```
Run `/post-deploy-verify hyperscale`

- [ ] **Step 10: Commit to Hyperscale repo**
```bash
git add src/components/Map.tsx src/components/MapPopup.tsx src/components/MapFilters.tsx src/components/MapView.tsx src/lib/tiles.ts src/app/map/
git commit -m "feat: interactive ERCOT queue map at /map with MapLibre GL JS"
```

---

## Task 10: Editorial Map CLI

**Files:**
- Create: `pipeline/export/__init__.py`
- Create: `pipeline/export/render.py`
- Create: `pipeline/export/templates/map.html`

- [ ] **Step 1: Create MapLibre HTML template for headless rendering**

```html
<!-- pipeline/export/templates/map.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; }
    #map { width: WIDTH_PXpx; height: HEIGHT_PXpx; }
  </style>
  <script src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/pmtiles@latest/dist/pmtiles.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    const map = new maplibregl.Map({
      container: "map",
      style: STYLE_JSON,
      center: CENTER_JSON,
      zoom: ZOOM_LEVEL,
      interactive: false,
    });

    map.on("idle", () => {
      window.__MAP_READY = true;
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Implement render CLI**

```python
# pipeline/export/render.py
"""CLI for generating editorial map images via Playwright + MapLibre."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path
from pipeline.config import TILES_DIR

TEMPLATE = Path(__file__).parent / "templates" / "map.html"


def render_map(layers: list[str], output: Path,
               center: tuple[float, float] = (-99.5, 31.5),
               zoom: int = 6, width: int = 1200, height: int = 630,
               filter_expr: str | None = None,
               scale: int = 2) -> None:
    """Render a map image using Playwright + MapLibre.

    Args:
        layers: List of PMTiles layer names to include
        output: Output PNG/SVG path
        center: [lon, lat] center point
        zoom: Zoom level
        width: Image width in CSS pixels
        height: Image height in CSS pixels
        filter_expr: Optional MapLibre filter expression (JSON string)
        scale: Device pixel ratio (2 for retina)
    """
    # Build MapLibre style JSON
    sources = {}
    style_layers = []

    # tile_base will be set to the local HTTP server URL at render time
    # (PMTiles protocol requires HTTP, not file://)
    tile_base = "pmtiles://http://127.0.0.1:LOCAL_PORT/tiles"

    for layer in layers:
        sources[layer] = {
            "type": "vector",
            "url": f"{tile_base}/{layer}.pmtiles",
        }
        # Add default styling per layer type
        # (This would be expanded with proper styling per layer)
        style_layers.append({
            "id": f"{layer}-layer",
            "type": "circle" if layer in ["ercot-queue", "substations"] else "line",
            "source": layer,
            "source-layer": layer,
            "paint": _default_paint(layer),
        })

    style = {
        "version": 8,
        "sources": sources,
        "layers": style_layers,
    }

    # Render template
    template_html = TEMPLATE.read_text()
    html = template_html.replace("WIDTH_PX", str(width))
    html = html.replace("HEIGHT_PX", str(height))
    html = html.replace("STYLE_JSON", json.dumps(style))
    html = html.replace("CENTER_JSON", json.dumps(list(center)))
    html = html.replace("ZOOM_LEVEL", str(zoom))

    # Write temp HTML and screenshot with Playwright
    with tempfile.NamedTemporaryFile(suffix=".html", mode="w", delete=False) as f:
        f.write(html)
        html_path = f.name

    output.parent.mkdir(parents=True, exist_ok=True)

    # Start a local HTTP server to serve tiles + HTML (PMTiles needs HTTP, not file://)
    import http.server
    import threading

    # Serve from a temp dir containing the HTML + symlink to tiles
    import shutil
    serve_dir = Path(html_path).parent
    tiles_link = serve_dir / "tiles"
    if not tiles_link.exists():
        tiles_link.symlink_to(TILES_DIR)

    handler = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(("127.0.0.1", 0), lambda *a: handler(*a, directory=str(serve_dir)))
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()

    try:
        # Use Python playwright (pip install playwright)
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": width, "height": height},
                                     device_scale_factor=scale)
            page.goto(f"http://127.0.0.1:{port}/{Path(html_path).name}")
            # Wait for MapLibre to finish rendering
            page.wait_for_function("window.__MAP_READY === true", timeout=30000)
            page.screenshot(path=str(output))
            browser.close()
    finally:
        httpd.shutdown()

    Path(html_path).unlink()
    print(f"Saved: {output} ({width*scale}x{height*scale}px)")


def _default_paint(layer: str) -> dict:
    """Default paint properties per layer."""
    if layer == "ercot-queue":
        return {
            "circle-radius": 5,
            "circle-color": "#3b82f6",
            "circle-opacity": 0.8,
        }
    elif layer == "substations":
        return {
            "circle-radius": 3,
            "circle-color": "#ef4444",
            "circle-opacity": 0.6,
        }
    else:
        return {
            "line-color": "#374151",
            "line-width": 1,
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate editorial map images")
    parser.add_argument("--layers", required=True, help="Comma-separated layer names")
    parser.add_argument("--out", required=True, help="Output file path")
    parser.add_argument("--center", default="-99.5,31.5", help="lon,lat center")
    parser.add_argument("--zoom", type=int, default=6)
    parser.add_argument("--width", type=int, default=1200)
    parser.add_argument("--height", type=int, default=630)
    parser.add_argument("--filter", default=None, help="MapLibre filter (JSON)")
    parser.add_argument("--scale", type=int, default=2, help="Device pixel ratio")

    args = parser.parse_args()
    center = tuple(float(x) for x in args.center.split(","))

    render_map(
        layers=args.layers.split(","),
        output=Path(args.out),
        center=center,
        zoom=args.zoom,
        width=args.width,
        height=args.height,
        filter_expr=args.filter,
        scale=args.scale,
    )
```

- [ ] **Step 3: Test CLI**

```bash
python pipeline/export/render.py \
  --layers ercot-queue,counties \
  --out /tmp/test-map.png \
  --zoom 6 \
  --center "-99.5,31.5"
```
Verify: PNG file exists, visually correct.

- [ ] **Step 4: Generate pre-event marketing images**

```bash
# Full queue overview
python pipeline/export/render.py --layers ercot-queue,counties --out ~/app/data/tiles/ercot-queue-full.png --zoom 6

# Battery storage only (for newsletter)
python pipeline/export/render.py --layers ercot-queue,counties --filter '["==",["get","technology"],"BES"]' --out ~/app/data/tiles/ercot-battery.png --zoom 6

# High-res offline fallback for conference
python pipeline/export/render.py --layers ercot-queue,counties,substations --out ~/app/data/tiles/ercot-queue-offline.png --zoom 7 --width 1600 --height 900 --scale 3
```

- [ ] **Step 5: Commit**
```bash
git add pipeline/export/
git commit -m "feat: editorial map CLI — parameterized PNG export via Playwright + MapLibre"
```

---

## Task 11: Polish, Mobile, and Deploy

**Files:**
- Modify: Hyperscale `src/app/map/page.tsx` (mobile responsiveness)
- Modify: Hyperscale `src/components/MapFilters.tsx` (mobile drawer)
- Test: Manual mobile testing

- [ ] **Step 1: Make filter panel mobile-responsive**

Update `MapFilters.tsx` to collapse into a bottom sheet on mobile:
- Desktop: fixed panel top-left
- Mobile: collapsible button bottom-center, expands to bottom sheet

- [ ] **Step 2: Test on mobile viewport**

```bash
# Use Playwright to screenshot mobile viewport
npx playwright screenshot --viewport-size 390,844 https://hyperscalenews.com/map /tmp/map-mobile.png
```
Review screenshot for usability.

- [ ] **Step 3: Add layer toggle controls**

Add toggle buttons for additional layers (substations, districts, GCDs, cities) — hidden by default, toggled via a "Layers" button.

- [ ] **Step 4: Deploy final Hyperscale version**

```bash
cd ~/app && ./deploy.sh prod
```
Run `/post-deploy-verify hyperscale`

- [ ] **Step 5: Smoke test on actual mobile device**

Open `https://hyperscalenews.com/map` on phone. Verify:
- Map loads within 3 seconds
- Pinch-to-zoom works
- Tapping a point shows popup
- Filters are accessible but not in the way
- Subscriber CTA is visible

- [ ] **Step 6: Generate offline fallback image**

High-res static image for showing at conference if WiFi fails:
```bash
python pipeline/export/render.py \
  --layers ercot-queue,counties,substations \
  --out ~/offline-ercot-map.png \
  --zoom 7 --width 2400 --height 1350 --scale 2
```
Save to phone before event.

- [ ] **Step 7: Final commit and tag**
```bash
git add -A
git commit -m "feat: mobile responsive map page ready for ERCOT event"
git tag v1.0-ercot-event
git push origin main --tags
```

---

## Task 12: PUCT Filing Ingestion

**Files:**
- Create: `pipeline/ingest/puct.py`
- Test: `pipeline/tests/test_puct.py`
- Modify: `pipeline/run.py` (add PUCT stage to orchestrator)

The spec requires PUCT large load filings as a v1 tile layer. PUCT Interchange publishes docket entries that can be scraped.

- [ ] **Step 1: Write failing test**

```python
# pipeline/tests/test_puct.py
import pytest
from pathlib import Path
from pipeline.ingest.puct import ingest_puct_filings

def test_ingest_puct_filings(tmp_path):
    """Should scrape PUCT large load filings into DuckDB."""
    db_path = tmp_path / "puct.duckdb"
    result = ingest_puct_filings(db_path=db_path)
    assert result["row_count"] > 0
    assert "docket_number" in result["columns"] or "project_number" in result["columns"]
```

- [ ] **Step 2: Implement PUCT scraper**

Scrape PUCT Interchange for Project 58481 and related large load filings. Store docket number, applicant name, MW capacity, status, filing date, and county (when available) for geocoding.

- [ ] **Step 3: Add to pipeline orchestrator**

Add `_ingest_and_tile_puct()` stage to `pipeline/run.py` with the same failure isolation pattern as other stages.

- [ ] **Step 4: Generate PUCT PMTiles**

Export as point layer (geocoded to county centroid when no specific coordinates) at zoom 6-14.

- [ ] **Step 5: Commit**
```bash
git add pipeline/ingest/puct.py pipeline/tests/test_puct.py
git commit -m "feat: PUCT large load filing ingestion and tile generation"
```

---

## Task 13: Missing Infrastructure Items

**Files:**
- Create: `pipeline/requirements.txt`
- Create: `.gitignore`
- Create: `pipeline/dev_query.py`
- Modify: VPS crontab

- [ ] **Step 1: Create requirements.txt**

```
geopandas>=0.14
shapely>=2.0
duckdb>=0.10
rapidfuzz>=3.0
gridstatus>=0.25
requests>=2.31
pyarrow>=14.0
playwright>=1.40
```

- [ ] **Step 2: Create .gitignore**

```
data/raw/
data/duckdb/
data/geojson/
data/tiles/
pipeline/.venv/
__pycache__/
*.pyc
node_modules/
bun.lock
.env.local
```

- [ ] **Step 3: Create dev_query.py** (companion to dev mode route)

```python
# pipeline/dev_query.py
"""Execute a DuckDB query received via stdin. Read-only mode only."""
import argparse, duckdb, json, sys

parser = argparse.ArgumentParser()
parser.add_argument("--db", required=True)
args = parser.parse_args()

query = sys.stdin.read().strip()
if not query:
    print(json.dumps({"error": "Empty query"}))
    sys.exit(1)

con = duckdb.connect(args.db, read_only=True)
con.load_extension("spatial")
result = con.execute(query).df()
print(json.dumps({"rows": len(result), "data": result.head(1000).to_dict(orient="records")}, default=str))
con.close()
```

- [ ] **Step 4: Install DuckDB spatial extension once during setup**

```bash
# Run once — downloads the extension so load_extension works offline
python3 -c "import duckdb; con = duckdb.connect(); con.install_extension('spatial'); con.close()"
```
Then change all pipeline code to use `con.load_extension("spatial")` only (not `install_extension`).

- [ ] **Step 5: Set up weekly cron for pipeline refresh**

```bash
sudo -u texasgis crontab -e
# Add:
# Weekly pipeline run (Sunday 2am CT)
0 7 * * 0 cd /home/texasgis/app && /home/texasgis/app/pipeline/.venv/bin/python pipeline/run.py >> /home/texasgis/logs/pipeline.log 2>&1
```

- [ ] **Step 6: Add playwright to Python venv**

```bash
source ~/app/pipeline/.venv/bin/activate
pip install playwright
playwright install chromium
```

- [ ] **Step 7: Commit**
```bash
git add pipeline/requirements.txt .gitignore pipeline/dev_query.py
git commit -m "chore: requirements.txt, .gitignore, dev query script, DuckDB extension setup"
```

---

## Deferred Items (Post-Event)

These are in the spec's v1 scope but deferred past the ERCOT event deadline:

- **Election results ingestion** (spec Section 3.1, 6.3) — TX Election is third priority
- **Dev mode interactive UI page** (`/dev/` with layer composer and export button) — useful but not critical for event
- **Pipeline failure notifications** (email/webhook alerts) — monitor manually during event week
- **Layer toggle UI** in Task 11 — basic version ships, full toggle panel is post-event polish

---

## Basemap Note

The demotiles basemap (`https://demotiles.maplibre.org/style.json`) is free but basic. For a professional conference demo, consider:
- **MapTiler** (free tier: 100K tiles/month) — better cartography
- **Stadia Maps** (free tier available) — clean style options
- **Protomaps basemap** (self-hosted PMTiles) — no external dependency

Evaluate after first render. If demotiles looks too rough, switch to MapTiler with a free API key before the event.

---

## Task Dependencies

```
Task 1 (infra) + Task 13 (missing infra) ────────┐
                                                   │
Task 2 (ERCOT queue) ──┬── Task 4 (fuzzy match) ──┤
                       │          │                │
Task 3 (substations) ──┘          │                │
                                  │                ├── Task 7 (orchestrator) ── Task 8 (server) ── Task 9 (Hyperscale map)
Task 5 (boundaries) ─────────────┘                │
  (centroids needed by Task 4 fallback)            │
                                                   ├── Task 10 (export CLI)
Task 12 (PUCT) ───────────────────────────────────┘

Task 9 + Task 10 ── Task 11 (polish + deploy)
```

**Parallelizable pairs:**
- Task 2 + Task 3 (independent data ingestion)
- Task 8 (server) can start scaffolding while Task 7 (orchestrator) runs
- Task 10 (export CLI) can run in parallel with Task 9 (Hyperscale map)
- Task 12 (PUCT) can run in parallel with Tasks 4-6

**Dependency correction:** Task 4 (fuzzy matching) needs Task 5 (boundaries) for county centroid fallback. Run Task 5 first or accept partial results from Task 4 initially.
