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
- Exact coordinates are a deliberate VBUOY-002 decision.
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

Before implementation, the project must explicitly choose whether current direction uses a FROM or TO convention, based on the source instrument/data convention. Do not guess.

## 8. Depth profile philosophy

The public product should use a small representative set of depths rather than every possible sensor channel.

The current conceptual target is approximately three depths for selected parameters, but exact depths must be derived from the real buoy/reference data before schema freeze.

## 9. Parameter/unit policy

Likely public parameters include a subset of:
- water temperature;
- dissolved oxygen;
- current speed/direction;
- phycocyanin;
- nitrate;
- wind speed/gust/direction;
- air temperature;
- humidity;
- barometric pressure;
- wave height.

Exact names and units are **not frozen yet**.

VBUOY-001/VBUOY-002 must verify them against real buoy datasets/reference material and then update this contract.

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
