# Active Initiative

**Initiative:** VBUOY-005 — Event Mode  
**Status:** IN PROGRESS — UI INTEGRATED; LOCAL BROWSER UAT REQUIRED
**Planner:** Terra  
**Implementation / verification:** Luna / Codex

## Objective

Add an educational Event Mode where a visitor can watch a synthetic lake scenario develop over time without changing the permanent 10-minute buoy stream.

Initial scenarios:
- Normal
- Storm
- Turnover / mixing
- Harmful algal bloom (HAB-like)

Playback speeds:
- 1×
- 2×
- 5×
- 10×

The experience should feel like “play an event and watch the buoy network respond,” not like a historical replay and not like a forecast.

## Architecture decision

V1 Event Mode is **client-local and deterministic**.

Do **not** create public session tables, session-observation tables, cron jobs, or writable Event Mode API endpoints in VBUOY-005.

Architecture:

```text
Permanent live synthetic network
Supabase, every 10 minutes
          │
          └───────────── unaffected

Browser Event Mode
scenario + deterministic seed
          ↓
shared TypeScript normal generator
          +
scenario forcing model
          ↓
complete 10-minute event timeline in memory
          ↓
play / pause / speed / restart
          ↓
existing map + cards + trend UI
```

Why:
- each visitor is automatically isolated;
- no public write surface is introduced;
- one visitor cannot alter another visitor's session;
- no event rows contaminate permanent history;
- no per-session database growth;
- deterministic scenarios are easier to test and teach.

Refreshing the page ends the Event Mode session. Persistence/shareable sessions are future scope only if there is a concrete need.

## Scenario baseline

Event Mode should **not** pretend to begin from the current live virtual readings.

Each scenario uses a deliberate synthetic baseline chosen to make the phenomenon understandable. The UI must state this plainly, for example:

> Event Mode uses a separate educational scenario. It does not represent current Lake Erie conditions or a forecast.

Use the existing normal generator to establish a plausible baseline, with a short deterministic pre-roll before event forcing begins.

Recommended internal seasonal baselines:
- Normal: representative summer baseline;
- Storm: late-summer / early-fall physical baseline;
- Turnover: stratified late-summer / early-fall baseline so mixing can visibly collapse the profile;
- HAB-like: warm, stable summer baseline.

Do not show the internal baseline date as if it were a real/current event date. Public UI should use relative scenario time such as `Day 1 · 06:20`.

## Time model

All event data keeps the existing **10-minute sensor step**.

Scenario durations:
- Normal: 24 simulated hours — 144 steps;
- Storm: 24 simulated hours — 144 steps;
- Turnover: 48 simulated hours — 288 steps;
- HAB-like: 72 simulated hours — 432 steps.

Playback semantics must be explicit:

- **1× playback = one 10-minute simulated reading per real second**
- 2× = two steps/second
- 5× = five steps/second
- 10× = ten steps/second

This is a playback multiplier, not a claim that 1× equals real time.

Default speed: 5× unless UAT shows a clearer default.

## Session controls

Required:
- choose scenario;
- choose/change playback speed;
- Start;
- Play/Pause;
- Restart;
- Exit Event Mode.

Display:
- active scenario;
- `SYNTHETIC EVENT · NOT CURRENT CONDITIONS`;
- scenario clock;
- progress;
- playback speed.

When Event Mode exits:
- return immediately to the permanent live stream;
- preserve the visitor's selected buoy/parameter where practical;
- refetch latest live data so stale event values never remain on screen.

## Integration with existing explorer

Reuse the existing map, reading cards and Trends UI.

While Event Mode is active:
- all three buoys should update from the event timeline;
- West/Central/East remain selectable;
- reading cards show the current event frame;
- the history chart shows event observations up to the current simulation clock;
- depth comparisons continue to work;
- direction conventions remain unchanged;
- the exact-value table uses event data;
- permanent Supabase polling may continue in the background or pause, but must not overwrite the active event display.

The Event Mode UI must have a visually unmistakable state so event readings cannot be mistaken for the permanent virtual stream.

## CSV behavior

While Event Mode is active, the existing Download CSV action should export the **currently displayed event dataset**, not permanent history.

Add:
- `data_source = synthetic_event`;
- scenario name;
- simulated timestamp/relative scenario time where practical.

Use deterministic filenames, for example:

`central-hab-water-temperature-24h.csv`

Do not write event CSV data back to Supabase.

## Scenario model contract

Implementation details live in `docs/event-mode-contract.md`.

All scenarios must:
- build on the normal generator rather than replace it with unrelated random values;
- evolve gradually;
- keep 69 values per step;
- preserve the same 16 public parameter definitions and channel depths;
- retain buoy-to-buoy variation;
- remain inside conservative physical/simulation safety bounds;
- be deterministic for a fixed scenario/version/seed.

Initial model version: `event-v1`.

### Normal

Normal is the control scenario.

Requirements:
- use the normal generator with no event forcing;
- same catalogue/cadence as other events;
- no deliberate storm, turnover or bloom forcing.

### Storm

Educational pattern:
- pressure falls before/around the peak;
- sustained wind rises;
- gusts rise above sustained wind;
- significant wave height and period respond with lag;
- currents strengthen somewhat;
- mixing increases;
- turbidity may rise moderately and differently by buoy;
- water-column gradient may weaken gradually;
- event then recovers.

Do not make all parameters peak simultaneously.

### Turnover / mixing

Educational pattern:
- begin from visibly stratified water;
- sustained wind/waves increase for a prolonged period;
- vertical temperature gradient collapses gradually;
- deep and surface temperatures converge;
- dissolved-oxygen depth difference narrows / deep oxygen responds to mixing;
- current activity increases;
- mixed state can persist at the end rather than instantly re-stratifying.

