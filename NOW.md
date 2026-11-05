# Active Initiative

**Initiative:** VBUOY-003 — Public explorer  
**Status:** PARTIAL — IMPLEMENTED; UAT AND REVIEW REMAIN
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


## Implementation handoff — 2026-11-05

Explorer implementation is present, but do not declare VBUOY-003 complete. The browser viewport override requested at 390 CSS px reported 559 CSS px, so the required ~390 px UAT and overflow verification remain open. Desktop-size UAT, all-marker keyboard/focus coverage, and explicit latest-card/chart timestamp agreement still need verification. A seven-day Central temperature view reported 3,024 observations; a separate 24-hour CSV contained 432 data rows, matching the previously displayed 432-row view, but the browser download automation stalled and the exact same-view check should be repeated. Add a focused pagination test with mocked multi-page responses. Recheck the complete acceptance criteria before closure.
