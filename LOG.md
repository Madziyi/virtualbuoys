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


### 2026-11-05 — VBUOY-003 partial implementation
- **Changed:** Added selected map markers and external buoy controls, grouped readings, parameter education, lightweight SVG history with depth series and circular-safe direction points, paginated public reads, exact-value table, and current-view CSV. No database migration or security change.
- **Verification:** `npm test` 3 files / 9 tests passed; lint, typecheck, build and diff check passed. Build retains MapLibre large-chunk warning (1,531.25 kB main chunk). Live public-access probe returned 69 latest rows across three buoys, rejected anonymous insert (42501), and unauthenticated function returned 401.
- **UAT evidence:** Central live 24-hour temperature view showed 432 rows; 7-day view showed 3,024 rows. A downloaded 24-hour CSV had 432 data rows. Keyboard Enter selected West via external control and East via marker. Browser viewport override requested 390 px but reported 559 px; no horizontal overflow at 559 px. Complete desktop/~390px UAT, all controls, card/chart matching and repeat same-view download verification remain open.
- **Live state:** Read-only checks only; no deployment, schema, configuration or generator changes.
- **Known issues:** UAT and focused pagination coverage are incomplete; do not mark initiative done. Browser download automation stalled.
- **Next action:** Finish the outstanding verification in NOW.md, fix any findings, then close VBUOY-003.


### 2026-11-05 — Terra review of VBUOY-003 partial handoff
- **Review:** Resynced GitHub at `7d1de48ca2f81099ab5e83f4fd753742c7759260` and reviewed the implementation/data layer. The architecture remains within scope: public publishable reads only, paginated history helper, lightweight SVG chart, external + map buoy selection, grouped readings, education and CSV export.
- **Accepted evidence:** 3 files/9 tests, lint/type/build/diff pass; live 69-row public read; anonymous write rejection; 401 unauthenticated function call; Central temperature returned 432 rows for 24 h and 3,024 for 7 d; partial keyboard and CSV evidence.
- **Not accepted as closure:** Requested 390 px emulation reported 559 CSS px; desktop/full keyboard coverage, explicit card↔history value agreement, exact same-view CSV proof and mocked multi-page pagination coverage remain incomplete.
- **Code-review note:** `fetchHistory` implements per-channel 1,000-row paging and then flattens/sorts depth channels, but the current tests do not exercise a second page. Closure requires that regression test.
- **Decision:** Keep VBUOY-003 active. Next pass is verification/fix-only; do not move to VBUOY-004 until the remaining acceptance checks pass.


### 2026-11-05 — VBUOY-003 verification and closure
- **Changed:** Added mocked pagination and CSV tests; enlarged SVG axis labels on narrow screens and anchored the end date so the mobile chart remains readable. No other product scope added.
- **Verification:** `npm test`: 3 files, 10 tests passed; `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` passed. Build retains MapLibre large-chunk advisory (1,531.27 kB). Mocked two-depth read crossed the 1,000-row boundary and returned 1,003 unique, ordered rows.
- **Mobile UAT:** Effective viewport `innerWidth=390`, `innerHeight=840`; client width = scroll width = 367 px. Inspected full-page map, selectors, grouped readings, controls, chart, education, table and CSV.
- **Desktop/accessibility UAT:** Effective viewport 1440×900; client = scroll width = 1418 px. Full-page layout inspected; buoy and parameter/range selection, chart, table and download control verified. Tab and Enter activated all three external controls and all three map markers, with visible focus and synchronized `aria-pressed`/heading state.
- **Agreement:** Central water temperature, 1 m, `2026-11-05T17:10:00.000Z`: history value 11.3019186803057 °C and card 11.30 °C after display rounding.
- **CSV:** Same Central water-temperature 24 h view showed 432 rows and generated a 432-row CSV named `central-water-temperature-24h.csv` (download collision suffix `(1)`); verified UTC ISO timestamps, depths 1/4/8 m, °C, synthetic source and empty direction convention. Unit test covers current direction TO metadata.
- **Live state/security:** Public probe: 69 latest rows, all three buoys, anonymous observation insert rejected with 42501, unauthenticated function 401. No schema, scheduler, generator or deployed-function changes.
- **Known issues:** Existing MapLibre build size advisory and external map tile dependency.
- **Next action:** Owner/Terra selects and plans the next initiative.