The defining acceptance signal is the **loss of vertical temperature gradient**, not simply “high wind.”

### HAB-like

Use “HAB-like” or “bloom-like” language in educational copy; do not imply the simulator diagnoses a real harmful algal bloom.

Educational pattern:
- warm, stable water;
- relatively low wind/wave mixing;
- phycocyanin rises gradually;
- chlorophyll also rises, but not as an identical copy;
- dissolved-oxygen behaviour remains depth-aware;
- turbidity/CDOM may vary modestly but should not be forced to mirror pigments;
- peak develops over many simulated hours, not immediately.

## Spatial behavior

All three buoys share regional forcing but remain distinct.

Event Mode may use small deterministic per-buoy phase/response offsets.

Do not present these offsets as a real forecast of event travel across Lake Erie.

## Determinism

Use stable scenario seeds/versioning for V1 so:
- replaying the same scenario produces the same educational event;
- tests can compare exact output;
- classroom/demo users can discuss the same sequence.

A “new variation” feature is not part of VBUOY-005.

## Long-run / scenario acceptance

Luna must implement a dedicated event acceptance harness, not rely only on component tests.

For every scenario:
- exact 10-minute cadence;
- expected step count;
- exactly 69 finite values per step;
- no duplicate timestamps/channels;
- deterministic rerun equality;
- current/direction/unit conventions unchanged;
- no value outside documented safety bounds;
- all three buoys related but not identical.

Scenario-specific checks should include:

### Normal
- event output equals or closely follows the same normal-generator control for the same seed/baseline;
- no deliberate event forcing signatures.

### Storm
- clear wind increase over baseline;
- gust remains >= wind;
- wave response clearly positive and lagged;
- pressure minimum occurs during the storm envelope, not after full recovery;
- end-state wind/waves recover materially from peak;
- turbidity response is moderate and buoy-specific.

### Turnover
- initial surface-minus-deep temperature gradient >= 3 °C;
- gradient falls to <= 1.5 °C by the mixed phase for each buoy, unless a better validated threshold is justified and documented;
- dissolved-oxygen depth difference moves toward a more mixed profile;
- no instant one-step profile collapse.

### HAB-like
- phycocyanin rises gradually and reaches at least 2× its early baseline in the seeded reference run;
- chlorophyll rises meaningfully but not as a fixed multiple/copy of phycocyanin;
- low-to-moderate wind/wave conditions dominate compared with Storm;
- pigment peak is not reached in the first few simulated hours;
- values stay below established simulator hard bounds.

If implementation evidence shows a threshold above is incompatible with the existing calibrated generator, stop and document the evidence rather than weakening it silently.

## UI acceptance

Desktop 1440×900 and actual 390×840 CSS px:
- scenario chooser is understandable;
- Start/Play/Pause/Restart/Exit work;
- speed can change during playback;
- scenario clock/progress updates correctly;
- map/cards/trends agree at the current event timestamp;
- switching buoys does not reset the event;
- switching parameters does not reset the event;
- no horizontal overflow;
- keyboard/focus controls work;
- event state is visually unmistakable;
- Exit returns to live data without residual event values.

Test at least:
- Storm at 10×;
- Turnover at 5×;
- HAB-like at 10×;
- pause/resume;
- restart;
- mid-session speed change;
- exit-to-live.

## Security / isolation acceptance

- no Event Mode database tables created;
- no event observations inserted into permanent `observations`;
- browser uses no new privileged credential;
- existing anonymous-write rejection still passes;
- scheduler function without token remains 401;
- public API remains read-only;
- permanent scheduler continues advancing normally while an Event Mode session runs.

## Deployment

Cloudflare Pages is Direct Upload.

VBUOY-005 completion requires:
- source committed/pushed;
- production build;
- Direct Upload deployment;
- exact deployment ID recorded in `LIVE-STATE.md`;
- deployed production UAT, not localhost-only UAT.

## Explicit non-goals

- historical event replay;
- real event detection;
- current-condition forecast;
- user accounts;
- persisted/shareable event sessions;
- public Event Mode POST API;
- event database storage;
- intensity/severity selector;
- user-defined physics;
- “new random variation” control;
- using AI to generate event values.

## Ordered implementation

1. Sync `main`; read durable context and event contract.
2. Refactor generator helpers only as needed so normal + event models share catalogue/state logic without duplicating formulas.
3. Implement pure deterministic event engine and scenario envelopes.
4. Add standalone event acceptance harness and scenario tests.
5. Run/fix event-model acceptance before UI integration.
6. Add Event Mode state controller to the explorer.
7. Add scenario chooser and playback controls.
8. Route cards/trends/table/CSV to event data while active.
9. Implement exit-to-live restoration/refetch.
10. Run unit/integration/UI tests and security regression checks.
11. Run local desktop + actual 390 px UAT.
12. Build, deploy to Pages Direct Upload, then repeat production UAT.
13. Update durable context and push final verified handoff.

## Next action

Terra approved a third turnover oxygen approach: initialize a stratified profile, convert saturation to latent freshwater mg/L concentration, mix concentrations conservatively and recalculate public saturation from local temperature. Checkpoint `d155e18` is pushed. Event Mode is integrated; application checks and security probes pass. Complete local desktop/mobile browser UAT before deployment. Current browser automation cannot reach the local Vite server (`ERR_CONNECTION_TIMED_OUT` / `ERR_CONNECTION_REFUSED`); resolve this environment access issue, then continue production deployment and UAT. See latest `LOG.md` entry.
