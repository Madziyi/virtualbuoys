# Active Initiative

**Initiative:** VBUOY-004 — Public REST API + OpenAPI playground  
**Status:** PARTIAL - FUNCTION DEPLOYED; MOBILE UAT AND REVIEW REMAIN
**Planner:** Terra  
**Implementation / verification:** Luna / Codex

## Objective

Expose the same synthetic buoy network used by the public explorer through a deliberately simple, stable developer API that a high-school student, university student or hobby developer can use without understanding Supabase internals.

VBUOY-004 should deliver:
- public read-only REST endpoints;
- a versioned `/v1` contract;
- OpenAPI 3.1 documentation;
- an interactive Swagger-style playground;
- copyable curl, JavaScript and Python examples;
- friendly direction/units/depth metadata;
- bounded query behaviour that cannot accidentally request the entire observations table.

This initiative does **not** implement Event Mode.

## Product principle

The public API is a learning surface, not a raw database mirror.

A user should be able to go from:

```text
click buoy on website
      ↓
see a reading
      ↓
open API playground
      ↓
GET the same data
      ↓
copy Python/JavaScript example
      ↓
build something
```

Do not expose internal UUIDs, generator state, scheduler internals, Vault details or raw database structure unless there is a clear public need.

## Public API contract

The proposed V1 contract is documented in `docs/public-api-contract.md`.

Required routes:

```http
GET /v1/health
GET /v1/buoys
GET /v1/buoys/{slug}
GET /v1/buoys/{slug}/latest
GET /v1/buoys/{slug}/observations
GET /v1/parameters
```

### Simple observations query

Primary beginner-friendly query:

```http
GET /v1/buoys/central/observations?parameter=water_temperature&hours=24
```

Support:
- `parameter` — required;
- `hours` — optional convenience window;
- `start` + `end` — optional explicit UTC ISO range;
- `depth_m` — optional for depth-aware parameters.

Rules:
- either `hours` or explicit `start/end`, not conflicting combinations;
- default `hours=24` if no range is supplied;
- maximum V1 range: **7 days**;
- invalid buoy/parameter/depth/range returns a structured 4xx response;
- output is ordered oldest → newest;
- do not expose an unbounded `limit=all` path.

The API may paginate internally, but the beginner-facing endpoint should return the complete bounded response for the requested valid range when safely possible.

## Response principles

Every response should make synthetic provenance obvious.

Example shape:

```json
{
  "data_source": "synthetic",
  "buoy": {
    "slug": "central",
    "name": "Central Virtual Buoy"
  },
  "parameter": {
    "key": "water_temperature",
    "name": "Water temperature",
    "unit": "°C",
    "direction_convention": null
  },
  "observations": [
    {
      "observed_at": "2026-11-05T17:10:00Z",
      "depth_m": 1,
      "value": 11.3019
    }
  ]
}
```

For direction parameters, each public value should also include a compass label:

```json
{
  "value": 69,
  "compass": "ENE",
  "direction_convention": "from"
}
```

Wind/wave direction remains FROM. Current direction remains TO.

CDOM metadata must clearly state that it is a relative synthetic signal, not an absolute concentration.

## Implementation architecture

Preferred V1 architecture:

```text
Public developer
      ↓
Supabase Edge Function: public-api
      ↓
public/RLS-safe read paths
      ↓
buoys / parameters / channels / observations
```

The Edge Function should act as a stable contract/validation layer rather than exposing PostgREST table shapes directly.

### Security

The API is intentionally public and read-only.

Requirements:
- GET/OPTIONS only for V1 public routes;
- no public write operation;
- do not use the scheduler token;
- do not expose the service-role key to clients;
- prefer RLS-safe/public-role reads inside the API where practical;
- if service-role access is required for an implementation reason, strictly whitelist reads and document why;
- generator state must remain inaccessible;
- existing scheduler/write security must remain unchanged.

VBUOY-006 remains responsible for more complete rate-limit/abuse hardening, but VBUOY-004 must still use bounded inputs and reject oversized requests.

## CORS and caching

The API is meant for browser projects as well as scripts.

Implement intentional CORS:
- allow GET/OPTIONS;
- document the chosen allowed-origin policy;
- do not accidentally allow credentials if they are unnecessary.

Use conservative public caching where appropriate:
- metadata routes can cache longer;
- latest/history should respect the 10-minute source cadence.

Exact cache headers should be documented and tested.

## OpenAPI

Create a checked-in OpenAPI 3.1 specification as the contract source of truth.

Suggested location:

`docs/openapi.yaml`

Requirements:
- every V1 route documented;
- parameters/ranges/enums documented;
- response examples;
- error schemas;
- synthetic-data disclaimer;
- wind/wave FROM and current TO conventions;
- CDOM relative signal note;
- no secret/auth fields that are not actually required.

The spec and implementation must agree. Add a focused contract test or equivalent check so route/schema drift is detectable.

## API playground

Add a public API section/page accessible from the existing **API** navigation item.

