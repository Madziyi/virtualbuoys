# Tasks

States:
- `[ready]`
- `[in-progress]`
- `[blocked]`
- `[done]`
- `[deferred]`

## In progress

- **VBUOY-003** `[in-progress]` — Public explorer: interactive buoy selection, grouped live readings, parameter education, 24h/3d/7d history charts, depth profiles and current-view CSV download.

## Ready

- **VBUOY-004** `[ready]` — Public REST API + OpenAPI/Swagger playground + Python/JS/curl examples.
- **VBUOY-005** `[ready]` — Event Mode: isolated Normal/Storm/Turnover/HAB simulations at 1×/2×/5×/10×.
- **VBUOY-006** `[ready]` — Hardening: accelerated multi-day simulator tests, normal-cadence soak testing, API abuse controls, responsive/accessibility UAT.

## Blocked

None currently.

## Done

- Shared Terra/Luna durable-context bootstrap authored.
- **VBUOY-001** `[done]` — Foundation: React/TypeScript/Vite shell, Supabase client and direct project verification, MapLibre setup, test/lint/type/build baseline, real-data-informed schema/API proposal, desktop and narrow UAT, and durable evidence.
- **VBUOY-002** `[done]` — Three synthetic western Lake Erie buoys, evidence-informed 16-parameter/69-channel V1 schema, seeded correlated normal generator, seven-day backfill, secured Supabase cron/Edge Function stream, two directly verified scheduled ticks, map/status preview, 30-day acceptance and desktop/narrow UAT. The final commit SHA is in the handoff.

## Deferred

- Dedicated Python/FastAPI service — only introduce if later requirements justify it.
- Historical event replay — intentionally excluded from current public concept.
- Mini challenges/gamification — intentionally excluded from current scope.

- VBUOY-003 implementation is partial: finish desktop and ~390 px mobile UAT, all-marker keyboard/focus checks, same-timestamp card/chart comparison, same-view CSV count verification, and pagination tests before closure. See NOW.md.
