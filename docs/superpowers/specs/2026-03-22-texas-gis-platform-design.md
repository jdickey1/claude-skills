# Texas GIS Platform — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Priority Deadline:** ERCOT event ~2026-03-29 (Hyperscale map must be live)

---

## 1. Problem Statement

Three projects — Hyperscale News, JD Key Consulting, and TX Election Results — all need geographic data visualization but have no GIS capability today. Public datasets (ERCOT interconnection queue, election results, legislative boundaries, groundwater districts) exist in tabular form but lack spatial representation. Interactive maps would differentiate content, improve consulting deliverables, and drive subscriber acquisition.

**Immediate trigger:** Kyle Walker's freestiler demos showing ERCOT queue visualization and fast vector tile generation from DuckDB. ERCOT event ~March 29 creates a hard deadline for the first deliverable.

## 2. Architecture

### 2.1 Standalone GIS Service (`texas-gis`)

A new VPS project that owns all geodata processing and tile serving. Consuming projects embed MapLibre components that point to this service.

```
texas-gis/
├── pipeline/              # Python — data ingestion, processing, DuckDB
│   ├── ingest/            # Per-source ingestion scripts
│   │   ├── ercot_queue.py
│   │   ├── substations.py
│   │   ├── boundaries.py  # Counties, cities, districts, GCDs
│   │   ├── puct.py
│   │   └── elections.py   # Mirror from txelection_db
│   ├── spatial/           # Geocoding, fuzzy matching, spatial joins
│   │   ├── fuzzy_match.py # ERCOT POI → substation matching
│   │   └── validate.py    # Spatial validation (matched point in correct region)
│   ├── tiles/             # Tippecanoe PMTiles generation
│   │   └── generate.py    # GeoJSON export → Tippecanoe → PMTiles
│   └── export/            # Static image generation (PNG/SVG)
│       └── render.py      # Headless MapLibre rendering for newsletter/social
├── server/                # TypeScript/Bun — tile serving API
│   ├── index.ts           # Hono server
│   ├── routes/
│   │   ├── tiles.ts       # PMTiles serving endpoints
│   │   ├── static.ts      # Pre-rendered image endpoints
│   │   └── dev.ts         # Dev mode — live DuckDB queries (restricted)
│   └── middleware/
│       └── restrict.ts    # IP restriction for dev mode
├── data/
│   ├── raw/               # Downloaded CSVs, shapefiles (gitignored)
│   ├── duckdb/            # Processed DuckDB databases
│   │   ├── ercot.duckdb
│   │   ├── boundaries.duckdb
│   │   ├── puct.duckdb
│   │   └── elections.duckdb
│   └── tiles/             # Generated PMTiles archives
├── deploy.sh
├── ecosystem.config.js    # PM2 config
└── nginx-texas-gis.conf
```

### 2.2 Design Decisions

**PMTiles over live tile generation (production).** The Python pipeline pre-generates PMTiles archives via Tippecanoe. The TypeScript server serves static files. No Python runtime at request time. Tiles are cacheable, fast, zero compute on serve. Pipeline runs on a schedule (cron) or manually to refresh data.

**Trade-offs acknowledged:**
- We lose: developer iteration speed (must regenerate tiles to see changes), ad-hoc query flexibility at runtime
- We gain: production reliability (Python pipeline can be down, maps still work), faster tile loads (critical for conference WiFi), zero runtime dependencies
- Mitigation: dev mode provides live DuckDB query capability for exploration and client calls

**Dev mode with live queries (restricted).** A `/dev/query` endpoint serves tiles generated on-the-fly from DuckDB queries. Restricted to Mini's IP only — returns 404 (not 403) for all other sources so the route doesn't reveal its existence. Useful for ad-hoc exploration during client calls or analysis sessions.

**Separate DuckDB databases per domain.** Each data domain (ERCOT, boundaries, PUCT, elections) gets its own DuckDB file. Each can be regenerated independently. Keeps file sizes manageable for dev mode queries.

**Python pipeline, TypeScript serving.** The GIS ecosystem is dramatically stronger in Python (GeoPandas, Shapely, DuckDB spatial extension, rapidfuzz). The serving layer stays TypeScript/Bun for consistency with all consuming projects.

