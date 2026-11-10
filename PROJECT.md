# Virtual Buoys

## Purpose

Virtual Buoys is a public educational and developer-facing Great Lakes data platform built around a small network of simulated Lake Erie buoys.

The product should make buoy monitoring understandable and fun: visitors can explore a map, click a buoy, inspect realistic water/weather parameters, understand what each sensor means, plot/download data, and use the same data through a simple public API.

The project is intentionally separate from Hardwater. Virtual Buoys uses synthetic data only and must never be confused with operational water-utility monitoring.

## Core experience

A visitor should be able to move progressively through:

```text
Map
 ↓
Click a buoy
 ↓
See latest readings
 ↓
Understand each parameter
 ↓
Explore a time series
 ↓
Download CSV
 ↓
Use the REST API
 ↓
Build something of their own
```

## Initial product scope

### Virtual network
- Three virtual buoys in western Lake Erie.
- Positioned on the Essex County side of the lake, reasonably nearshore, but separated enough to exhibit different conditions.
- Exact coordinates must be deliberately chosen and recorded before implementation.
- Normal public observations update every 10 minutes.
- All readings are synthetic and must be clearly labelled as simulated.

### Public map/data explorer
- Map-first experience inspired by the existing Hardwater map UX, but designed for public education rather than utility operations.
- Click buoy → latest readings, parameter explanations, depth profiles and time-series exploration.
- Download CSV without requiring programming.
- Clear units and plain-language explanations.

### Event Mode
Event Mode is an interactive simulation, not a historical replay.

Visitors can choose a scenario such as:
- Normal
- Storm
- Turnover
- Harmful algal bloom (HAB)

and run it at:
- 1×
- 2×
- 5×
- 10×

Event Mode must be isolated per simulation session. One visitor starting a HAB simulation must not alter the permanent public stream or another visitor's session.

VBUOY-005 implements this isolation client-side: the deterministic event timeline lives only in that visitor's browser and is never written to the permanent observation tables.

### Public developer API
The frontend and outside developers should use the same stable public API wherever practical.

Initial conceptual routes:

```http
GET /v1/buoys
GET /v1/buoys/{id}
GET /v1/buoys/{id}/latest
GET /v1/buoys/{id}/observations
GET /v1/parameters
```

The project should provide:
- OpenAPI documentation;
- an interactive API playground, likely Swagger UI or equivalent;
- copyable curl, JavaScript and Python examples;
- simple response shapes suitable for students.

Do not introduce a separate FastAPI service in V1 unless requirements justify it. Supabase Edge Functions plus OpenAPI are the preferred initial direction.

## Initial technology direction

Implemented in VBUOY-001 and VBUOY-002:

### Frontend
- React
- TypeScript
- Vite
- MapLibre for the interactive map

### Backend/data
- Supabase/Postgres
- Supabase Edge Functions for public API endpoints initially
- scheduler/worker mechanism for 10-minute virtual observations

### Simulator
- Prefer TypeScript initially.
- Add Python only if scientific modelling complexity creates a real need.

### API documentation
- OpenAPI
- Swagger UI or comparable interactive explorer

## Supabase target

Target project ID supplied by the project owner:

`dbsuryesimzatxhznurh`

This identifier is configuration context, not proof of current live schema/deployment. See `LIVE-STATE.md`.

## Hosting direction

The selected static frontend path is Cloudflare Pages (Vite build command `npm ci && npm run build`, output directory `dist/`) with Supabase as a separate data/API service. The initial frontend is deployed through Pages Direct Upload; see `LIVE-STATE.md` for verified deployment facts and `README.md` for the deployment procedure. See `docs/data-api-schema.md` for the V1 schema.

## Product principles

1. **Simple before sophisticated.** Students should understand the data without knowing oceanographic vector math.
2. **Scientifically plausible, not falsely authoritative.** Simulations should be believable and internally consistent, while always labelled synthetic.
3. **One data model, many entry points.** Map, charts, CSV and API should expose the same underlying measurements.
4. **Public fields should be easy to consume.** Derived human-friendly fields may sit beside advanced/raw fields.
5. **Simulation sessions must not contaminate the permanent public stream.**
6. **The simulator should evolve over time rather than instantly changing unrelated values.**

## Public direction conventions

Wind direction should be exposed directly as:
- degrees;
- compass label.

Users should not need to derive public wind direction from U/V components.

Meteorological wind convention:
- direction is where the wind comes **from**;
- measured clockwise from true north;
- 0°/360° = N;
- 90° = E;
- 180° = S;
- 270° = W.

Example: 69° is approximately ENE.

Water-current direction convention must be explicitly selected before implementation (FROM vs TO) and then frozen in `SIMULATION-CONTRACT.md`.

## Sensor philosophy

Do not expose every channel a research buoy could contain.

The public set should be intentionally understandable, likely including a subset of:
- water temperature at representative depths;
- dissolved oxygen at representative depths;
- current speed/direction at representative depths;
- phycocyanin;
- nitrate;
- wind speed/gust/direction;
- air temperature;
- humidity;
- barometric pressure;
- wave height.

Exact parameter names, sensor depths and units must be verified against the real buoy datasets/reference material before the public schema is frozen. Do not invent final units merely for convenience.

## Security / separation

- Synthetic/public project only.
- No Hardwater operational database access.
- No utility/customer data.
- No privileged Supabase keys in the browser.
- No secrets committed to GitHub.
- Public API needs abuse/rate-limit planning before broad launch.
- Simulation writes and permanent public-stream writes must be distinguishable.

## Initial roadmap

- **VBUOY-001 — Foundation:** repo/context, stack, Supabase connection, deployment shell, API/data-contract planning.
- **VBUOY-002 — Virtual buoy network:** three buoy definitions, parameter schema, normal correlated generator, 10-minute ingestion.
- **VBUOY-003 — Public explorer:** map, buoy detail, parameter education, charts, CSV.
- **VBUOY-004 — Public API:** stable REST routes, OpenAPI/Swagger playground, examples.
- **VBUOY-005 — Event Mode:** isolated scenario sessions, Normal/Storm/Turnover/HAB, 1×/2×/5×/10×.
- **VBUOY-006 — Hardening:** long-run soak tests, rate limits, failure modes, accessibility, responsive UAT.

## Definition of done

A meaningful feature is done only when implementation, tests, type/lint/build checks, browser UAT, simulation realism checks where relevant, live verification where relevant, durable-context updates and GitHub publication are all complete.
