# VBUOY-005 Event Mode Contract

## Purpose

Event Mode is an interactive educational playback experience over the same three synthetic virtual buoys.

It is not:
- historical replay;
- a current Lake Erie condition;
- a forecast;
- an operational warning;
- a validated hydrodynamic/water-quality model.

## V1 storage decision

Event Mode is client-local.

No V1 database session records or event observations are stored.

A browser session contains:
- scenario;
- event model version;
- deterministic seed;
- generated timeline;
- current frame index;
- playback state;
- playback multiplier.

Reloading the page discards the event.

## Data identity

Permanent stream:

`data_source = synthetic`

Event Mode:

`data_source = synthetic_event`

Where exported or represented in structured data, also include:

`scenario = normal | storm | turnover | hab`

`event_model_version = event-v1`

## Catalogue

Event Mode uses exactly the existing V1 69-channel catalogue.

It must not invent separate public sensor names/units/depths.

Direction conventions remain:
- wind FROM;
- waves FROM;
- current TO.

CDOM remains a relative signal.

## Time

Simulation step: 10 minutes.

Public display should emphasize relative scenario time:
- Day 1 · 00:00;
- Day 1 · 12:30;
- Day 2 · 08:10.

Internal timestamps may use a fixed synthetic ISO baseline for charting/testing, but the UI must not imply that internal date is a real event date.

## Playback

Base playback:
- one event step per second at 1×.

Thus:
- 1× = 10 simulated minutes / real second;
- 2× = 20 simulated minutes / real second;
- 5× = 50 simulated minutes / real second;
- 10× = 100 simulated minutes / real second.

Playback controls operate on already generated deterministic frames. Changing playback speed must not regenerate or change values.

## Scenario durations

| Scenario | Simulated duration | Frames |
| --- | ---: | ---: |
| Normal | 24 h | 144 |
| Storm | 24 h | 144 |
| Turnover | 48 h | 288 |
| HAB-like | 72 h | 432 |

## Scenario generation approach

Preferred implementation:

1. choose a scenario-specific synthetic start season/date;
2. create normal-generator state using a stable scenario seed;
3. pre-roll normal dynamics to establish a stable baseline;
4. generate the event timeline step-by-step;
5. apply deterministic scenario forcing to generator state/targets;
6. emit the same catalogue observations used elsewhere.

Avoid a separate unrelated random-number generator for each parameter.

Refactor shared generator helpers if necessary rather than copy/pasting the normal model.

## Scenario envelopes

Event forcing should use smooth envelopes, for example eased approach → peak → recovery, not hard switches.

### Storm

Suggested phases:
- approach: first ~20%;
- peak/intense period: ~20–60%;
- recovery: ~60–100%.

Relationships:
- pressure trends down into peak and recovers;
- wind/gust rise before/with wave peak;
- waves lag wind;
- current magnitude increases modestly;
- mixing rises;
- temperature-depth gradient weakens gradually;
- turbidity can rise moderately with buoy-specific response.

### Turnover

Suggested phases:
- pre-mixing stratified baseline;
- sustained mixing forcing;
- mixed phase;
- partial weather recovery while water column stays relatively mixed.

Relationships:
- start with >=3 °C surface-deep gradient;
- prolonged wind/wave forcing;
- gradient decays over many steps;
- deep temperature rises and/or surface temperature falls toward convergence;
- DO profile becomes more vertically similar;
- mixed profile should not instantly return to original stratification.

Turnover dissolved oxygen is modeled internally as latent freshwater oxygen concentration (mg/L), never as a new public channel. After pre-roll, seed a stratified saturation profile (surface/deep gap at least 8 percentage points; target approximately 10–25) and convert each depth using `DOsat_mgL(T) = 14.652 - 0.41022T + 0.007991T² - 0.000077774T³`, with simple barometric correction `pressure_hPa / 1013.25`. During turnover, relax the two concentrations toward their common column mean according to the wind/wave mixing envelope, conserving their sum during the mixing operation. Recompute public saturation each frame using local water temperature and pressure. Acceptance uses initial and mixed three-hour windows: initial mean saturation gap ≥8 points; mixed mean concentration gap at least 60% smaller and saturation gap ≤5 points and lower than initial. This remains educational and is not a validated lake oxygen forecast.

### HAB-like

Suggested phases:
- stable warm setup;
- gradual biological growth;
- elevated/persistent bloom-like phase;
- optional mild late stabilization, not abrupt collapse.

Relationships:
- warm/stable water;
- relatively low mixing;
- phycocyanin increases gradually;
- chlorophyll increases with its own dynamics;
- DO remains depth-aware;
- CDOM and turbidity are not forced to mirror pigments.

### Normal

No event overlay. This is the control.

## UI language

Preferred labels:
- `Event Mode`
- `Synthetic educational scenario`
- `Not current conditions or a forecast`
- `HAB-like scenario`

Avoid:
- `Current storm`
- `Live HAB`
- `Predicted turnover`

## CSV

Event CSV should represent only the event data currently shown.

Recommended extra columns:
- data_source;
- scenario;
- event_model_version;
- simulated_at;
- scenario_elapsed_minutes.

## API

VBUOY-004 public API continues to expose only permanent synthetic data.

No VBUOY-005 event routes are added.

If a later initiative exposes event sessions through an API, define/version that separately.

## Versioning

Any material change to scenario equations/thresholds that changes the deterministic educational output should increment the event model version.
