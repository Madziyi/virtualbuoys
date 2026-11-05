# Simulation Contract

This document defines the behavioural and public-data contracts for Virtual Buoys.

It is intentionally conservative at bootstrap. Exact scientific parameter ranges, units, depths and response relationships must be verified before implementation.

## 1. Synthetic-data identity

All project observations are synthetic.

Every permanent observation and event-session observation must be distinguishable from real-world measured data.

The UI and API must clearly identify the product as simulated/educational data.

## 2. Permanent public network

- Exactly three initial virtual buoys.
- Western Lake Erie, Essex County side.
- Reasonably nearshore but spatially separated.
- Implemented VBUOY-002 coordinates: west `42.025, -82.960`; central `41.985, -82.720`; east `41.930, -82.490`. All three were visually verified in Lake Erie at `http://localhost:5175/`.
- Permanent observations publish every 10 minutes.
- Permanent stream continues independently of Event Mode.

## 3. Event Mode isolation

Event Mode is not historical replay.

A visitor selects a scenario and gets an isolated simulation session.

Starting an event must not:
- alter the permanent 10-minute public stream;
- change another visitor's session;
- rewrite permanent historical observations.

Initial scenarios:
- Normal
- Storm
- Turnover
- HAB

Initial speed choices:
- 1×
- 2×
- 5×
- 10×

The simulation clock must be explicit in the UI/API so accelerated time is never confused with wall-clock time.

## 4. Normal-mode generation philosophy

Do not independently randomize each field every 10 minutes.

Each value should evolve from state:

```text
previous value
+ slow environmental trend
+ daily/seasonal component where relevant
+ small stochastic variation
+ buoy-specific spatial effect
+ physically plausible cross-parameter relationships
```

Normal data should:
- change smoothly;
- remain inside verified plausible bounds;
- preserve meaningful differences among the three buoys;
- avoid unexplained discontinuities;
- retain reproducibility in tests through deterministic seeds where useful.

## 5. Event evolution

Events must evolve over simulated time.

Do not make all values jump at scenario start.

Conceptual relationships to validate before coding:

### Storm
Potentially includes:
- pressure fall/rise pattern;
- wind increase;
- gust increase;
- wave response;
- mixing response;
- spatial propagation between buoys.

### Turnover / mixing
Potentially includes:
- stronger sustained wind/waves;
- weakening vertical temperature gradient;
- convergence of temperatures across depths;
- dissolved-oxygen profile response.

### HAB
Potentially includes:
- warm/stable conditions;
- slower-changing phycocyanin response;
- appropriate DO behaviour;
- spatial/temporal differences rather than instant uniform bloom.

These are hypotheses for implementation planning, not yet validated parameter equations.

## 6. Public wind representation

Public API/UI should expose wind in human-friendly form:

```json
{
  "speed": 6.3,
  "speed_unit": "<verified unit>",
  "direction_deg": 69,
  "direction": "ENE"
}
```

Users should not need to combine U/V vectors.

Meteorological convention:
- direction means where wind comes FROM;
- clockwise from true north;
- 0°/360° N;
- 45° NE;
- 90° E;
- 135° SE;
- 180° S;
- 225° SW;
- 270° W;
- 315° NW.

69° is approximately ENE.

Raw U/V fields may be exposed later under an advanced namespace if useful.

## 7. Water current representation

Public current data should ultimately expose:
- speed;
- direction in degrees;
- compass label;
- depth.

VBUOY-002 decision: public current direction uses the **TO** convention because it is derived directly from eastward (`u`) and northward (`v`) velocity components. Bearing is clockwise from true north: `(atan2(u, v) × 180/π + 360) mod 360`. This is a derived public representation, not a claim about a separate source direction sensor.

## 8. Depth profile philosophy

The public product should use a small representative set of depths rather than every possible sensor channel.

