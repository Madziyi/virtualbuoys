# Normal generator implementation

## Scope and model

VBUOY-002 implements a deterministic, semi-empirical normal-mode process for three synthetic educational stations. It is not a calibrated or predictive Lake Erie model. The frontend and Supabase Edge Function import the same TypeScript source from `supabase/functions/advance-virtual-buoys/_shared/`; `src/simulation/` exposes test/app re-exports.

Each 10-minute step stores a seeded PRNG state, regional atmosphere/waves/stratification/mixing/surface temperature, four regional-history samples, and per-buoy profiles and water-quality/current state. Regional fields use seasonal and diurnal targets plus autoregressive movement/noise. Waves follow wind with a smoothed response. Water profiles move gradually toward a seasonal stratification target attenuated by wind-driven mixing. Current speed and direction are derived from persistent east/north components at 1, 4 and 8 m; public direction is TO, clockwise from north. Oxygen saturation is depth-aware and responds modestly to temperature/mixing. Phycocyanin, chlorophyll, CDOM and turbidity are persistent, buoy-specific processes; there is no incident/event forcing in this generator.

Seed `20261105` is used for the initial deployment. A generated observation step contains 23 catalogue channels per buoy, 69 rows total. `advanceOneStep` returns no observations for an already completed or older timestamp. The database commit RPC adds compare-and-swap state advancement and a unique channel/timestamp key, so concurrent/retried scheduler calls cannot duplicate a committed step.

## Catalogue and public units

The V1 live registry is 16 parameters and 23 channels per buoy: water temperature (1/4/8 m, °C); current speed and TO direction (1/4/8 m, m/s and °); dissolved oxygen saturation (1/8 m, %); phycocyanin and chlorophyll (1 m, µg/L); CDOM (1 m, relative source scale `1`); turbidity (2 m, NTU); air temperature (°C); pressure (hPa); wind speed/gust (m/s); wind direction FROM (°); significant wave height (m); mean wave period (s); and wave direction FROM (°). Chlorophyll uses the explicit conversion `1 kg/m³ = 1,000,000 µg/L`. CDOM is not represented as an absolute concentration. The catalogue and reference rationale are in `SIMULATION-CONTRACT.md` and `docs/generator-reference-analysis.md`.

## Local reproducibility and acceptance

`npm run simulate:30d` runs 4,320 ten-minute steps from `2026-07-01T00:00:00.000Z` with seed `20261105`; it emits 298,080 channel values. `src/simulation/acceptance.test.ts` checks deterministic reruns, exact cadence, finite values, current/wind direction and speed constraints, gust ≥ wind, water-quality robust envelopes, source-scale rate-of-change p90 limits, positive wind/wave association, related-but-distinct stations, and idempotence. The standalone script asserts the same limits and prints measured evidence.

Reference-scale rate-of-change ceilings use the derived 267 source evidence in `docs/generator-reference-analysis.md`: p90 ≤0.26 °C air, ≤0.56 m/s wind, ≤0.94 m/s gust, ≤0.039 m significant wave height and ≤0.050 °C for water temperature. The seeded 30-day run reported wind/wave correlation 0.6146785, west/central surface-water correlation 0.9365179, maximum water-temperature step 0.0457551 °C, and water-quality p95 values 2.1295796 µg/L phycocyanin, 3.6081568 µg/L chlorophyll, 0.8957099 source-relative CDOM and 2.4683553 NTU turbidity. Measured rate p90 values were 0.1430863 °C air, 0.2450490 m/s wind, 0.7302041 m/s gust, 0.0343142 m waves and 0.0173750 °C water temperature; each is below its reference ceiling.

## Live scheduling

The production Edge Function accepts a dedicated scheduler token in `x-vbuoy-scheduler-token`; it validates the token against a SHA-256 digest in Vault before reading a request action. Supabase Cron runs every ten minutes in GMT and calls the function via `pg_net`. The service credential remains in the Edge Function environment, the scheduler token value remains in Vault/local ignored configuration, and neither is exposed to the browser. See `LIVE-STATE.md` for the directly observed run records and security checks.
