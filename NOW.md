# Active Initiative

**Initiative:** VBUOY-003 — Public explorer  
**Status:** COMPLETE — VERIFIED 2026-11-05
**Planner:** Terra  
**Implementation / verification:** Luna / Codex

## Objective

Turn the verified three-buoy synthetic network into the first genuinely useful public learning experience.

A visitor should be able to:
1. see the three virtual buoys on western Lake Erie;
2. select a buoy from the map or accessible controls;
3. understand its latest measurements without needing scientific background;
4. explore how one parameter changes over 24 h / 3 d / 7 d;
5. understand depth profiles where relevant;
6. download the currently explored data as CSV.

VBUOY-003 is the public **exploration** milestone. It does not implement the public REST/OpenAPI developer API or Event Mode.

## Product hierarchy

The explorer should follow this progression:

```text
Map
 ↓
Choose West / Central / East virtual buoy
 ↓
Latest snapshot
 ↓
Weather / Water / Water quality / Waves & currents
 ↓
Choose a parameter
 ↓
24 h / 3 d / 7 d history
 ↓
Chart + depth series + explanation
 ↓
Download current view as CSV
```

The experience should remain clearly labelled **synthetic / educational** at all times.

## Core interaction

### Map

The map remains the visual anchor.

Requirements:
- clicking a buoy marker selects it;
- keyboard activation of each marker must select it;
- buoy summary controls outside the map must provide an equivalent accessible selection path;
- selected buoy gets a clearly distinct marker/card state;
- selection should not require a page reload;
- default selection: **Central Virtual Buoy** unless implementation evidence suggests a better default;
- keep all three sites visible at normal desktop framing.

The map is not intended to be a GIS application. Avoid unnecessary layers/controls.

### Buoy detail

For the selected buoy show:
- buoy name;
- clearly visible `VIRTUAL · SYNTHETIC` label;
- latest observation timestamp;
- plain-language “Data updates every 10 minutes” statement;
- location/coordinates at a secondary level;
- latest parameter values grouped into understandable categories.

Recommended groups:

**Weather**
- air temperature;
- pressure;
- wind speed;
- gust;
- wind direction.

**Water quality**
- dissolved oxygen saturation;
- phycocyanin;
- chlorophyll;
- CDOM relative signal;
- turbidity.

**Water column**
- water temperature profile at 1 / 4 / 8 m.

**Waves & currents**
- significant wave height;
- mean wave period;
- wave direction;
- current speed/direction at 1 / 4 / 8 m.

Do not surface all 23 channel values as one undifferentiated grid.

### Direction values

For wind, waves and currents show both:
- numeric degrees;
- compass label.

Examples:
- `69° ENE`
- `245° WSW`

Use existing conventions:
- wind/waves: FROM;
- currents: TO.

Provide a short explanation of the convention when the user explores one of these parameters.

### Parameter education

Every parameter should have:
- display name;
- current value/unit;
- one concise “what it measures” explanation;
- one concise “why it matters” explanation;
- depth when applicable;
- relative/non-absolute warning for CDOM.

Do not overstate simulation output as a real environmental diagnosis.

For CDOM, explicitly explain that this V1 value is a **relative synthetic signal**, not an absolute concentration.

## Historical explorer

### Parameter selector

Let the user select one public parameter at a time.

For multi-depth parameters:
- display all relevant depths on the same chart;
- use consistent depth labels (1 m / 4 m / 8 m; DO 1 m / 8 m);
- allow the legend to identify/toggle depths if straightforward.

For direction parameters, avoid misleading ordinary line interpolation across 359°→1°. Either:
- use a circular-aware representation; or
- show points/stepped values with compass labels rather than a conventional continuous line.

Do not silently draw a false 358-degree swing.

### Time ranges

Initial ranges:
- 24 hours;
- 3 days;
- 7 days.

Use the existing synthetic observation history. Do not create a second history store.

The query layer must handle Supabase response limits safely. Implement explicit pagination/batching rather than assuming one query returns all 7-day rows.

### Chart implementation

Prefer a lightweight implementation:
- SVG/Canvas built in-project, or a small dependency;
- do not add a large charting bundle without justification, especially because MapLibre already triggers a bundle advisory.

Chart requirements:
- responsive;
- readable axis labels;
- units;
- timestamps;
- hover/focus values or another accessible exact-value mechanism;
- empty/loading/error states;
- no false smoothing that invents unobserved values.

A simple table/list fallback for exact values is acceptable and useful for accessibility.

## CSV download

Provide **Download CSV** for the currently selected:
- buoy;
- parameter;
- time range.

CSV should include enough context to be independently useful:

```text
buoy_slug
buoy_name
parameter_key
parameter_name
depth_m
value
unit
direction_convention
observed_at
data_source
```

For direction parameters, optionally include the derived compass label as an additional column.

File names should be predictable, for example:

`central-water-temperature-7d.csv`

Do not attempt a whole-database bulk export in VBUOY-003.