### 2026-11-05 — VBUOY-003 accepted + VBUOY-004 public API planning
- **Review:** Terra resynced GitHub at `2205c28516f01a59fc9ff11a0d405be9463ecb26` and accepted the VBUOY-003 closure. True 390×840 and 1440×900 UAT, complete keyboard coverage, exact card/history agreement, same-view 432-row CSV verification, mocked >1,000-row pagination and security regression checks are all recorded as passed.
- **Decision:** Move to VBUOY-004 before Event Mode. The next milestone is a beginner-friendly read-only REST API over the same synthetic dataset, with OpenAPI 3.1 as the checked-in contract and an interactive public playground.
- **API direction:** Stable `/v1` routes for health, buoys, buoy detail, latest, bounded observations and parameter metadata. Observation requests are capped at seven days and support simple `hours` or explicit `start/end` ranges plus optional depth.
- **Security:** API is GET/OPTIONS only; no public write surface, no scheduler token, no generator state, no exposed privileged credentials. VBUOY-006 still owns advanced abuse/rate-limit hardening.
- **UX:** Existing API navigation should lead to a useful playground with copyable curl, JavaScript and Python examples. Heavy Swagger/OpenAPI UI should be lazy-loaded if practical.
- **Next action:** Luna executes VBUOY-004 from `NOW.md` and `docs/public-api-contract.md`.


### 2026-11-05 — VBUOY-004 partial implementation
- **Changed:** Implemented read-only public-api Edge Function and bounded per-channel pagination, structured errors, CORS and caching; checked-in OpenAPI 3.1; lazy Swagger UI and examples. No Event Mode or schema changes.
- **Live:** Deployed public-api version 2, verify_jwt false for intentionally public access; function internally uses the anonymous key. All three buoys, 16 parameters, latest readings, direction conventions, CDOM, errors, OPTIONS and POST rejection passed. Central 24 h/72 h/168 h returned 432/1,296/3,024 ordered multi-depth readings.
- **Security:** Publishable client observation insert rejected (42501), generator_state inaccessible, scheduler function without token 401.
- **Verification:** 5 test files / 14 tests passed; lint, typecheck and build passed before subsequent dependency audit adjustments. Swagger is lazy loaded; build reports large chunks. Browser Try It Out health request returned 200; explorer loaded latest and 432 history rows.
- **Open UAT:** Requested viewport 390x840 reported actual innerWidth 582/clientWidth 559; no claim of true 390 CSS-pixel UAT. Desktop and mobile full visual review and examples scrolling remain to be completed.
- **Known issues:** Initial npm production audit reported 8 vulnerabilities (2 high) in Swagger/transitive dependencies and YAML; check follow-up audit and resolve. Contract tests do not yet comprehensively compare all live response schemas.
- **Next action:** Complete effective 390 CSS-pixel UAT, resolve/check dependency advisories, complete contract and security review, then rerun final checks and update this handoff.

- **Dependency follow-up:** `npm audit fix` removed high advisories; 14 total remain (2 low, 12 moderate), including Swagger transitive deepmerge/minimatch. Do not use force without review.


### 2026-11-06 - Hardwater-inspired visual refinement
- **Changed:** Replaced the promotional hero with a map-first dashboard; adopted Hardwater-inspired white canvas, cool panel surfaces, blue actions, rounded outlines and Google Sans. Kept synthetic labels, map, readings, history, CSV and API playground. No backend changes.
- **Browser:** Desktop layout visually inspected with live data. At actual 390 x 840 CSS pixels, document client/scroll widths both 375 pixels; West selection updated map and readings, history returned 432 observations, and the API playground loaded without page overflow.
- **Live state:** No deployments or infrastructure changes. VBUOY-004 remains partial pending its outstanding contract/security and dependency reviews.
- **Checks:** After an initial concurrent run timed out in two simulation tests and identified an ambiguous text assertion, corrected the assertion and reran the suite without competing checks: 5 files / 14 tests passed. Lint, typecheck, build and diff check passed. Build retains large-chunk advisory.


