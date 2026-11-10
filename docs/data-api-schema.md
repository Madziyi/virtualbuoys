# Data schema and API direction

**Status: VBUOY-002 implemented in Supabase project `dbsuryesimzatxhznurh`; direct verification evidence is recorded in `LIVE-STATE.md`.** The permanent 10-minute synthetic stream is implemented. This document describes the deployed V1 subset and its intended access boundary. Event/session storage and API routes remain future scope.

The deployed V1 model supports the permanent 10-minute synthetic stream. The catalogue, units, virtual depths and current direction convention are frozen for V1 using the reference data described below. Event/session observations remain a later, separately isolated design.

## Reference evidence reviewed

The owner supplied `latest_observations_by_buoy_rows.json` for this foundation pass. It contains 53 channel rows across reference buoy IDs 2, 4 and 6. Each row includes `channel_id`, `parameter_id`, `standard_name`, `depth`, `unit`, `value`, `measured_at` and `qartod_flag`.

Source observations (source spellings and units preserved) informed the V1 public catalogue described in `SIMULATION-CONTRACT.md`:

| Source parameter | Units in supplied rows | Depth evidence in supplied rows | Notes |
| --- | --- | --- | --- |
| Water Temperature | K | 0–8 m at buoy 2; 1.2 and 2 m at buoy 6 | Multiple channels/profiles; source uses Kelvin. |
| Eastward Current Velocity | m/s | 1–9 m | Component data, not a public speed/direction pair. |
| Northward Current Velocity | m/s | 1–9 m | Component data, not a public speed/direction pair. |
| Dissolved Oxygen Saturation | % | 1, 2.2, 8.5 and 9.5 m | Distinct from dissolved-oxygen concentration. |
| Phycocyanin | ug/L | 1.2 m | Cyanobacteria-associated pigment candidate. |
| Chlorophyll | kg/m³ in the attached CSVs | 1.2 m | V1 explicitly converts to µg/L for the public API; conversion must be tested and documented. |
| Turbidity | NTU | 2 and 2.4 m | Source name/unit retained. |
| Air Temperature | K | no depth | Source unit is Kelvin. |
| Barometric Pressure | Pa | no depth | Source unit is pascals. |
| Wind Direction | deg | no depth | Source meaning says direction wind comes from; retain direction convention metadata. |
| Wind Speed / Wind Gust Speed | m/s | no depth | Separate mean/sustained and gust channels. |
| Significant / Maximum Wave Height | m | no depth | Distinct source parameters; do not collapse until product choice. |
| Wave Mean Period | s | no depth | Source name/unit retained. |
| Wave Direction | deg | no depth | Direction convention needs source metadata review. |

The rows are not a single synchronized snapshot: `measured_at` spans `2025-08-31T14:00:00Z` through `2026-10-17T13:36:37Z`. The export contains QARTOD flag values 2 (12 rows), 3 (2 rows) and 9 (39 rows), but this file does not include the flag legend. Preserve a nullable raw quality flag; do not infer its meaning from the number alone. The reference buoy IDs and channel IDs are source identifiers and must not become virtual-buoy public IDs.

This evidence supports a depth-aware channel registry and observation model. VBUOY-002 planning now freezes the initial student-facing subset and representative virtual depths in `NOW.md` and `SIMULATION-CONTRACT.md`; quality-code meanings remain unresolved and raw source IDs/flags are not copied into synthetic production observations.

## Proposed relational model

- `buoys`: virtual buoy identity and metadata (`id`, stable public `slug`, `name`, `description`, `latitude`, `longitude`, `is_active`). Coordinates are deliberate VBUOY-002 decisions.
- `parameters`: canonical measurement concept and presentation metadata (`id`, stable V1 key, `display_name`, `standard_name`, `description`, canonical unit symbol and unit provenance). The live V1 catalogue has 16 parameters.
- `channels`: a buoy's configured parameter/depth channel (`id`, `buoy_id`, `parameter_id`, nullable `depth_m`, optional source metadata). Surface/atmospheric channels may have no depth. Channel IDs are internal UUIDs.
- `observations`: permanent synthetic values (`channel_id`, `observed_at timestamptz`, `value double precision`, nullable source-compatible `quality_flag`, `created_at`). Unique key `(channel_id, observed_at)`; index `(channel_id, observed_at desc)`. Mark synthetic provenance in API responses; no real reference rows are copied into production.
- `simulation_sessions`: later event-run metadata (`id`, scenario, speed multiplier, wall-clock creation/expiry, simulation-clock start, status). Ownership and abuse controls remain later design work.
- `session_observations`: event values keyed by `(session_id, channel_id, simulated_at)` and stored separately from `observations`; this prevents an event from writing or rewriting permanent history.

All timestamps use `timestamptz` and are returned as UTC ISO 8601. Depth is numeric metres, positive downward, only after the source depth convention is verified. `parameters` records one canonical unit per channel definition; any source-unit conversion must be explicit and tested before data enters the synthetic API.

### Deployed access boundary

The frontend uses only the Supabase publishable key. RLS is enabled on all five public tables. Anonymous/authenticated clients can select the intended synthetic buoy, parameter, channel and observation rows; browser inserts are denied. `latest_observations` is a security-invoker view. Generator state and the transactional `commit_simulation_step` RPC are server-only. Direct access tests and current live object counts are in `LIVE-STATE.md`.

## Proposed API surface

| Route | Purpose |
| --- | --- |
| `GET /v1/buoys` | List active virtual buoys and map metadata. |
| `GET /v1/buoys/{slug}` | One buoy's public metadata and available channels. |
| `GET /v1/buoys/{slug}/latest` | Latest value per configured channel, with measurement timestamp, depth and unit. |
| `GET /v1/buoys/{slug}/observations?start=&end=&limit=` | Bounded time-series query with documented ordering and limits. |
| `GET /v1/parameters` | Parameter dictionary, display metadata, unit and depth semantics. |
| `POST /v1/simulations` and session-scoped `GET` routes | Future isolated event-session surface; not part of permanent observation routes. |

Future API response-envelope sketch (public REST routes are not implemented in VBUOY-002):

```json
{
  "data_source": "synthetic",
  "buoy": { "id": "<public-slug>", "name": "<display-name>" },
  "observations": [
    {
      "channel": "<reviewed-parameter-key>",
      "standard_name": "<source-verified-name>",
      "value": 0,
      "unit": "<reviewed-unit>",
      "depth_m": null,
      "observed_at": "<UTC ISO 8601>",
      "quality_flag": null
    }
  ]
}
```

Wind direction remains a degree value plus a compass label using the agreed meteorological FROM convention. The public current representation must be selected from the reference instrument convention before it is frozen; raw east/north component channels must not be mislabeled as speed or direction.

## Hosting direction

Use Cloudflare Pages for the static Vite frontend, built with `npm ci && npm run build` and published from `dist/`. Keep Supabase as the separate data/API service. The initial production frontend uses Pages Direct Upload; see `LIVE-STATE.md` for verified deployment details.
