# Generator reference-data analysis

**Purpose:** Convert the owner-supplied historical buoy exports into reproducible design constraints for VBUOY-002 without copying the raw historical observations into the public synthetic-data project.

The three CSVs were analyzed by Terra on 2026-11-05. They are not committed because they are large source/reference datasets; this document preserves the useful derived evidence.

## Files analyzed

| Reference file | Rows | Time range (UTC) | SHA-256 |
| --- | ---: | --- | --- |
| buoy 189 cleaned | 443,976 | 2024-06-18 to 2026-06-17 | `cea2163516d6e7e6bb2f3f770b619358b11a26baee26a5e5232a578afbe400eb` |
| buoy 191 cleaned | 469,737 | 2024-06-18 to 2025-10-15 | `f464e6f0e60b1a50b4e873d092859146c7a6fe87713884079b099f0d621191a3` |
| buoy 267 cleaned | 31,303 | 2024-06-18 to 2025-10-28 | `952b91a92bf2b3595acaa7435d15b5fcca5e8f3c68669e0ffb95c25271e353ca` |

## Structural finding

The datasets should not be treated identically.

**189 and 191** are asynchronous/sparse sensor streams: a row often contains only one populated parameter. Individual channels report at different cadences. Typical source-channel intervals are roughly:
- temperature and dissolved-oxygen sensors: ~3.5 minutes;
- CDOM/phycocyanin: ~8.5 minutes;
- chlorophyll/turbidity: ~20 minutes.

**267** is substantially more synchronized and is the best empirical reference for the 10-minute virtual network. Its unique-timestamp interval is:
- 10 minutes for 22,706 intervals;
- 20 minutes for 8,152 intervals;
- larger gaps much less often.

The public product should still emit one coherent virtual observation set every **10 minutes**. It should not reproduce the source systems' asynchronous transport behaviour.

## What each dataset should inform

### Reference 267 — regional physical/weather dynamics

267 contains:
- air temperature;
- barometric pressure;
- wind speed, gust and FROM direction;
- significant/max wave height, mean wave period and wave FROM direction;
- 9 water-temperature profile channels;
- 8 eastward + 8 northward current-velocity channels.

This makes it the primary calibration reference for:
- persistence and rate of change;
- wind/wave relationship;
- seasonal water-column stratification;
- current-speed scale;
- shared regional physical forcing.

Selected robust empirical ranges:

| Quantity | Median | 5th percentile | 95th percentile |
| --- | ---: | ---: | ---: |
| air temperature | 21.13 °C | 10.94 °C | 26.17 °C |
| wind speed | 3.51 m/s | 0.82 m/s | 7.34 m/s |
| wind gust | 4.86 m/s | 1.50 m/s | 10.11 m/s |
| significant wave height | 0.259 m | 0.054 m | 0.921 m |
| wave mean period | 3.07 s | 1.40 s | 5.88 s |
| shallow water temperature proxy | 21.88 °C | 12.56 °C | 25.53 °C |
| mid water temperature proxy | 21.59 °C | 12.50 °C | 25.02 °C |
| deep water temperature proxy | 20.46 °C | 12.01 °C | 24.35 °C |
| shallow current speed proxy | 0.081 m/s | 0.019 m/s | 0.250 m/s |
| mid current speed proxy | 0.079 m/s | 0.019 m/s | 0.261 m/s |
| deep current speed proxy | 0.064 m/s | 0.016 m/s | 0.209 m/s |

Useful measured relationships:
- wind speed ↔ significant wave height correlation: **~0.62**;
- wind speed ↔ maximum wave height correlation: **~0.64**;
- air temperature ↔ shallow water temperature correlation: **~0.84**;
- July shallow-minus-deep temperature gradient median: **~4.65 °C**, 95th percentile **~10.22 °C**;
- the same gradient is near zero in September and October, supporting an explicitly seasonal stratification model.

Typical absolute changes during consecutive 10-minute source intervals:
- air temperature: median 0.07 °C; p90 0.26 °C;
- wind speed: median 0.19 m/s; p90 0.56 m/s;
- gust: median 0.31 m/s; p90 0.94 m/s;
- significant wave height: median 0.009 m; p90 0.039 m;
- shallow water temperature: median 0.012 °C; p90 0.050 °C.

Lag-1 persistence at 10-minute resolution is very high:
- wind speed ~0.976;
- significant wave height ~0.995;
- shallow water temperature ~0.9997.

**Implication:** the normal generator should be a persistent state process, not independent random samples.

### References 189 and 191 — water-quality behaviour

Both contain:
- two water-temperature sensors;
- two dissolved-oxygen saturation sensors;
- phycocyanin;
- turbidity;
- chlorophyll;
- CDOM.

For the V1 public subset, phycocyanin and turbidity are especially useful because they are intuitive water-quality parameters and have enough historical coverage.

Robust source evidence:

| Quantity | Buoy 189 | Buoy 191 |
| --- | --- | --- |
| phycocyanin median | 0 µg/L | 0 µg/L |
| phycocyanin p95 | 7.1 µg/L | 5.3 µg/L |
| turbidity median | 3.4 NTU* | 0.4 NTU* |
| turbidity p95 | 10.5 NTU* | 7.1 NTU* |
| selected water-temp median | 23.3 °C | 23.2 °C |
| selected dissolved-oxygen saturation median | 115.3% | 111.5% |