It should include:
- short explanation of synthetic 10-minute data;
- base endpoint;
- interactive Swagger UI or equivalent generated from the checked-in OpenAPI spec;
- copyable examples for curl, JavaScript and Python;
- one beginner example using Central water temperature over 24 hours;
- link/CTA back to the visual explorer.

Prefer lazy-loading the Swagger/playground bundle so the existing explorer does not pay the full dependency cost on initial page load.

Do not build a custom API documentation engine if standard OpenAPI tooling is sufficient.

## Error contract

Use one predictable shape:

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Unknown parameter 'foo'.",
    "details": null
  }
}
```

At minimum distinguish:
- malformed request — 400;
- unknown buoy/parameter/depth — 404 or documented 400/404 convention;
- range too large — 400;
- unsupported method — 405;
- server failure — 500.

Do not leak SQL errors, internal table names, stack traces or secrets.

## API examples

Required docs/playground examples:

### curl
```bash
curl "<base>/v1/buoys/central/latest"
```

### JavaScript
```js
const response = await fetch(
  "<base>/v1/buoys/central/observations?parameter=water_temperature&hours=24"
)
const data = await response.json()
```

### Python
```python
import requests

data = requests.get(
    "<base>/v1/buoys/central/observations",
    params={"parameter": "water_temperature", "hours": 24},
    timeout=15,
).json()
```

Examples must use the actual deployed base URL after deployment, not placeholders in the final public UI.

## Ordered implementation

1. Sync current `main`; read all durable context.
2. Review deployed VBUOY-002 schema/RLS and VBUOY-003 data-access logic.
3. Finalize `docs/public-api-contract.md` and create the OpenAPI 3.1 spec.
4. Implement a pure/testable request parser/validator/formatter layer.
5. Implement the read-only `public-api` Edge Function with route dispatch.
6. Add CORS, cache headers and structured errors.
7. Add tests for valid routes, invalid buoy/parameter/depth, range validation, compass output, CDOM metadata and unsupported methods.
8. Deploy the function and directly verify live routes.
9. Verify no write/security regression against existing tables/function/scheduler boundaries.
10. Add the public API docs/playground UI and lazy-load heavy documentation tooling.
11. Add curl/JS/Python examples using the actual deployed base URL.
12. Run browser UAT for docs/playground at desktop and true 390 px mobile.
13. Run repository gates and live API verification.
14. Update durable context and push the verified handoff.

## Acceptance criteria

### API functionality
- `/v1/health` returns a small successful synthetic-service response;
- three buoy definitions return through `/v1/buoys`;
- buoy detail/latest routes work for west/central/east;
- parameters route exposes all 16 V1 public parameters;
- 24 h / 3 d / 7 d observation requests work;
- multi-depth temperature/current/DO data include depth metadata;
- direction values include degree + compass + convention;
- CDOM is explicitly relative;
- ranges over 7 days are rejected;
- unknown buoy/parameter/depth produce structured errors;
- unsupported write methods are rejected.

### Contract
- OpenAPI 3.1 file validates;
- documented routes/examples match deployed responses;
- contract checks cover implementation/spec drift sufficiently for V1.

### Security
- public API cannot write observations;
- generator state remains inaccessible;
- scheduler token is never required/exposed;
- service-role key is never exposed;
- existing anonymous write rejection and scheduler-function 401 behaviour still pass.

### Playground
- API nav leads to a useful public documentation/playground experience;
- Execute/Try It Out works against the deployed API;
- curl/JS/Python examples are copyable and correct;
- synthetic/educational disclaimer is obvious;
- explorer remains usable after API UI changes;
- heavy playground code is lazy-loaded if practical.

### UAT
Desktop and actual 390 px:
- documentation readable;
- interactive controls usable;
- no horizontal page overflow;
- code examples remain scrollable/readable;
- API requests return successfully from the browser.

## Explicit non-goals

- Event Mode / simulation-session POST routes;
- user API keys;
- user accounts;
- paid tiers/quotas;
- GraphQL;
- bulk whole-database export;
- long-range requests beyond seven days;
- production-grade distributed rate limiting (VBUOY-006);
- vanity custom API domain unless trivial and already available.

## Risks

- Swagger/OpenAPI tooling can materially increase frontend bundle size; lazy-load it.
- Public history queries must remain bounded even if the underlying database grows.
- Edge Function implementation must not become a privileged database proxy.
- CORS must be intentional because student browser projects are a core use case.

## Next action

Luna syncs `main`, executes VBUOY-004, deploys/verifies the read-only API, performs desktop/mobile playground UAT, updates durable context and pushes the standard handoff.


## Implementation handoff - 2026-11-05

The public-api function and lazy Swagger playground are implemented. Live version 2 was deployed and probed. The initiative is **not closed**: true 390 CSS-pixel UAT remains outstanding because the available browser override reported innerWidth 582 when 390 was requested. Complete mobile layout/scroll and Try It Out verification at an effective 390 CSS pixels; inspect dependency audit and resolve remaining advisories; review the OpenAPI contract and tests for completeness. See LOG.md for evidence.