### 2026-11-06 - Trends chart refinement
- **Changed:** Replaced the small SVG history chart with a Hardwater Trends/Compare-inspired Recharts chart, same-unit depth series legend, dashed grid, time ticks and hover values. A ten-minute grid preserves gaps. Direction uses unconnected colored points on a 0-360 scale; CSV and exact-value table remain.
- **Verification:** 6 test files / 15 tests passed, including depth alignment and missing intervals. Lint, typecheck, build and diff check passed. Build retains large chunk advisory; main bundle increased with Recharts. Installation reported 14 dependency advisories (2 low, 12 moderate), previously outstanding.
- **Browser:** Desktop 1440 CSS pixels: seven-day temperature comparison displayed three depths and 3,024 rows. Mobile 390 x 840: current direction displayed three colored point series, 3,024 rows, and client/scroll widths both 375 pixels after fixing tooltip overflow. No backend or live configuration changes.
- **Next action:** Continue VBUOY-004 contract/security review and dependency follow-up.


### 2026-11-09 - Depth-grouped buoy readings
- **Changed:** Reorganized the selected buoy readings into weather/surface and 1/2/4/8 m depth sections, with individual interactive mini-cards and parameter icons inspired by Hardwater. Each card opens the existing parameter trend; unavailable readings display a dash. No backend or live configuration changes.
- **Verification:** 7 files / 16 tests passed, including depth grouping, direction formatting and card selection; lint, typecheck, build and diff check passed. Build retains existing large-chunk advisory.
- **Browser:** Desktop 1440 x 900: West selection and card values inspected. Mobile actual 390 x 840: 8 m oxygen card selected the oxygen trend; document client/scroll widths both 375 pixels.
- **Next action:** Continue outstanding VBUOY-004 contract/security and dependency review.


### 2026-11-09 - API playground presentation
- **Changed:** Added a plain-language explanation of the API, guided first request, synthetic-data context, copy feedback and a clearer layout. Scoped Swagger styling fixes the compressed heading and labels the request group. No API behavior or live configuration changed.
- **Browser:** Desktop 1440 x 900: the GET /v1/buoys Try it out request returned HTTP 200 with all three buoys. Mobile 390 x 840: guidance and open playground inspected; client and scroll widths both 375 pixels.
- **Next action:** Continue outstanding VBUOY-004 contract/security and dependency review.
- **Checks:** 7 files / 16 tests passed; lint, typecheck, build and diff check passed. Build retains the existing large-chunk advisory.


### 2026-11-09 - Navigation labels
- **Changed:** Removed About from the header and renamed the API link Access The Data; its destination remains the API section. Added a narrow-screen spacing adjustment.
- **Verification:** App tests 2 passed; diff check passed. No backend or live changes. VBUOY-004 remains partial.


### 2026-11-09 — Terra review after navigation/presentation polish
- **GitHub:** Verified `main` at `e9277cf9f0a9999e2bc6378a094683b1edc035a7` (`Update navigation labels`).
- **Accepted:** Recent UI/presentation work is pushed and local app checks passed; API function remains live from prior VBUOY-004 work.
- **Deployment status:** Frontend is still not deployed. Cloudflare Pages remains the selected but unconfigured hosting direction in `LIVE-STATE.md`.
- **Decision:** Keep VBUOY-004 active. Local tests are not sufficient for closure.
- **Remaining:** OpenAPI/live-contract comparison, security regression + built-asset secret scan, production dependency audit review, frontend deployment, and production-origin desktop/390px UAT including Swagger Try It Out.
- **Next action:** Luna performs the VBUOY-004 closure/deployment pass from `NOW.md`.


