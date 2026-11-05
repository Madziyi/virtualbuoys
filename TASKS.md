# Tasks

States:
- `[ready]`
- `[in-progress]`
- `[blocked]`
- `[done]`
- `[deferred]`

## In progress

None.

## Ready

- **VBUOY-002** `[ready]` — Virtual buoy network: three western Lake Erie virtual buoys, verified public parameter schema, correlated normal generator, 10-minute permanent observations.
- **VBUOY-003** `[ready]` — Public explorer: map, buoy detail, parameter explanations, depth profiles, charts, CSV download.
- **VBUOY-004** `[ready]` — Public REST API + OpenAPI/Swagger playground + Python/JS/curl examples.
- **VBUOY-005** `[ready]` — Event Mode: isolated Normal/Storm/Turnover/HAB simulations at 1×/2×/5×/10×.
- **VBUOY-006** `[ready]` — Hardening: accelerated multi-day simulator tests, normal-cadence soak testing, API abuse controls, responsive/accessibility UAT.

## Blocked

None currently. Supabase target verification is part of VBUOY-001.

## Done

- Shared Terra/Luna durable-context bootstrap authored.
- **VBUOY-001** `[done]` — Foundation: React/TypeScript/Vite shell, Supabase client and direct project verification, MapLibre setup, test/lint/type/build baseline, real-data-informed schema/API proposal, desktop and narrow UAT, and durable evidence.

## Deferred

- Dedicated Python/FastAPI service — only introduce if later requirements justify it.
- Historical event replay — intentionally excluded from current public concept.
- Mini challenges/gamification — intentionally excluded from current scope.
