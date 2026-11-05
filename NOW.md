# Active Initiative

**Initiative:** VBUOY-001 — Foundation  
**Status:** CONTEXT BOOTSTRAPPED — LOCAL FOUNDATION IMPLEMENTATION NEXT  
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

## Current blocker / verification boundary

The project owner supplied Supabase project ID `dbsuryesimzatxhznurh`, but Terra's current connector could not independently authenticate to that Supabase project. Therefore its existence/configuration must be verified by Luna before `LIVE-STATE.md` treats it as live fact.

## Next action

Luna syncs `main`, reads all durable context, verifies the Supabase target, performs the bounded VBUOY-001 foundation implementation, runs the required local/browser checks, updates context, and pushes a verified handoff.
