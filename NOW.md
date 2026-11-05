# Active Initiative

**Initiative:** VBUOY-002 — Virtual buoy network  
**Status:** COMPLETE — VBUOY-002 implementation and live verification finished 2026-11-05
**Planner:** Terra  
**Implementation / verification:** Luna / Codex

## Objective

Create the first live synthetic buoy network: three clearly virtual western Lake Erie buoys, a deliberately small public sensor catalogue, a seeded correlated normal-mode generator, a permanent 10-minute observation stream, and enough synthetic history for later charts/API work.

VBUOY-002 is the data-system milestone. It is **not** the polished public explorer and it does **not** implement Event Mode.

## Reference-data decision

Terra analyzed the three newly supplied cleaned historical exports for reference buoys 189, 191 and 267. The derived evidence is recorded in `docs/generator-reference-analysis.md`.

Key decision:
- use 267 primarily to calibrate physical/weather persistence, profiles, currents and wind/wave behaviour;
- use 189/191 primarily to calibrate water-quality distributions/persistence;
- do not replay historical rows and do not copy raw historical observations into the public project;
- do not force one universal turbidity/phycocyanin relationship across all three virtual buoys.

## V1 public catalogue

### Profile channels
- water temperature at 1 m, 4 m, 8 m — °C;
- current speed at 1 m, 4 m, 8 m — m/s;
- current direction at 1 m, 4 m, 8 m — degrees + compass, **TO** convention;
- dissolved-oxygen saturation at 1 m and 8 m — %.

### Single-depth / surface channels
- phycocyanin at 1 m — µg/L;
- chlorophyll at 1 m — µg/L (explicitly converted from the source kg/m³ field);
- CDOM at 1 m — relative/unitless source scale (`1`), clearly labelled as such;
- turbidity at 2 m — NTU;
- air temperature — °C;
- barometric pressure — hPa;
- wind speed — m/s;
- wind gust — m/s;
- wind FROM direction — degrees + compass;
- significant wave height — m;
- wave mean period — s;
- wave FROM direction — degrees + compass.

V1 deliberately omits nitrate, maximum wave height and humidity. CDOM and chlorophyll are included.

## Generator contract

Implement a seeded stateful generator with a fixed 10-minute simulation step.

The generator should have:
1. a shared regional atmosphere/wave state;
2. a slowly evolving water-column state with seasonal stratification;
3. latent east/north current components, from which public speed + TO direction are derived;
4. buoy-specific offsets/lags/noise so the three sites are related but not identical;
5. persistent DO, phycocyanin, chlorophyll, CDOM and turbidity processes informed by the reference envelopes;
6. deterministic seed support for tests and backfill;
7. idempotent advancement so duplicate invocations do not create duplicate timestamps.

Normal mode is not an incident simulator. It should not deliberately create a major storm, turnover or HAB; those belong to VBUOY-005.

## Data/storage scope

Review and then apply the proposed relational model from `docs/data-api-schema.md`, adding the minimum generator-state support needed for safe scheduled advancement.

Expected live objects:
- `buoys`;
- `parameters`;
- `channels`;
- `observations`;
- generator state/checkpoint table or equivalent;
- RLS/policies for safe public reads and server-only writes.

Do not create Event Mode tables unless a dependency truly requires them now.

## Buoy geography

Create three synthetic sites:
- west;
- central;
- east;

spread along the Essex County side of western Lake Erie, reasonably nearshore and visibly in-water.

The exact coordinates must be selected deliberately and verified in the browser map. Names must clearly communicate that they are virtual/simulated sites; do not imply they are active government/research stations.

## Initial history

Backfill **7 days** at 10-minute cadence using the same generator and a fixed seed before starting the live scheduler. The history is synthetic and exists to make the later explorer immediately useful.

Do not backfill from the historical CSV rows.

## Scheduler direction

Preferred architecture:
- tested TypeScript simulation library;
- authenticated/server-only Supabase Edge Function for advancing the permanent stream;
- Supabase-native scheduling/cron every 10 minutes.