VBUOY-002 uses three **virtual design depths** for water temperature and current: **1 m, 4 m and 8 m**. Dissolved-oxygen saturation is exposed at **1 m and 8 m**. These are deliberately simple educational profile levels informed by the available multi-depth source data; they are not claims that every historical reference buoy used exactly those three sensor positions.

## 9. Parameter/unit policy

VBUOY-002 freezes the initial public catalogue to:
- water temperature at 1/4/8 m — °C;
- dissolved-oxygen saturation at 1/8 m — %;
- current speed at 1/4/8 m — m/s;
- current TO direction at 1/4/8 m — degrees + compass;
- phycocyanin at 1 m — µg/L;
- chlorophyll at 1 m — µg/L, explicitly converted from source kg/m³;
- CDOM at 1 m — relative/unitless source scale (`1`), presented with a plain-language note that it is not an absolute concentration;
- turbidity at 2 m — NTU;
- air temperature — °C;
- barometric pressure — hPa;
- wind speed/gust — m/s;
- wind FROM direction — degrees + compass;
- significant wave height — m;
- wave mean period — s;
- wave FROM direction — degrees + compass.

Nitrate, maximum wave height and humidity are intentionally omitted from V1. CDOM and chlorophyll are included because the full 189/191 historical exports provide enough evidence to generate persistent, buoy-specific synthetic series.

## 10. Long-run acceptance philosophy

Simulation verification should include accelerated long runs.

Checks should include:
- exact/expected cadence;
- no duplicate/missing timestamps without deliberate fault injection;
- plausible min/max values;
- rate-of-change sanity;
- stable ingestion under sustained writes;
- deterministic test mode;
- inter-parameter relationship sanity;
- spatial differences across buoys;
- event onset/progression/recovery;
- UI/API agreement.

Unit tests alone are insufficient for simulator acceptance.

## 11. Reference-data findings (VBUOY-001)

The owner supplied `latest_observations_by_buoy_rows.json` and it was inspected before drafting the data model. It contains 53 rows from reference buoy IDs 2, 4 and 6, with source channel/parameter IDs, source parameter names, depth, unit, value, measurement timestamp and a QARTOD flag.

The export includes water temperature in K at depths spanning 0–8 m (one buoy) and 1.2/2 m (another); eastward and northward current velocity in m/s at 1–9 m; dissolved-oxygen saturation in % at 1, 2.2, 8.5 and 9.5 m; phycocyanin in ug/L at 1.2 m; chlorophyll in g/L at 1.2 m; turbidity in NTU; air temperature in K; pressure in Pa; wind direction in degrees; wind speed/gust in m/s; and wave height, period and direction channels.

This was the initial VBUOY-001 candidate inventory. VBUOY-002 subsequently reviewed the cleaned historical reference exports for buoys 189, 191 and 267; the resulting frozen V1 public catalogue, depths, units, and derived current convention are recorded in §9 and the reference analysis below. Source IDs and raw quality flags are not copied into synthetic production observations.

The implemented permanent schema in `docs/data-api-schema.md` uses depth-aware channels. Event/session observation storage remains later scope and must remain isolated from the permanent stream.


## 12. Full historical calibration analysis (VBUOY-002 planning)

Terra analyzed cleaned historical exports for reference buoys 189, 191 and 267 on 2026-11-05. Derived evidence, hashes, robust ranges, persistence, rate-of-change checks and generator implications are recorded in `docs/generator-reference-analysis.md`.

Implementation rules from that analysis:
- use 267 primarily for physical/weather/current/wave dynamics;
- use 189/191 primarily for water-quality distributions and persistence;
- source data informs calibration only; do not replay/copy historical rows into production;
- build normal mode as a persistent state process;
- three buoys share regional forcing but use independent offsets/lags/noise;
- do not assume strong turbidity/phycocyanin/chlorophyll/CDOM/wind correlations are universal across sites;
- validate the normal generator with a deterministic accelerated 30-day run before live scheduling.