### 2026-11-09 - VBUOY-004 deployment and closure
- **Synced:** GitHub `main` at `129d73fa52df2da900fe26a6d6f3fa11fdfd1e38` before the pass.
- **Contract:** `openapi-spec-validator` 0.7.2 validated OpenAPI 3.1. Corrected per-route error declarations and documented the 16 parameter keys and UTC-only timestamp syntax. `scripts/check-openapi-live.py` validated 17 live responses, schema references and documented 200/400/404 status cases; POST/PUT/PATCH/DELETE/HEAD 405 and OPTIONS 204 passed. The 500 handler was reviewed in source, not induced in production.
- **Security:** Anonymous observation insertion failed with 42501; generator state inaccessible; scheduler function without token returned 401. Build scan found no service-role JWT, secret-key/private-key/AWS-key patterns or locally available privileged values; it cannot prove absence of unknown secret values. Frontend build used only project URL and publishable key.
- **Audit:** Production `npm audit --omit=dev`: 5 affected packages, 3 moderate and 2 low; 0 high/critical. Swagger is direct; swagger-client, apidom-reference, minimatch and deepmerge are transitive. A suggested Swagger downgrade is breaking and was not applied. Runtime relevance and advisory links are documented in `docs/dependency-audit-vbuoy-004.md`.
- **Deployment:** Cloudflare Pages Direct Upload project `virtual-buoys`, production `main`; deployment ID `5315abf1-3c0d-4220-a65c-7a99af9aad7f`, https://virtual-buoys.pages.dev/ (immutable https://5315abf1.virtual-buoys.pages.dev/). Built `dist/` locally using only public URL/publishable key; no Pages environment variables configured. Direct Upload does not automatically deploy Git pushes and cannot be converted to Git integration.
- **Production UAT:** Desktop 1440 x 900, client/scroll widths 1425/1425: map, West selection, 24h temperature trend and 432-row CSV at depths 1/4/8 verified. Actual mobile 390 x 840, widths 375/375: Explore and Access The Data navigation, East selection, oxygen trend and 288-row CSV at 1/8 m verified. Swagger Try It Out GET /v1/buoys returned 200 with three buoys from deployed origin; guidance and examples visible, JavaScript copy showed Copied. No console warnings/errors observed; no full network capture available, though map tiles, data reads and API requests succeeded.
- **Checks:** `npm test` 7 files / 17 tests; lint, typecheck, build and diff check passed. Build retains large-chunk advisory.
- **Status:** VBUOY-004 complete; Event Mode not started. Next action: owner/Terra reviews closure and chooses the next initiative.


### 2026-11-09 - AI integration chooser
- **Changed:** Added a native accessible modal in Access The Data with ChatGPT, Gemini and Claude icons, an editable high-school-friendly prompt containing the live read-only API contract and synthetic-data caveats. ChatGPT/Claude receive the prompt in URL query links; Gemini opens with clipboard/paste and manual-copy fallback. Provider sign-in or changes to undocumented web prefill can affect behavior; provider-side prefill was not verified.
- **Verification:** `npm test`: 8 files / 19 tests passed; lint, typecheck, build, diff check and built-asset secret scan passed. Desktop and actual mobile 390 x 840 local modal inspected; prompt copy and Escape dismissal worked, mobile document client/scroll widths 375/375. Published deployment dialog and destination URLs verified in browser; no external chat was submitted.
- **Live:** Pages Direct Upload deployment `f767120b-8a23-4405-8438-b041fb48069c`, https://f767120b.virtual-buoys.pages.dev/; production https://virtual-buoys.pages.dev/. Built from `943488d` plus uncommitted feature changes now captured in this handoff commit. Existing large-chunk advisory remains.
- **Next action:** Owner reviews the chooser; no Event Mode work started.