**Per-project MapLibre components.** Each consuming project owns ~5 files (Map.tsx, MapPopup.tsx, MapFilters.tsx, tiles.ts, and the page route). All heavy lifting is in the tile server. Each project styles maps to its own brand.

## 3. Data Layer

### 3.1 DuckDB Databases

| Database | Contents | Refresh Cadence |
|----------|----------|-----------------|
| `ercot.duckdb` | Interconnection queue, substation locations, fuzzy match results | Weekly (queue updates) |
| `boundaries.duckdb` | County, city, legislative district, GCD boundaries (with vintage/effective_year) | Quarterly |
| `puct.duckdb` | Large load filings, project 58481 data, docket entries | Weekly |
| `elections.duckdb` | Mirror of txelection_db county results + geometry joins | After each election import |

### 3.2 Schema Design: Historical Boundaries

All boundary geometries include a `vintage` field (effective year) from v1. This enables future overlay of redistricting changes without schema migration.

```sql
-- Example: legislative districts
CREATE TABLE state_house_districts (
    district_number INTEGER,
    vintage INTEGER,         -- e.g., 2023 for current maps
    effective_from DATE,
    effective_to DATE,       -- NULL = currently in effect
    party_current VARCHAR,
    member_name VARCHAR,
    geometry GEOMETRY,
    source VARCHAR            -- e.g., 'TX Legislative Council 2023'
);
```

**v1 loads:** 2023 redistricting maps only (88th Legislature, effective for 2024+ elections). Congressional maps from the same cycle.

**Future-state (documented, not built in v1):**
- Historical district boundaries back to 2010 redistricting cycle
- Precinct boundaries by county (change over time — need vintage tracking)
- Overlay/comparison views showing boundary changes between redistricting cycles
- Precinct-level election results (currently county-level only in txelection_db)

### 3.3 Data Sources

| Data | Source | Format | Ingestion Method | Notes |
|------|--------|--------|-----------------|-------|
| ERCOT GIS queue | ERCOT MIS (report 15933) | Excel (.xlsx) | `gridstatus` Python library (`ercot.get_interconnection_queue()`) | ~1,880 projects, ~415 GW. Monthly updates. 35+ standardized columns |
| ERCOT Large Load queue | ERCOT large-load-integration page | PDF/Excel | Manual download + parse | 233+ GW, 70%+ datacenters. Separate from GIS queue |
| Substation locations | HIFLD ArcGIS Hub | CSV/GeoJSON/Shapefile | Direct download from ArcGIS Hub (or Kaggle mirror) | ~4,000-5,000 TX substations at 69kV+. NAME field for fuzzy matching. Last updated Sept 2023 |
| County boundaries | Census TIGER/Line | Shapefile | Direct download | 254 Texas counties |
| City boundaries | Census TIGER Places | Shapefile | Direct download | Incorporated places + CDPs |
| State House districts | TX Legislative Council / Census | Shapefile | Direct download | 150 districts, 2023 vintage |
| State Senate districts | TX Legislative Council / Census | Shapefile | Direct download | 31 districts, 2023 vintage |
| Congressional districts | Census TIGER | Shapefile | Direct download | 38 districts, 2023 vintage |
| GCD territories | TWDB / TCEQ | Shapefile | Direct download | ~100 groundwater conservation districts |
| PUCT filings | PUCT Interchange | Scrape/API | Web scrape | Large load docket entries |
| TX Election results | `txelection_db` PostgreSQL | SQL export | Direct query | 396K county results |

### 3.4 ERCOT Queue Fuzzy Matching

The hardest data engineering piece. Queue entries include a `poi_location` field with values like `"60385 Solstice 138kV"` or `"HORNSBY Substation POIB# 7047"` — structured but not a clean foreign key to any substation table.

**Pre-processing:** Strip voltage levels (138kV, 345kV, 69kV), POIB numbers, and numeric prefixes from `poi_location` before matching. This normalizes `"60385 Solstice 138kV"` → `"Solstice"` for comparison against HIFLD's `NAME` field.

