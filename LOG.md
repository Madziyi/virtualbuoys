# Project Log

Append concise entries. Do not rewrite history except to correct factual errors.

Suggested format:

```text
### YYYY-MM-DD — <task / decision>
- Changed:
- Decisions:
- Verification:
- Simulation/UAT:
- Live state:
- Known issues:
- Next action:
```

---

### 2026-11-04 — Virtual Buoys project bootstrap
- **Changed:** Established the shared Terra/Luna durable-context system for the new public Virtual Buoys project.
- **Decisions:** Separate GitHub/Supabase product from Hardwater; three synthetic western Lake Erie buoys; 10-minute permanent stream; public map/explorer; CSV; public REST/OpenAPI playground; isolated Event Mode rather than historical replay; initial Normal/Storm/Turnover/HAB scenarios; 1×/2×/5×/10× simulation speeds.
- **Data UX:** Public wind direction will be directly available as degrees + compass label using meteorological FROM convention. Users will not be required to reconstruct direction from vector components.
- **Scientific caution:** Exact sensor list, depth levels, units and current-direction convention are not frozen until checked against real buoy/reference data.
- **Verification:** GitHub repository `Madziyi/virtualbuoys` was verified as a new public repository with default branch `main`.
- **Live state:** Supabase project ID `dbsuryesimzatxhznurh` was supplied by the owner, but Terra's connector could not independently authenticate to it; Luna must verify it before live facts are recorded.
- **Next action:** Luna executes VBUOY-001 from `NOW.md`, including local foundation setup, Supabase verification, test/build/UAT baseline and durable handoff.

### 2026-11-05 — VBUOY-001 Foundation
- **Changed:** Synced the new repository to `main` at `2239de1d1ca94caa4501a6c171a41e40392638d7`; created the React 19 / TypeScript 6 / Vite 8 app shell, MapLibre preview and Vite-bundled worker, environment-based Supabase client, test/lint/type/build baseline, REST reachability script, setup documentation and un-applied schema/API proposal.
- **Data evidence:** Inspected the owner-provided 53-row `latest_observations_by_buoy_rows.json` export for reference buoy IDs 2, 4 and 6 before documenting candidate parameters. Source units, channel depths, asynchronous timestamps and QARTOD raw values are preserved as evidence; exact public catalogue, unit normalization, QARTOD meanings, station metadata, depth convention and current direction remain unresolved.
- **Decisions:** No live schema was applied. Cloudflare Pages is a source-level static-hosting direction only. Public sensor names/depths/units are not frozen. No simulator, scheduler, Event Mode or public API implementation was added.
- **Verification:** `npm test` — 1 file, 2 tests passed; `npm run lint` — pass; `npm run typecheck` — pass; `npm run build` — pass, including `dist/assets/maplibre-gl-worker-Br3j0JGE.js` (Vite reports the main minified chunk at 1,497.61 kB and emits its >500 kB advisory); `npm run check:backend` — Supabase REST HTTP 404 `PGRST205` for the absent proposed relation, confirming gateway reachability without creating schema; `.env.local` is ignored; staged and unstaged `git diff --check` — pass.
- **Browser UAT:** User-provided localhost port `5175`; desktop viewport 1440×900 and narrow viewport 390×840 CSS pixels. Shell headings, map card, Supabase configured state, CTA anchor navigation and MapLibre map-ready/canvas verified. Document scroll width equalled client width at narrow size (365 CSS px; no horizontal overflow). Initial MapLibre worker load issue was fixed by the official Vite `?worker&url` setup; after reload the map reached ready state and rendered its canvas. The fallback map intentionally has no basemap or buoy markers.
- **Live state:** Supabase project `dbsuryesimzatxhznurh` is `ACTIVE_HEALTHY` in `us-west-2`, PostgreSQL `17.11`, API `https://dbsuryesimzatxhznurh.supabase.co`; direct read-only SQL returned `postgres` at `2026-11-05 05:20:18.925459+00 UTC`, and `public` had zero tables. REST probe was repeated successfully from the authorized local environment; no objects were written. Publishable client key stays in ignored `.env.local` and is not recorded.
- **Known issues:** MapLibre's minimal fallback style renders a blank water-colored canvas until VBUOY-002 selects a basemap; no exact buoy positions are represented. The Vite production build has a large-chunk advisory from bundling MapLibre. No npm audit was run.
- **Next action:** Start VBUOY-002 planning; resolve reference station/channel metadata, QARTOD meanings, unit normalization, depth convention, current direction and buoy coordinates before generating observations.


