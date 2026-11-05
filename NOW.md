# Active Initiative

**Initiative:** VBUOY-001 — Foundation
**Status:** COMPLETE — FOUNDATION VERIFIED
**Planner:** Terra
**Implementation / verification:** Luna / Codex

## Objective

Establish the technical foundation for Virtual Buoys without prematurely building the simulator.

VBUOY-001 should leave the project with a working local frontend/backend connection, verified Supabase target, basic deployment path, and a deliberately defined public data/API schema ready for VBUOY-002.

## Current scope

1. Sync and inspect the new repository.
2. Verify the supplied Supabase project `dbsuryesimzatxhznurh` from Luna's local/authorized environment.
3. Establish the initial React + TypeScript + Vite frontend if the repository is otherwise empty.
4. Add MapLibre and the minimal app shell only if required for the foundation.
5. Configure Supabase client access using environment variables; never commit secret values.
6. Define the first database/API schema proposal for:
   - virtual buoys;
   - parameters/channels;
   - permanent 10-minute observations;
   - later isolated simulation sessions.
7. Verify actual parameter names/units from the available real buoy reference datasets before freezing the public sensor schema.
8. Establish initial local test/lint/type/build commands.
9. Decide the hosting/deployment path before deploying.
10. Update durable context with exact verified facts.

## Explicit non-goals for VBUOY-001

- No full synthetic physics engine.
- No HAB/turnover/storm implementation.
- No production scheduler yet.
- No public API launch yet.
- No visual polish beyond a minimal shell.
- No invented final sensor units/depths.
- No Hardwater database linkage.

## Decisions already made

- This is a completely separate public/synthetic product from Hardwater.
- Three virtual buoys.
- Permanent public stream updates every 10 minutes.
- Event Mode is isolated and session-based, not historical replay.
- Event speeds: 1×, 2×, 5×, 10×.
- Initial event concepts: Normal, Storm, Turnover, HAB.
- Public wind direction = degrees + compass label.
- Meteorological wind direction uses FROM convention.
- Public users should not have to combine U/V wind vectors.
- OpenAPI playground is part of the product direction.
- Keep V1 on React/TypeScript/Supabase unless evidence supports additional services.

## Verification expectations

Luna must run:
- focused tests;
- lint;
- TypeScript;
- production build;
- `git diff --check`;
- basic desktop + narrow browser UAT for the shell;
- direct Supabase project verification before recording live facts.

## Completion evidence

- Synced `main` at `2239de1d1ca94caa4501a6c171a41e40392638d7` before implementation.
- Direct Supabase verification: project ACTIVE_HEALTHY, region us-west-2, PostgreSQL 17.11, API URL recorded in `LIVE-STATE.md`, and zero `public` tables at verification time.
- Inspected the owner-supplied 53-row reference export before drafting the sensor/API schema. Candidate units/depths are captured with caveats; no final catalogue is frozen.
- React/TypeScript/Vite shell, optional MapLibre style bootstrap, Supabase env client, test/lint/type/build baseline and Cloudflare Pages source-level deployment direction are implemented.
- Browser UAT at `http://localhost:5175/`: 1440×900 desktop and 390×840 CSS-pixel narrow layout, no horizontal overflow, Explore anchor navigation, Supabase configured label, and MapLibre canvas/map-ready state. Focused tests (2/2), ESLint, TypeScript, production build, staged/unstaged `git diff --check`, and direct REST reachability probe pass; probe returns expected 404 because the proposed relation has not been created.

## Explicit non-goals remain

- No simulator, permanent observation generator, Event Mode, public API implementation, schema migration or deployment.

## Next action

Start VBUOY-002 planning from the inspected reference data. Resolve station/channel metadata, QARTOD flag meanings, parameter subset, unit normalization, depth convention, current direction and buoy coordinates before generating observations.