`* NTU` is supported by the previously inspected source metadata; the CSV column itself uses a dimensionless-looking `(1)` label.

At 10-minute aggregation, these variables remain strongly persistent:
- temperature ~0.9996–1.000;
- dissolved-oxygen saturation ~0.995–0.996;
- phycocyanin ~0.94–0.95;
- turbidity ~0.95–0.99 where enough consecutive data exists.

Cross-variable relationships are **not universal across the two sites**. Examples:
- phycocyanin ↔ turbidity correlation is ~0.02 at 189 but ~0.54 at 191;
- wind ↔ turbidity aligned against 267 is ~0.28 at 189 but ~0 at 191.

**Implication:** do not hardwire one strong water-quality correlation across all virtual buoys. VBUOY-002 should use persistent buoy-specific baselines and modest shared forcing. Strong scenario-specific relationships belong in Event Mode later.

## V1 public sensor catalogue decision

The public product should be understandable rather than exhaustive.

### Depth-profile concepts

Use three **virtual design depths** for temperature/current:
- 1 m;
- 4 m;
- 8 m.

These are product choices informed by the multi-depth source data; they are not claims that every source instrument used those exact three positions.

Expose:
- water temperature at 1/4/8 m, **°C**;
- current speed at 1/4/8 m, **m/s**;
- current direction at 1/4/8 m, **degrees + compass label**, using the derived velocity-vector **TO** convention.

For current components:
- eastward velocity = `u`;
- northward velocity = `v`;
- speed = `sqrt(u² + v²)`;
- TO bearing clockwise from true north = `(atan2(u, v) in degrees + 360) mod 360`.

Raw U/V components may remain an advanced/internal field later; high-school users should not have to reconstruct direction.

### Water-quality concepts

Expose:
- dissolved-oxygen saturation at 1 m and 8 m, **%**;
- phycocyanin at 1 m, **µg/L**;
- turbidity at 2 m, **NTU**.

The chosen virtual depths make the educational profile easy to understand; the generator may calibrate those values from the available source distributions rather than claiming one-to-one sensor identity.

### Atmospheric/wave concepts

Expose:
- air temperature, **°C**;
- barometric pressure, **hPa**;
- wind speed, **m/s**;
- wind gust, **m/s**;
- wind FROM direction, **degrees + compass**;
- significant wave height, **m**;
- wave mean period, **s**;
- wave FROM direction, **degrees + compass**.

For V1, omit:
- CDOM;
- chlorophyll;
- nitrate;
- maximum wave height;
- humidity.

They can be added later if they improve the educational experience. Nitrate/humidity are omitted because the attached calibration files do not provide the same useful historical evidence.

## Generator design constraints

VBUOY-002 should implement a **seeded, stateful, semi-empirical generator**.

At each 10-minute step:

```text
regional physical state
    + seasonal/diurnal target
    + mean reversion / persistence
    + small stochastic innovation
    + buoy-specific offset / lag
    + cross-parameter response
        ↓
three coherent buoy snapshots
```

Recommended structure:

1. **Regional atmosphere:** air temperature, pressure, wind speed/direction and gust.
2. **Wave state:** lagged response to wind; do not calculate waves as independent noise.
3. **Water column:** slowly evolving surface temperature plus seasonal stratification; stronger sustained wind should reduce the vertical temperature gradient gradually.
4. **Currents:** generate east/north latent components, then derive public speed + TO direction. Use depth-dependent scaling and a shared regional component plus buoy-specific variation.
5. **DO saturation:** persistent, depth-aware and linked modestly to temperature/mixing.
6. **Phycocyanin:** slow-moving, usually low under normal mode. Do not create a HAB by accident.
7. **Turbidity:** persistent buoy-specific baseline with modest response to energetic conditions. Avoid making wind/waves deterministically predict turbidity at every buoy.

Three buoys should share the same regional weather but never return identical water measurements. Use fixed per-buoy biases/lags and deterministic seeded noise.

## Normal-mode acceptance targets

These are engineering checks, not claims that the simulator is a validated lake model.

For a seeded accelerated 30-day run:
- every buoy has an exact 10-minute sequence;
- no duplicate timestamps;
- no NaN/Infinity;
- gust is never materially below sustained wind;
- temperatures evolve smoothly and remain physically plausible;
- current speed is non-negative and direction stays in [0, 360);
- wind/wave relationship is visibly positive, with target run-level correlation roughly **0.4–0.8**;
- three buoys are correlated but not identical;
- normal phycocyanin/turbidity remain mostly inside the historical robust envelopes;
- source-like 10-minute rate-of-change magnitudes are not routinely exceeded;
- seeded reruns produce identical output.

Use conservative hard clamps only as a final safety boundary; the process itself should normally stay within range through its dynamics.

## What this analysis does not establish

The source files do not establish:
- a validated predictive model of Lake Erie;
- exact station geography for the three virtual sites;
- a universal causal relationship among turbidity, phycocyanin, wind and waves;
- QARTOD flag meanings;
- a winter meteorological climatology complete enough to justify a detailed physical model.

The UI/API must continue to label all values as **synthetic educational data**.