### 2026-11-05 — VBUOY-002 planning + full historical calibration review
- **Reference data:** Terra analyzed the newly supplied cleaned historical files for buoys 189 (443,976 rows), 191 (469,737 rows) and 267 (31,303 rows). Raw files were not committed; SHA-256 identifiers and derived evidence are recorded in `docs/generator-reference-analysis.md`.
- **Key evidence:** 267 is predominantly 10/20-minute synchronized physical/weather data and shows strong persistence, wind↔wave correlation ~0.62 and air↔surface-water temperature correlation ~0.84. 189/191 provide asynchronous water-quality histories with strongly persistent temperature/DO/phycocyanin/turbidity but site-specific cross-variable relationships.
- **Decisions:** V1 public profile depths are virtual 1/4/8 m for temperature/current and 1/8 m for DO. Current direction is derived as a **TO** bearing from east/north velocity components. Public units are normalized for accessibility (°C, hPa, m/s, %, µg/L, NTU, m, s). CDOM/chlorophyll/nitrate/max-wave-height/humidity are omitted from V1.
- **Generator direction:** Seeded stateful semi-empirical process; shared regional forcing + buoy-specific offsets/lags; 10-minute fixed step; 7-day synthetic backfill; no historical replay. A deterministic accelerated 30-day run is required before deployment.
- **Live plan:** VBUOY-002 will apply/verify the relational schema, deploy a server-only advancement function, configure authenticated Supabase-native 10-minute scheduling and observe at least two real scheduler ticks before closure.
- **Next action:** Luna executes the VBUOY-002 plan in `NOW.md`.


### 2026-11-05 — VBUOY-002 catalogue amendment: CDOM + chlorophyll
- **Owner decision:** CDOM and chlorophyll remain in the V1 public buoy catalogue rather than being deferred.
- **Historical evidence:** Full cleaned 189/191 exports contain substantial CDOM and chlorophyll histories. CDOM is strongly persistent at 10-minute aggregation (lag-1 ~0.90 at 189, ~0.86 at 191). Chlorophyll lag-1 persistence is ~0.73 at 189 and ~0.86 at 191.
- **Calibration ranges:** CDOM median/p95 is 0/2 at 189 and 1/1 at 191 on the source relative/unitless scale. Chlorophyll median/p95 is approximately 2.2/5.9 µg/L at 189 and 3.5/8.5 µg/L at 191 after explicit conversion from source kg/m³.
- **Public representation:** chlorophyll = µg/L at 1 m; CDOM = relative/unitless source scale (`1`) at 1 m with clear explanatory labelling. Do not present CDOM as an absolute concentration without better source metadata.
- **Generator:** both become persistent buoy-specific normal-mode processes; do not make them deterministic proxies for phycocyanin or turbidity.

