# VBUOY-003 Public Explorer UX

## Goal

Make the synthetic buoy network understandable within a few seconds, while still giving technically curious visitors access to depth profiles and historical data.

The explorer should feel like an interactive field guide rather than a control-room dashboard.

## Desktop hierarchy

```text
Hero / project explanation

┌───────────────────────────────┬──────────────────────────┐
│                               │ Selected buoy            │
│        Lake Erie map          │ Virtual · Synthetic      │
│                               │ Updated <time>           │
│       W      C       E        │                          │
│                               │ Weather                  │
│                               │ Water quality            │
│                               │ Water column             │
│                               │ Waves & currents         │
└───────────────────────────────┴──────────────────────────┘

Explore the data
[ Parameter ▼ ]   [24 h] [3 d] [7 d]   [Download CSV]

┌──────────────────────────────────────────────────────────┐
│ responsive time-series / profile chart                   │
└──────────────────────────────────────────────────────────┘

What does this measure?
plain-language explanation + direction/depth/unit notes
```

The exact ratio may change during implementation, but the map and selected-buoy detail should read as one coherent interaction.

## Mobile hierarchy

```text
Map
[West] [Central] [East]

Selected buoy
latest grouped readings

Explore the data
parameter selector
range controls
chart

parameter explanation
download CSV
```

Do not require precision tapping on map markers to use the mobile experience.

## Latest reading presentation

Avoid a 23-card wall.

Use four semantic groups:

### Weather
Air temperature, pressure, wind speed/gust/direction.

### Water quality
DO saturation, phycocyanin, chlorophyll, CDOM relative signal, turbidity.

### Water column
Temperature at 1/4/8 m.

### Waves & currents
Significant wave height, mean period, wave direction, current speed/direction at 1/4/8 m.

Compact profile rows are preferable to separate cards for each depth.

## Educational copy style

Each parameter should answer two questions in plain language:

**What is it?**  
One sentence describing the measurement.

**Why look at it?**  
One sentence describing what changing values can help someone understand.

Avoid diagnostic claims such as “this means a bloom is occurring.” Prefer wording like “Phycocyanin is a pigment associated with cyanobacteria, so changes can be useful when exploring bloom-like conditions.”

## Direction helper

For wind/wave/current parameters, show a small compass reference:

```text
0° / 360° = N
45° = NE
90° = E
135° = SE
180° = S
225° = SW
270° = W
315° = NW
```

Wind and wave directions describe where they come **FROM**. Current direction describes where water is moving **TO**.

## Data labels

Always retain:
- `Synthetic · educational`;
- unit;
- depth if applicable;
- observation timestamp.

CDOM should display something like:

`0.9 relative`

with an explanation that V1 uses a relative source scale and does not represent an absolute concentration.

## Chart behaviour

- multi-depth lines for water temperature/current/DO;
- single series for other scalar parameters;
- visible depth legend;
- do not smooth data;
- responsive x-axis labels;
- exact values available through hover/focus or accessible table;
- 24 h / 3 d / 7 d range controls;
- loading skeleton or simple loading state rather than layout shifts.

For circular direction parameters, prefer discrete/stepped points plus compass labels. Do not connect 359° to 1° through the middle of the chart.

## CSV behaviour

Download exactly the data currently represented by the chart/selection.

A visitor should be able to:
1. select Central Virtual Buoy;
2. choose Water temperature;
3. choose 7 days;
4. click Download CSV;
5. receive all three temperature-depth series with timestamps/units/depths.

The CSV is part of the educational path toward VBUOY-004's developer API.