## Data-access architecture

VBUOY-003 should use the existing public Supabase read boundary. Do not add privileged browser credentials.

Create a small frontend data module rather than leaving database queries embedded in components.

Expected functions conceptually:
- fetch buoy definitions;
- fetch latest readings;
- fetch parameter catalogue;
- fetch observations for selected buoy/parameter/range with pagination;
- convert degrees to 16-point compass labels;
- generate/download CSV.

If the existing schema cannot support a clean/efficient public query, a small read-only security-invoker view/RPC migration is acceptable, but only if justified. Do not modify generator/write security for explorer convenience.

## Refresh behaviour

The source stream advances every 10 minutes.

The explorer may poll more frequently to notice new data, but UI language must say **data updates every 10 minutes**, not imply that new measurements are produced every minute.

When a new timestamp arrives:
- latest cards should update without page reload;
- if the user is viewing a range containing “now”, the chart should refresh without losing their selection.

## Visual direction

Preserve the existing visual language:
- calm Great Lakes palette;
- editorial/educational rather than utility-dashboard feel;
- generous whitespace;
- restrained use of cards;
- mobile-first readability.

The map + data explorer should become the primary functional content below the existing hero.

Do not copy Hardwater's operational dashboard styling literally; this is a public educational product.

See `docs/explorer-ux.md` for the intended information hierarchy.

## Performance

The existing MapLibre bundle advisory is known.

VBUOY-003 should avoid materially worsening it. If practical without destabilizing the app:
- lazy-load the MapLibre-heavy explorer/map chunk;
- keep chart code lightweight.

Do not make bundle optimization a blocker unless the new explorer causes a meaningful regression.

## Ordered implementation

1. Sync current `main` and read all durable context.
2. Review the VBUOY-002 live schema/read policies and current `LakeMap` implementation.
3. Build typed public-data access helpers with explicit pagination and tests.
4. Refactor map selection into React state; support marker + keyboard + external buoy-card selection.
5. Implement selected-buoy overview with grouped latest measurements.
6. Add parameter educational metadata and direction-compass formatting.
7. Implement the 24 h / 3 d / 7 d historical query + chart.
8. Handle multi-depth series and circular direction parameters correctly.
9. Implement CSV export for current buoy/parameter/range.
10. Add loading, empty and error states.
11. Verify latest data refresh after at least one live 10-minute scheduler advancement if timing permits; if not, safely trigger/read a verified advancement only if consistent with the existing server-only contract.
12. Run focused tests, lint, typecheck, build and `git diff --check`.
13. Perform desktop and 390px-class browser UAT using live synthetic data.
14. Update durable context and push the verified handoff.

## Acceptance criteria

### Map / selection
- all three buoys visible;
- clicking/keyboard-selecting a marker changes the active buoy;
- external buoy selector/card provides equivalent selection;
- active state is obvious;
- no accidental map-only accessibility dependency.

### Latest snapshot
- latest values come from live synthetic Supabase data;
- grouped presentation is understandable;
- all V1 parameters are discoverable;
- wind/wave/current directions show degrees + compass;
- CDOM is clearly marked relative;
- timestamp and 10-minute update cadence are clear.

### History
- 24 h / 3 d / 7 d ranges work;
- paginated querying returns complete expected data;
- depth-aware parameters show the expected depth series;
- direction charts do not create false 359°→0° interpolation;
- changing buoy/parameter/range updates correctly;
- loading/error/empty states are usable.

### CSV
- downloads the current selection only;
- row count matches the fetched current-view dataset;
- timestamps are UTC ISO 8601;
- units/depth/data-source metadata are present;
- filename is deterministic;
- no privileged or internal IDs/secrets leak.

### Security
- browser still uses only the publishable Supabase key;
- browser writes remain rejected;
- generator state and scheduler token remain inaccessible;
- no write/security regression.

### UAT
Desktop and ~390 px mobile:
- map and explorer usable;
- no horizontal overflow;
- charts remain legible;
- controls have usable touch targets;
- keyboard selection/focus works;
- synthetic status remains visible;
- latest data and historical chart agree for overlapping timestamps.

## Explicit non-goals

- public REST/OpenAPI/Swagger developer API (VBUOY-004);
- Event Mode / Normal-Storm-Turnover-HAB controls (VBUOY-005);
- user accounts;
- historical real-buoy replay;
- operational warnings/alerts;
- claiming that the simulated lake state is predictive.

## Known risks

- Direct observation history can exceed Supabase's default per-request row limits; pagination is mandatory.
- Direction variables require circular handling.
- The existing MapLibre bundle is already large.
- Public-read tables should remain intentionally narrow in exposure as the UI grows.

## Next action

Luna syncs `main`, implements this bounded VBUOY-003 public explorer, performs live-data desktop/mobile/accessibility UAT, updates durable context and pushes the standard handoff.


## Implementation handoff — 2026-11-05 (superseded by closure below)