### 2026-11-05 — VBUOY-002 implementation + verification
- **Synced:** Fast-forwarded `main` to GitHub `Madziyi/virtualbuoys` commit `68dc5bc3051c7918af9807c7c1610653587fd6c9` after GitHub preflight confirmed it was current `main` and the authorized target repository. No pre-existing local changes were present.
- **Changed:** Implemented the V1 schema/migrations, 3 virtual buoy rows, 16-parameter/69-channel catalogue, shared TypeScript seeded normal generator, 30-day acceptance harness, Supabase advancement Edge Function, authenticated Cron/Vault scheduling, 7-day synthetic backfill, and a minimal MapLibre status/readings preview. No Event Mode or full explorer/API playground was built.
- **Reference evidence:** Calibrated V1 choices to the supplied cleaned historical exports for reference buoys 189/191/267 (hashes and derived evidence: `docs/generator-reference-analysis.md`). V1 uses temperature/current profiles at virtual 1/4/8 m, DO saturation 1/8 m, and source-supported parameters/units. Chlorophyll kg/m³ → µg/L conversion is explicit; CDOM remains a relative `1` scale. No historical source rows or IDs were copied into production.
- **Generator evidence:** `npm run simulate:30d` passed for seed `20261105`, start `2026-07-01T00:00:00Z`, 30 days: 4,320 unique timestamps per buoy, exact 10-minute cadence, 298,080 finite values, deterministic rerun, gust ≥ wind, valid current speed/direction, maximum temperature step 0.0457551 °C. Wind/wave correlation 0.6146785; west/central surface-temperature correlation 0.9365179; stations differ. Rate p90s: air 0.1430863 °C, wind 0.2450490 m/s, gust 0.7302041 m/s, significant wave 0.0343142 m, water temperature 0.0173750 °C. Water-quality p95s: phycocyanin 2.1295796 µg/L, chlorophyll 3.6081568 µg/L, CDOM 0.8957099 (relative), turbidity 2.4683553 NTU; maxima remained under non-incident limits.
- **Live state:** Migrations `20261105112335/vbuoy_002_network` and `20261105112730/vbuoy_002_scheduler_auth` confirmed in `supabase_migrations.schema_migrations`. Direct query at 11:50:11 UTC: 3 buoys, 16 parameters, 69 channels, 69,759 observations, 69 latest-view rows, 1,011 complete timestamps from 2026-10-29 11:30 UTC to 2026-11-05 11:50 UTC, no channel gaps or incomplete timestamps. RLS enabled on five public tables. The initial 1,009-step history was synthetic only.
- **Scheduler evidence:** Active GMT Cron `*/10 * * * *`; runs at 2026-11-05 11:40:00.093234 and 11:50:00.159271 UTC both succeeded; `pg_net` response IDs 1/2 returned HTTP 200 without error or timeout. Each tick added exactly 69 values. Deployed Edge Function version 2 validates a dedicated Vault-backed token; no-token call returned 401. Publishable-client probe read the intended 69 latest rows/3 slugs; browser-like observation insert was rejected with `42501`.
- **Verification:** `npm test` — 2 files/7 tests passed; `npm run lint` — pass; `npm run typecheck` — pass; `npm run build` — pass (66 modules; existing MapLibre bundle advisory, main chunk 1,522.48 kB); `npm run simulate:30d` — pass; `git diff --check` — pass. The direct public-client probe passed with approved network access after the restricted shell initially failed DNS resolution.
- **Browser UAT:** Local `http://localhost:5175/` showed MapLibre ready and West/Central/East markers in Lake Erie, synthetic status, latest data, and automatic one-minute refresh from 11:40 to 11:50 UTC. Desktop map/cards fit without overflow. At the tested 390px-class narrow viewport, map and cards stacked vertically, all three markers remained available, and there was no horizontal overflow. Viewport restored after UAT.
- **Known limitations:** Generator is a semi-empirical educational process, not a validated/predictive lake model. Map tiles depend on OpenStreetMap network access. Build still emits the large MapLibre chunk advisory. Cloudflare Pages, polished explorer, public API playground, and Event Mode are future work.
- **Next action:** VBUOY-003 public explorer.


### 2026-11-05 — VBUOY-002 review + VBUOY-003 public explorer planning
- **Review:** Terra resynced GitHub at `e671927c27a08e5c58a27056366faf59c8544088`, reviewed the VBUOY-002 implementation commit and durable live-state evidence. The handoff is accepted: generator, schema, seven-day history, RLS/write boundary, secured cron/function and two real ten-minute ticks are documented and verified by Luna.
- **VBUOY-003 decision:** The next milestone is the public explorer, not the API or Event Mode. The map becomes selectable; selected-buoy readings are grouped into Weather, Water quality, Water column, and Waves & currents rather than exposed as one 23-channel wall.
- **History UX:** One parameter at a time with 24 h / 3 d / 7 d ranges, complete paginated reads, multi-depth series where applicable, circular-safe direction visualization and exact-value accessibility.
- **Education:** Every parameter gets concise “what it measures” and “why look at it” copy. Wind/waves display FROM direction, currents display TO direction, and CDOM remains explicitly relative.
- **Download:** VBUOY-003 adds deterministic CSV export for the currently selected buoy + parameter + range. Public REST/OpenAPI remains VBUOY-004.
- **Security:** Explorer continues to use only publishable public reads. Generator/scheduler/write boundaries are not loosened for UI convenience.
- **Next action:** Luna executes VBUOY-003 from `NOW.md` and `docs/explorer-ux.md`.
