# VBUOY-004 Public API Contract

## Purpose

Provide a simple read-only REST API over the synthetic Virtual Buoys dataset.

The API is intentionally easier to consume than the underlying relational schema. It is designed for students, educators, hobby developers and public demonstrations.

All data returned by V1 is synthetic educational data.

## Versioning

All stable routes are under:

`/v1`

Breaking changes require a new API version.

## Routes

### GET /v1/health

Small service/availability response.

Example:

```json
{
  "status": "ok",
  "service": "virtual-buoys",
  "api_version": "v1",
  "data_source": "synthetic"
}
```

### GET /v1/buoys

Returns active public virtual buoy metadata.

Fields:
- slug;
- name;
- description;
- latitude;
- longitude;
- `data_source: synthetic`.

Internal UUIDs should not be required by public clients.

### GET /v1/buoys/{slug}

Returns one public buoy plus its available parameters/channels/depths.

Supported initial slugs:
- `west`;
- `central`;
- `east`.

### GET /v1/buoys/{slug}/latest

Returns the latest complete public snapshot for one buoy.

Each item includes:
- parameter key/name;
- depth where applicable;
- value;
- unit;
- observed timestamp;
- direction convention where applicable;
- compass label where applicable;
- synthetic provenance.

### GET /v1/buoys/{slug}/observations

Required query:
- `parameter=<key>`.

Range options:
- `hours=<number>`; or
- `start=<UTC ISO 8601>&end=<UTC ISO 8601>`.

Optional:
- `depth_m=<number>`.

Defaults:
- no range => `hours=24`.

Limits:
- maximum range = 7 days;
- start must be before/equal to end;
- future-only ranges may return an empty observation array rather than an error;
- output sorted oldest → newest.

Examples:

```http
GET /v1/buoys/central/observations?parameter=water_temperature&hours=24
GET /v1/buoys/west/observations?parameter=turbidity&hours=72
GET /v1/buoys/east/observations?parameter=current_speed&depth_m=4&hours=24
```

### GET /v1/parameters

Returns all 16 public V1 parameter definitions.

Metadata should include:
- key;
- display name;
- description;
- unit;
- relative flag;
- direction convention;
- available public depths;
- synthetic educational note where relevant.

CDOM must be identified as relative/unitless rather than an absolute concentration.

## Beginner-friendly direction representation

Public direction observations should include:

```json
{
  "value": 69,
  "unit": "°",
  "compass": "ENE",
  "direction_convention": "from"
}
```

Wind and wave directions use FROM.

Current direction uses TO.

## Error response

All errors use:

```json
{
  "error": {
    "code": "INVALID_RANGE",
    "message": "The requested time range exceeds the 7-day maximum.",
    "details": null
  }
}
```

Do not return raw database or stack-trace errors.

## CORS

The public API is intended to be callable directly from browser projects.

The function returns `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, OPTIONS`, and `Access-Control-Allow-Headers: content-type`. It does not allow credentials. Unsupported methods return 405 with the structured error schema.

## Cache policy

Current `Cache-Control` policy: `/health` uses `public, max-age=30`; buoy and parameter metadata use `public, max-age=3600`; latest and history use `public, max-age=60`. Errors use `no-store`.

## Security boundary

The API is read-only.

It must never expose:
- service-role credentials;
- scheduler token;
- Vault content;
- generator state;
- commit RPC;
- database UUIDs unless explicitly required;
- write methods.

The permanent stream's current RLS and scheduler security remain authoritative.

## OpenAPI

`docs/openapi.yaml` becomes the machine-readable public contract.

The deployed function and playground must follow it.

## Future Event Mode

Do not add simulation-session routes in VBUOY-004.

VBUOY-005 will define a separate event-session contract and must not mutate the permanent API history.


## Contract verification

Run `python -m pip install -r scripts/requirements-api-contract.txt` in an isolated environment, then `python scripts/check-openapi-live.py` to validate OpenAPI 3.1 and compare representative live responses and method behavior against the checked-in schemas. The probe does not induce production 500 errors; that path is reviewed in source.