Do not expose an unauthenticated write endpoint merely to make cron easy. Use the least-privilege supported scheduling/auth approach available in the current Supabase environment and document the exact live mechanism in `LIVE-STATE.md`.

If the chosen Supabase scheduler/auth mechanism differs from this recommendation, record why before deployment.

## Ordered implementation

1. Sync current `main`; read all durable context and the generator analysis.
2. Map only the existing foundation files and schema proposal.
3. Finalize migration/schema including synthetic provenance and generator checkpointing.
4. Seed three virtual buoy definitions and the frozen V1 parameter/channel catalogue.
5. Select/visually verify three in-water Essex-side coordinates.
6. Implement the deterministic TypeScript generator as a pure/testable library.
7. Add an accelerated local simulation harness that can emit/inspect 30 simulated days without Supabase.
8. Run the 30-day normal-mode acceptance suite; fix generator behaviour before live deployment.
9. Apply the Supabase migration and directly verify schema/RLS/seed state.
10. Backfill seven synthetic days through a bounded server-side path using the production generator.
11. Deploy the advancement Edge Function.
12. Configure the 10-minute schedule using an authenticated/server-only mechanism.
13. Observe **at least two scheduler-generated ticks** separated by the real 10-minute cadence and verify all three buoys advance exactly once per tick.
14. Add only the minimal map markers/status needed to visually verify the three sites/current timestamps; polished exploration remains VBUOY-003.
15. Run focused tests, lint, typecheck, build, `git diff --check`, desktop/narrow browser UAT and live database verification.
16. Update durable context and push the verified handoff.

## Acceptance checks

### Simulation
- deterministic seeded rerun equality;
- exact 10-minute timestamps;
- no duplicate/NaN/Infinity values;
- values stay inside documented safety bounds;
- normal-mode rate changes broadly resemble the historical reference scale;
- gust >= sustained wind except negligible rounding tolerance;
- current direction ∈ [0, 360);
- wind/wave 30-day correlation is positive and roughly 0.4–0.8;
- buoy series share regional behaviour but are not identical;
- no accidental sustained HAB-like phycocyanin/chlorophyll behaviour or extreme turbidity/CDOM excursions in normal mode.

### Live database
- migrations are applied, not merely authored;
- RLS enabled on exposed tables;
- anonymous/publishable client can read only intended public data;
- browser cannot write permanent observations;
- three virtual buoys and expected channels exist;
- seven-day history is continuous at 10-minute cadence;
- production function advances idempotently;
- at least two actual scheduled ticks are observed and recorded;
- no raw reference CSV rows exist in the production tables.

### UI/UAT
- all three virtual markers are visibly in Lake Erie and not on land;
- synthetic/educational status is visible;
- latest timestamps/values update after scheduler advancement;
- desktop and 390px-class narrow layout remain usable;
- no new horizontal overflow.

## Explicit non-goals

- Event Mode/scenario controls;
- public REST/OpenAPI launch;
- polished charts/parameter education;
- historical-event replay;
- reproducing source QARTOD flags;
- training or claiming a predictive lake model.

## Risks

- Source historical files are incomplete for some seasons/parameters, so avoid overfitting.
- Three million-plus normalized channel observations per year is acceptable for V1 but should be monitored before long-term scale assumptions.
- Supabase cron/Edge Function authentication must not weaken write security.
- Map coordinates must be visually checked rather than inferred from labels alone.

## Current evidence (2026-11-05)

Implementation is on local `main` synced to upstream `68dc5bc3051c7918af9807c7c1610653587fd6c9`. The live schema, V1 catalogue and generator are implemented; seven days of synthetic observations were backfilled. Two real scheduled runs succeeded at `2026-11-05 11:40:00 UTC` and `11:50:00 UTC`, each returning HTTP 200 and committing exactly 69 new rows.

The fixed-seed 30-day simulator and acceptance tests pass. Exact run metrics are in `docs/generator-implementation.md` and `LOG.md`; browser checks at `http://localhost:5175/` confirm all three markers in Lake Erie, synthetic status and a responsive 390px-class layout. `LIVE-STATE.md` records the two scheduled runs and direct security/access probes.

## Next action

Next initiative: VBUOY-003 public explorer.
