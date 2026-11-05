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