### 2026-11-09 — AI chooser accepted + VBUOY-005 Event Mode planning
- **Review:** Terra resynced GitHub at `204a5a4378a94efb7f135bd48c4cb0c88a0f7830`. VBUOY-004 is already complete and the owner-requested AI integration chooser is committed, deployed and recorded in live state. No Event Mode work existed yet.
- **Architecture decision:** VBUOY-005 Event Mode will be client-local and deterministic rather than creating public session tables/writes. Permanent Supabase observations and the VBUOY-004 API remain untouched.
- **Scenarios:** Normal (24 h), Storm (24 h), Turnover (48 h) and HAB-like (72 h), all at the existing 10-minute sensor cadence and same 69-channel catalogue.
- **Playback:** 1× means one 10-minute event frame per real second; 2×/5×/10× are playback multipliers. The UI must say this is playback speed, not real-time speed.
- **Science/education:** Event scenarios use the existing normal generator plus smooth deterministic forcing. Turnover is defined by gradual loss of vertical temperature gradient; HAB-like by gradual pigment increase under warm/stable/low-mixing conditions; Storm by pressure/wind/wave/mixing evolution with lag/recovery.
- **Isolation:** No VBUOY-005 database schema, cron or public API write routes. Reload ends the event. Event output is labelled `synthetic_event`.
- **Verification:** Dedicated event-model harness and scenario-specific acceptance tests are required before UI/deployment.
- **Next action:** Luna executes VBUOY-005 from `NOW.md` and `docs/event-mode-contract.md`.

### 2026-11-09 — VBUOY-005 partial event-model attempt
- **Synced:** `main` at `9d02c5d856e18c1f8938cf70e68e2d7ed3885e50`; no prior uncommitted changes.
- **Prototype:** Added a deterministic in-memory event timeline built on the existing generator and catalogue, with scenario overlays, pre-roll and an accelerated acceptance suite. It is unintegrated and unaccepted; the permanent generator and live infrastructure were not changed.
- **Acceptance:** `npx vitest run src/simulation/event.acceptance.test.ts` first failed normal control equality (unintended chlorophyll forcing, subsequently corrected) and turnover oxygen mixing. After replacing fixed oxygen offsets with symmetric mixing toward the instantaneous normal-generator profile, the second run passed 7 of 8 tests but still failed turnover oxygen narrowing: initial depth difference `0.4864035804775284`, final `0.9056475754318285` percentage points for a seeded buoy. Other passing tests include deterministic reruns, 69-channel cadence/bounds, exact normal control, storm recovery and lag, turnover temperature thresholds, and HAB-like pigment checks; this is not complete scenario acceptance.
- **Hypothesis/decision:** The independently evolving normal oxygen profile can start nearly mixed and later diverge enough to defeat a fixed fractional overlay. Decide whether to establish a deliberately stratified oxygen baseline and evolve event-specific mixed state, or otherwise define and validate a physically defensible mixing criterion. Do not weaken the stated acceptance threshold silently. The first fixed-offset and second instantaneous-proportional mixing approaches are materially different focused attempts; stop under the failure-budget rule.
- **Not done:** No UI integration, browser UAT, security regression, deployment, or production verification. Existing production deployment remains unchanged. Typecheck passed; see handoff for other verification.

### 2026-11-09 — VBUOY-005 turnover oxygen model revision
- **Decision:** Terra approved the third approach: represent turnover oxygen internally as freshwater dissolved-oxygen concentration (mg/L), initialize a stratified saturation profile, convert with the documented temperature polynomial and pressure scaling, mix concentrations conservatively toward their common mean, and recalculate public saturation at local temperature. No public channel or storage field is added.
- **Changed:** Replaced the failed saturation percentage offsets in the turnover scenario with the latent concentration approach. Updated acceptance to compare initial/mixed three-hour windows, including temperature gradient, saturation gap, concentration gap reduction, bounded frame changes and finite values. Updated `NOW.md`, `SIMULATION-CONTRACT.md`, and `docs/event-mode-contract.md` with the decision.
- **Verification:** `npx vitest run src/simulation/event.acceptance.test.ts`: 1 file, 8 tests passed across all scenarios and turnover criteria.
- **Next:** Continue VBUOY-005 UI integration, full regression/security checks, desktop/mobile UAT, deployment, and production verification. No UI integration or deployment has yet been done.