Explorer implementation is present, but do not declare VBUOY-003 complete. The browser viewport override requested at 390 CSS px reported 559 CSS px, so the required ~390 px UAT and overflow verification remain open. Desktop-size UAT, all-marker keyboard/focus coverage, and explicit latest-card/chart timestamp agreement still need verification. A seven-day Central temperature view reported 3,024 observations; a separate 24-hour CSV contained 432 data rows, matching the previously displayed 432-row view, but the browser download automation stalled and the exact same-view check should be repeated. Add a focused pagination test with mocked multi-page responses. Recheck the complete acceptance criteria before closure.


## Terra review — closure pass required (completed below)

Terra reviewed commit `7d1de48ca2f81099ab5e83f4fd753742c7759260` and accepts the implementation direction, but agrees with Luna that VBUOY-003 is **not yet complete**.

The remaining work is verification/fix-only. Do not broaden scope.

### Required closure checks

1. **Exact mobile viewport**
   - verify a true CSS viewport of 390 px wide;
   - the verification method must assert the effective viewport (for example `window.innerWidth === 390`), not merely request a device override;
   - check map, buoy selector, reading groups, chart, controls, exact-values table and CSV button;
   - verify no horizontal overflow.

2. **Desktop pass**
   - verify at a representative desktop viewport (target 1440×900 unless local tooling requires an equivalent);
   - check map selection, grouped readings, parameter/range controls, chart/table and CSV control.

3. **Keyboard/focus coverage**
   - tab to and activate all three external buoy controls;
   - tab to and activate all three map markers;
   - verify visible focus and `aria-pressed`/selection state tracks correctly.

4. **Card ↔ history agreement**
   - choose a parameter/depth whose latest timestamp falls inside the current history range;
   - verify the latest card value and the history/exact-value table contain the same timestamp/value for that channel;
   - record the exact example used.

5. **Same-view CSV verification**
   - for one selected buoy + parameter + range, record the visible history row count;
   - download/export that exact current view;
   - verify CSV data-row count equals the current fetched dataset;
   - verify filename, UTC ISO timestamps, depth, unit, provenance and direction convention where applicable.
   - Browser download automation is not mandatory if a lower-level test plus one real manual/browser click proves the same code path, but the evidence must be explicit.

6. **Pagination regression test**
   - add a focused mocked test that forces at least two pages for one channel and proves `fetchHistory` returns the complete ordered result without duplicates;
   - ideally also cover multiple depth channels so the flatten/sort path is exercised.

7. **Regression gates**
   - rerun tests, lint, typecheck, build and `git diff --check`;
   - rerun the existing public-access/security probe;
   - do not change Supabase schema, scheduler or generator unless a real defect requires it.

### Closure rule

If these checks pass without material product changes, close VBUOY-003 in `NOW.md`/`TASKS.md` and append exact evidence to `LOG.md`.

If any check reveals a defect, make the smallest targeted fix, rerun the affected verification, then close only when the acceptance criteria are satisfied.

## Next action

Luna performs the VBUOY-003 verification/fix-only closure pass above and pushes the final verified handoff.


## VBUOY-003 closure — 2026-11-05

All closure checks passed; VBUOY-003 is complete. The next initiative is for the owner/Terra to choose and plan; do not start VBUOY-004 or Event Mode as part of this pass.

- Actual browser `innerWidth` 390, `innerHeight` 840; document client/scroll widths both 367 CSS px. Inspected map, three selectors, grouped readings, parameter/range controls, chart, educational copy, table and download. Full-page visual inspection passed after enlarging the mobile SVG axis labels; exact-value table remains horizontally scrollable within its own container.
- Desktop actual viewport 1440×900; client/scroll widths both 1418 px. Inspected full layout; selected buoy, parameter/range changes, multi-depth chart, table and CSV control worked. A Central 7-day dissolved-oxygen view returned 2,016 values across two depths.
- Natural Tab and Enter activated West, Central and East in both map and external controls; each showed `:focus-visible` with a solid outline and synchronized both sets of `aria-pressed` states and selected heading.
- Central water temperature at 1 m, `2026-11-05T17:10:00.000Z`, was 11.3019186803057 °C in the exact-value table and 11.30 °C on the latest card.
- Central water temperature / 24 h displayed 432 observations; browser download produced `central-water-temperature-24h.csv` (browser appended `(1)` because a file existed) with 432 data rows, 1/4/8 m depths, °C, ISO UTC timestamps, synthetic provenance and blank direction convention. A unit test also checks TO direction serialization.
- Mocked pagination test returned 1,003 ordered, unique rows across two depths, including 1,001 rows in one channel and requests for ranges 0–999 and 1000–1999.
- `npm test` 3 files / 10 tests; lint, typecheck, build and `git diff --check` passed. Existing MapLibre bundle advisory remains (1,531.27 kB main chunk). Public probe returned 69 latest rows, rejected anonymous insert with 42501 and returned 401 for the unauthenticated function. No infrastructure was changed.