**Approach (replicating Walker's methodology):**
1. Load ERCOT queue entries with `poi_location`, county, and `cdr_reporting_zone`
2. Load HIFLD substation dataset (TX only, 69kV+) with NAME and coordinates
3. Pre-process POI names (strip voltage, POIB#, numeric prefixes)
4. Use `rapidfuzz` for string matching (cleaned POI name → HIFLD NAME)
5. Spatial validation: matched substation must be in the correct county/region (GeoPandas spatial join)
6. Fallback chain: HIFLD match → OSM Overpass query → county centroid
7. Store match confidence score and match source for transparency

**Data source notes:**
- HIFLD dataset: ~4,000-5,000 TX substations, last updated Sept 2023. Available from ArcGIS Hub or Kaggle mirror (CC0 license)
- Texas PUC has 14,000 substations but the data is security-restricted (not usable)
- OSM coverage is partial but can fill gaps where HIFLD is missing newer substations

## 4. Tile Generation

### 4.1 Pipeline Flow

```
Raw data (CSV/Shapefile/Scrape)
  → Python ingestion scripts (GeoPandas + DuckDB Spatial)
    → Processed DuckDB databases (with geometry columns)
      → GeoJSON export (per layer)
        → Tippecanoe (generates PMTiles archives)
          → Static files served by Bun/Hono
            → MapLibre GL JS in consuming projects
```

### 4.2 Tile Layers (v1)

| Layer | Min Zoom | Max Zoom | Key Properties |
|-------|----------|----------|----------------|
| `ercot-queue` | 5 | 14 | project name, MW capacity, technology (SOL/WIN/GAS/BES/etc.), status, POI name, queue date |
| `substations` | 7 | 14 | name, voltage, operator |
| `counties` | 4 | 12 | name, FIPS, population |
| `cities` | 7 | 14 | name, population, incorporation status |
| `state-house` | 5 | 12 | district number, party, member name, vintage |
| `state-senate` | 5 | 12 | district number, party, member name, vintage |
| `congressional` | 5 | 12 | district number, party, member name, vintage |
| `gcd` | 6 | 12 | district name, managing authority |
| `puct-filings` | 6 | 14 | docket number, applicant, MW, status, filing date |
| `election-results` | 5 | 12 | dynamic — joined at generation time per race |

### 4.3 Pipeline Resilience

**Failure isolation:** Each data source is ingested independently. If ERCOT's website is down, the pipeline skips that source and logs a warning — it does not fail the entire run. Existing good PMTiles are never overwritten by a failed run.

**Validation gates between stages:**
1. After ingestion: assert row count > 0 and geometry column has no NULLs
2. After GeoJSON export: assert feature count matches expected range (e.g., ERCOT queue should have 1,500-2,500 entries — alert if outside range)
3. After Tippecanoe: assert PMTiles file size > minimum threshold
4. On any validation failure: keep existing tiles, log error, alert

**Notifications:** Pipeline failures send an alert (email or webhook — TBD based on existing monitoring). For the ERCOT event week, failures should be loud.

**Artifact cleanup:** Pipeline retains only the current and previous generation of PMTiles/GeoJSON. Older artifacts are deleted automatically. Raw source files in `data/raw/` are cleaned after successful ingestion.

### 4.4 Editorial Map Generation (First-Class Capability)

Map images for articles, newsletters, social posts, client reports, and presentations. This is not a byproduct of the tile pipeline — it is a core output of the platform, used more frequently day-to-day than the interactive maps.

**Rendering approach:** Playwright with MapLibre GL JS. A Python script spins up a headless Chromium instance, loads a MapLibre map pointed at the DuckDB data (or PMTiles), applies styling/filters, captures a screenshot. Playwright is already available on the VPS (used by TX Election and iMGA). Simpler and more reliable than `maplibre-gl-native`.

**Two modes of operation:**

1. **CLI — parameterized rendering for automation and scripting:**
```bash
# Article hero: top 50 largest queue projects
python export/render.py --layer ercot-queue --filter "capacity_mw > 200" --zoom 7 --center "31.5,-99.5" --out article-hero.png

# Newsletter map: all battery storage projects
python export/render.py --layer ercot-queue --filter "technology = 'BES'" --style battery-heat --out newsletter-battery.png

# JDKey client report: projects near a specific substation
python export/render.py --layers ercot-queue,substations,gcd --filter "county = 'Williamson'" --zoom 10 --out client-williamson.png

# TX Election: HD-47 margin of victory
python export/render.py --layer election-results --race "2024-general:state-rep-47" --style margin --out hd47-margin.png
```

2. **Dev mode UI — interactive composition from the Mini:**
   - Compose a view on the dev mode map page (toggle layers, set filters, adjust zoom/center)
   - Hit "Export" button → generates PNG at publication-quality resolution
   - Useful for one-off maps during article writing or client calls

**Pre-generated views (auto-refreshed with pipeline runs):**
- "ERCOT Interconnection Queue — [Month Year]" — full Texas, color-coded by technology
- "ERCOT Queue — Large Load Projects Only" — datacenter/industrial filter
- "ERCOT Queue — Battery Storage" — storage-specific view
- Per-layer hero images for social sharing (og:image on map pages)

**Output formats:** PNG (default, web/social), SVG (print/presentations), configurable resolution (1x for web, 2x for retina/print).

**Editorial workflow:** Write article → identify map need → run CLI command or use dev mode UI → drop image into newsletter/article/report. No developer intervention needed once the pipeline is running.

## 5. Serving Architecture

### 5.1 API Routes

```
texas-gis server (Bun/Hono)
├── GET /tiles/{layer}.pmtiles             # PMTiles — MapLibre JS protocol makes range requests directly
├── GET /static/{layer}-{style}.png        # Pre-rendered static exports
├── GET /dev/query                         # Dev mode — live DuckDB queries (Mini IP only)
├── GET /dev/                              # Dev mode — interactive map explorer (Mini IP only)
└── GET /health                            # Health check (process up + PMTiles exist + freshness)
```

**Tile serving approach:** MapLibre GL JS uses the `pmtiles` JS protocol to make HTTP range requests directly against `.pmtiles` files. The server just serves static files with proper range-request support. No server-side tile extraction needed. This is simpler and more cacheable than unpacking individual `{z}/{x}/{y}.pbf` tiles.

### 5.2 Dev Mode Restrictions

- `/dev/*` routes check request source IP against an allowlist (Mini's IP + localhost)
- Non-matching requests receive 404 (not 403) — route existence is not revealed
- Dev mode provides: arbitrary DuckDB spatial queries, on-the-fly tile generation, interactive layer explorer
- Useful for: ad-hoc analysis, client call live demos, data exploration
- **Implementation:** Dev query route shells out to a Python script (DuckDB's single-writer limitation and immature Bun bindings make in-process querying unreliable). The Python script accepts a query, runs it against DuckDB, returns GeoJSON. Low traffic (Mini-only) makes the subprocess overhead irrelevant.

### 5.3 CORS Configuration

The tile server must allow cross-origin requests from all consuming sites. Nginx `Access-Control-Allow-Origin` allowlist:
- `https://hyperscalenews.com`
- `https://www.hyperscalenews.com`
- `https://jdkey.com`
- `https://www.jdkey.com`
- `https://txelectionresults.com`
- `https://www.txelectionresults.com`

Range requests must also be allowed (required for PMTiles): `Access-Control-Allow-Headers: Range` and `Access-Control-Expose-Headers: Content-Range, Content-Length`.

### 5.4 Health Check

The `/health` endpoint verifies:
1. Tile server process is running (trivial — if you can respond, you're up)
2. PMTiles files exist and are non-zero size
3. PMTiles files are not stale beyond expected refresh cadence (checks generation timestamps)

Returns JSON with per-layer status. Integrates with existing monitoring system.

### 5.5 Infrastructure

- **VPS user:** `texasgis` (or `gis` — TBD)
- **Port:** TBD (next available in PM2 lineup)
- **Domain:** `tiles.hyperscalenews.com` — API-only, not user-facing. Map pages live on their respective consuming sites (e.g., `hyperscalenews.com/map`)
- **PM2 process:** `texas-gis`
- **Nginx:** reverse proxy with CORS allowlist (Section 5.3) and range-request headers. Consider serving PMTiles directly from Nginx (`alias`/`root` with `Accept-Ranges: bytes`) instead of proxying through Bun — simpler and eliminates a failure point for static file serving.
- **Tile routes are publicly accessible** — intentional, as browser-side MapLibre needs unauthenticated access. No proprietary data in v1 tile layers (all public sources). If JDKey "opportunity zone" analysis is added later, it must be served through the dev mode restricted route, not public tiles.
- **Dev mode DuckDB access:** Always opened in read-only mode, even for Mini-restricted routes.

## 6. Consuming Project Integration

### 6.1 Hyperscale News (Priority — ERCOT event ~Mar 29)

**New page:** `/map`
- Full-screen ERCOT queue map with filters (technology type, MW range, status, queue date)
- Popups: project name, MW capacity, technology, POI, queue position
- Toggle layers: substations, counties, GCDs, legislative districts, city boundaries
- Color coding: by technology type (SOL/WIN/GAS/BES) or capacity tier
- Mobile responsive — attendees will pull this up on phones at the event
- Editorial map images generated for newsletter editions, X posts, and article headers

**Subscriber hook:** The map page includes a CTA — "Get weekly updates on the ERCOT queue. Subscribe to Hyperscale News." This is the conversion funnel at the event.

**Files added to Hyperscale project (~4 files):**
```
src/components/Map.tsx           # MapLibre wrapper, Hyperscale-styled
src/components/MapPopup.tsx      # ERCOT project detail popup
src/components/MapFilters.tsx    # Fuel type, MW, status filters
src/lib/tiles.ts                 # Tile server URL config
src/app/map/page.tsx             # /map route
```

### 6.2 JD Key Consulting (Second Priority — Post-Event)

- ERCOT queue filtered to datacenter/large-load projects
- Overlay: PUCT filings, GCD territories, city boundaries
- "Opportunity zones" — areas with grid capacity but low queue congestion
- Client-facing: clean, professional, printable

**Primary use case: client engagement proposals and site due diligence reports.** Example: the DCIP engagement proposal includes two Texas site assessments (West Texas/San Angelo and Mustang Ridge/Austin). Each assessment covers ERCOT interconnection feasibility, GCD status, political mapping, and community risk. Custom maps for each site would show:
- ERCOT queue congestion in the area (how crowded is the interconnection pipeline nearby?)
- GCD territory boundaries (which groundwater district governs this site, if any?)
- Nearest substations and POI locations (interconnection options)
- Legislative districts (who are the relevant state reps, senators, and congress members?)
- City/county boundaries (permitting jurisdiction)
- Nearby competing queue projects (competitive landscape)

These maps would be generated via the editorial CLI or dev mode UI, embedded in Word/PDF deliverables. Turns a text-heavy due diligence report into a visually compelling consulting product that justifies premium pricing.

### 6.3 TX Election Results (Third Priority)

- County-level choropleth maps for any race (margin of victory, turnout, party lean)
- Legislative district overlays on county results
- Historical comparison: same geography, different election years
- Integrated into existing analytics pages (`/analytics/trends`, `/analytics/rural-urban`)

## 7. Future State (Not Built in v1)

Documented here for schema/architecture decisions. No implementation work in v1.

### 7.1 Historical Boundary Overlays
- Prior redistricting cycles (2010, 2000) loaded with `vintage` field
- Side-by-side or overlay comparison showing district boundary changes
- Animated redistricting timeline

### 7.2 Precinct-Level Data
- County precinct boundaries (sourced per-county — no statewide standard)
- Precinct-level election results (requires new data ingestion beyond SOS county-level)
- Precinct boundaries change over time — vintage tracking required
- Enormous data volume increase (thousands of precincts vs. 254 counties)

### 7.3 Additional Data Layers
- Texas Ethics Commission lobbyist filings (JDKey Strategy 1 gap analysis — mapped)
- County tax abatement filings / Chapter 312 agreements (JDKey Strategy 3)
- TCEQ permit applications for datacenter-related SIC/NAICS codes (JDKey Strategy 4)
- Transmission line routes and capacity constraints
- Water availability by river basin and aquifer

### 7.4 Hyperscale Article Map
- Location pins for every Hyperscale article/newsletter issue, geocoded to the project/region covered
- Each pin links back to the relevant article(s) on hyperscalenews.com
- Builds over time into a spatial archive of coverage — "what have we written about in this area?"
- Could become a public-facing feature on the Hyperscale site: browse coverage by geography

### 7.5 Cross-Project Features
- Unified search across all layers ("show me everything within 50 miles of Abilene")
- Time-series animation (ERCOT queue growth over months/years)
- Export to GeoJSON/KML for clients who want raw geodata
- Embeddable iframe maps for third-party use

### 7.6 Dev Mode Enhancements
- Saved query library (frequently used ad-hoc views)
- Query sharing (generate a URL for a specific view to share with a client during a call)
- Layer styling editor (adjust colors/sizes without redeploying)

## 8. Timeline

Target: Hyperscale ERCOT map live by ~March 29, 2026.

| Day | Milestone | Risk Mitigation |
|-----|-----------|-----------------|
| 1 | VPS user + project scaffold + install Tippecanoe. Python pipeline: ERCOT GIS queue ingestion via `gridstatus` + county boundaries from Census TIGER. Download HIFLD substation dataset. | Low risk — straightforward setup. Verify ERCOT queue schema matches expectations. |
| 2 | Substation fuzzy matching (rapidfuzz + GeoPandas). Tippecanoe → PMTiles generation. Bun/Hono tile server up at `tiles.hyperscalenews.com`. | **Highest risk day.** Fallback: if fuzzy matching stalls, generate tiles with county-centroid placement for all queue entries. Ship refined matches later. |
| 3 | Hyperscale MapLibre component (`use client` + dynamic import for SSR). Basic ERCOT queue map rendering on `hyperscalenews.com/map`. **Editorial map CLI** — parameterized PNG export working. | Depends on Day 2 tiles existing (even with centroid fallback). CLI export enables pre-event social/newsletter push. |
| 4 | Filters, popups, layer toggles. Legislative districts + GCD + city boundaries ingested and tiled. Generate pre-event marketing images (newsletter, X posts). | Large scope — if boundary data has quality issues (common with TWDB GCD shapefiles), defer GCDs to Day 5 |
| 5 | PUCT filing overlay. Dev mode page (Mini-restricted) with export button. | |
| 6 | Polish, mobile responsiveness, subscriber CTA on map page. **Offline fallback**: generate high-res static image of full queue map as backup for conference WiFi failure. | |
| 7 | Buffer / deploy / smoke test / load test | Must not be consumed by earlier overflows |

JDKey and TX Election integrations follow after the event.

## 9. Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Data pipeline | Python 3.12+, GeoPandas, Shapely, DuckDB (spatial ext), rapidfuzz, gridstatus |
| Data sources | ERCOT MIS (GIS queue), HIFLD (substations), Census TIGER (boundaries), TWDB (GCDs), PUCT Interchange |
| Tile generation | Tippecanoe → PMTiles |
| Tile server | Bun, Hono, pmtiles (JS library). Domain: `tiles.hyperscalenews.com` |
| Map rendering | MapLibre GL JS (in each consuming Next.js project, dynamic import for SSR) |
| Editorial map generation | Playwright + MapLibre GL JS, parameterized CLI + dev mode UI export |
| Dev mode | DuckDB live queries (read-only), on-the-fly tile generation (Python subprocess) |
| Infrastructure | PM2, Nginx (direct PMTiles serving considered), Let's Encrypt SSL |

## 10. Inspiration & References

- Kyle Walker's freestiler: walker-data.com/freestiler — R/Python package for DuckDB → vector tiles → MapLibre
- Walker's ERCOT queue visualization: x.com/kyle_e_walker/status/2035723836058906895 — fuzzy matching queue to substations
- PMTiles spec: docs.protomaps.com/pmtiles — single-file tile archive format
- Tippecanoe: github.com/felt/tippecanoe — vector tile generation from GeoJSON
- ERCOT interconnection queue: public data from ERCOT website
- Census TIGER/Line: census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html