### 2026-11-09 — VBUOY-005 engine checkpoint and explorer integration
- **Checkpoint:** Commit `d155e18` (`feat: add deterministic event scenario engine`) pushed to `main` before UI work. Contains engine, acceptance harness, and model decision context. Initiative remains in progress.
- **UI:** Added scenario selection, start/play/pause/restart/exit, speed changes, relative event clock/progress, clear synthetic-event labels, selected-buoy readings and progressive event history/table, and event CSV metadata. Client event state is in memory only; event frames do not call write APIs. Exit drops the timeline, fetches live latest values and restores live history loading.
- **Verification:** Full `npm test`: 9 files / 27 tests passed; lint, typecheck, production build and `git diff --check` passed. Build has existing >500 kB chunk advisories.
- **Security:** `npm run check:public-access` passed: 69 permanent latest rows, anonymous observation insert rejected (42501), generator state inaccessible, scheduler endpoint without token 401. No SQL/schema, API or scheduler source was changed. Event code is client-only with no Supabase write call. Full live OpenAPI script could not run: base Python lacks `openapi_spec_validator`, and the previously referenced isolated interpreter path is absent.
- **UAT/deployment:** Local browser UAT is blocked because CUA cannot reach the local Vite server (browser reported timed out/refused). Therefore no claim of desktop/mobile UI acceptance, no Cloudflare upload, and no production UAT. Existing deployment remains unchanged. Complete local browser UAT first; then deploy and verify production.

### 2026-11-09 — VBUOY-005 preview, production UAT and closure
- **UI checkpoint:** `b135d3f` (`feat: integrate event mode UI (UAT pending)`) was pushed before UAT. Event Mode remains marked in progress until this verified closure.
- **Preview:** Local production build served via Vite preview could not be reached by the browser and command-line HTTP probe was blocked by socket permissions. Following the bounded fallback, deployed Cloudflare Pages non-production branch `event-mode-preview`: final preview deployment `bfb6c0e2-e9b7-4b6b-8b1e-88cbfc79d20a`, https://event-mode-preview.virtual-buoys.pages.dev/. Preview UAT revealed the initial frame clock showed 00:00 for 00:10 observations; corrected the display to label each frame's actual simulated time and rebuilt/redeployed preview.
- **Preview UAT:** Desktop browser viewport 1440×900, document client/scroll width 1425/1425. Mobile viewport `innerWidth=390`, `innerHeight=840`, document widths 375/375. Verified Normal Start; Storm 10×, pause/resume, restart, changing speed while playing, and switching buoy and parameter without resetting; Turnover 5×; HAB-like 10×; visible synthetic warning; scenario clock/progress; keyboard tab reached the home link with visible solid focus. No console errors or warnings. Central Turnover water temperature at 8 m: card `18.93 °C`, exact table `18.927490281503037 °C` at event time Day 1 · 00:50 / `2026-08-15T00:50:00Z` (rounding agrees).
- **CSV:** Production CSV download for Central / Storm / water temperature at Day 1 · 00:10 contained 3 observation rows (one frame × depths 1/4/8 m) plus header. Verified `data_source=synthetic_event`, `scenario=storm`, `simulated_at=2026-08-15T00:10:00.000Z`, buoy, parameter, depths and °C unit. Preview full completed East/Storm timeline export contained 432 rows (144 frames × 3 depths).
- **Production deployment:** Cloudflare Pages Direct Upload to production branch `main`; deployment ID `927e9198-6303-421c-8611-12324c5b7066`, immutable https://927e9198.virtual-buoys.pages.dev/, public https://virtual-buoys.pages.dev/. Wrangler deployment listing confirmed Production/main and reported source `b135d3f`. Public site served the new UI.
- **Production UAT:** Repeated Storm 10×, Turnover 5× and HAB-like 10×, plus mobile Storm playback, pause/resume, speed setting, scenario clock, clear warning, event CSV and exit. Actual viewports 1440×900 and 390×840; client/scroll widths 1425/1425 desktop and 375/375 mobile. Exit removed event banner and returned Central latest synthetic data at `2026-11-09 21:30` local time; 69 current latest rows remained readable. Browser console error/warning list empty.
- **Isolation/security:** Anonymous observation insert rejected with `42501`; generator state inaccessible; unauthenticated scheduler invocation 401. Live public API GET returned 200 and POST returned 405. No DB migrations, tables, public API changes or scheduler changes were part of the commits; event session exists in browser memory only. Production build secret scan found only expected public URL/publishable key and no privileged patterns/available local secret values. Scheduler remained independently active; post-exit production latest readings were current. No event rows are sent to Supabase.
- **Regression:** Full `npm test`: 9 files / 27 tests, including all 8 event acceptance tests. Lint, typecheck, production build and `git diff --check` passed. Existing >500 kB chunk advisory remains. No full OpenAPI validator rerun (VBUOY-005 did not change the API contract).
- **Status:** VBUOY-005 complete. Next initiative remains VBUOY-006; no VBUOY-006 work was included.
- **Final source-aligned upload:** After committing verified source and durable evidence as `3722058`, rebuilt clean `main` and uploaded production deployment `a0241678-509f-4d69-8392-09be37c30d06` (Wrangler confirmed Production/main, source `3722058`). Reopened production at actual 390×840, confirmed Event Mode controls and `Day 1 · 00:10`, then exited; synthetic-event banner disappeared and the Central live stream returned with latest observation `2026-11-09 21:30` local time. Widths remained 375/375. This is the final production state.


### 2026-11-09 — VBUOY-005 accepted + VBUOY-006 hardening planning
- **Review:** Terra resynced GitHub at `aaaf77ab22352f3b9f2c37fe665fe122cc66b735` and accepted VBUOY-005 closure. Final production deployment `a0241678-509f-4d69-8392-09be37c30d06` is recorded in `LIVE-STATE.md`; source-aligned production smoke returned cleanly to the permanent stream.
- **VBUOY-006 decision:** No new major feature. The next initiative hardens the completed product through a 365-day normal-generator run plus extra seeds, direct 72-hour production-stream/scheduler soak verification, API request-budget/abuse resistance, and broader accessibility/responsive/reduced-motion UAT.
- **API direction:** Prefer strict bounded inputs, cheap rejection, upstream timeouts and controlled burst testing. Do not add a misleading per-instance in-memory rate limiter. Distributed per-client quotas may remain future scope if no reliable low-complexity native mechanism is available.
- **Soak direction:** Use the real permanent stream already accumulated since VBUOY-002 rather than waiting days for a new soak. Any real gap must be investigated, not silently backfilled.
- **Accessibility direction:** Add focused automated regression where practical, then verify 320/390/768/1440 widths, keyboard/focus, dialog focus restoration and reduced-motion behaviour.
- **Deployment:** Only redeploy surfaces whose bytes/runtime changed; Direct Upload remains authoritative for frontend deployment.
- **Next action:** Luna executes VBUOY-006 from `NOW.md` and records exact evidence in `docs/vbuoy-006-hardening.md`.

### 2026-11-11 — VBUOY-006 buoy display polish (partial)
- **Changed:** Added a relative “Updated … ago” label beside the selected buoy title; removed the duplicate synthetic badge, latest-observation paragraph and coordinates from that detail header; put Trends behind a collapsed-by-default “Explore The Trends” disclosure; changed the map's letter pins to labeled dots for West, Central and East.
- **Preview:** Cloudflare Pages preview deployment `20d98908-8e2c-495c-9b6b-eb649f927879` at https://20d98908.virtual-buoys.pages.dev/. Browser check showed the relative age beside the buoy title, no removed header metadata, the collapsed trend control and all three named map dots. Opening the disclosure exposed the existing chart/history controls.
- **Production:** Cloudflare Pages production deployment `8d45abf1-2b83-48f2-afae-80d179a28dfe` at https://8d45abf1.virtual-buoys.pages.dev/. Wrangler confirmed Production/main and source `ae88cad`; browser confirmed named map dots and the title update age. Live readings loaded after the initial loading state.
- **Verification:** `npm run typecheck`, `npm run build`, and `git diff --check` passed. The build retains the existing >500 kB chunk warning. Tests and lint were not run for this visual-only change.
- **Responsive/UAT limit:** The local browser could not reach Vite. The deployed browser viewport was about 522×509, so the required VBUOY-006 1440×900 and true 390px checks, horizontal-overflow measurement, keyboard/reduced-motion checks and console/network audit remain outstanding. VBUOY-006 remains in progress; this change does not close the initiative.
- **Next:** Continue the active VBUOY-006 hardening plan; complete its full responsive/accessibility UAT matrix before recording that work complete.
