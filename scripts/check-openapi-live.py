"""Validate the checked-in OpenAPI 3.1 contract and representative live responses.
Requires openapi-spec-validator 0.7.2 and jsonschema 4.x; network access is required.
"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate_spec

spec = json.loads(Path('docs/openapi.yaml').read_text(encoding='utf8'))
validate_spec(spec)
base = spec['servers'][0]['url']
now = datetime.now(timezone.utc).replace(microsecond=0)
end = now.isoformat().replace('+00:00', 'Z')
start = (now - timedelta(hours=1)).isoformat().replace('+00:00', 'Z')
cases = [
 ('/v1/health', '/v1/health', 200), ('/v1/buoys', '/v1/buoys', 200),
 ('/v1/parameters', '/v1/parameters', 200),
 ('/v1/buoys/{slug}', '/v1/buoys/central', 200),
 ('/v1/buoys/{slug}/latest', '/v1/buoys/central/latest', 200),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=water_temperature', 200),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=water_temperature&hours=72&depth_m=4', 200),
 ('/v1/buoys/{slug}/observations', f'/v1/buoys/central/observations?parameter=water_temperature&start={start}&end={end}', 200),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=current_direction&hours=1', 200),
 ('/v1/buoys/{slug}', '/v1/buoys/unknown', 404),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations', 400),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=unknown', 404),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=water_temperature&depth_m=99', 404),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=water_temperature&depth_m=bad', 400),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=water_temperature&hours=169', 400),
 ('/v1/buoys/{slug}/observations', '/v1/buoys/central/observations?parameter=water_temperature&start=bad&end=bad', 400),
 ('/v1/buoys/{slug}/observations', f'/v1/buoys/central/observations?parameter=water_temperature&hours=1&start={start}&end={end}', 400),
]
for path, request, expected in cases:
    try: response = urlopen(base + request, timeout=30)
    except HTTPError as e: response = e
    with response:
        assert response.status == expected, (request, response.status, expected)
        data = json.load(response)
    schema = spec['paths'][path]['get']['responses'][str(expected)]['content']['application/json']['schema']
    document = {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'components': spec['components'], **schema}
    Draft202012Validator(document, format_checker=FormatChecker()).validate(data)
    if 'observations' in data:
        rows = data['observations']
        assert all(a['observed_at'] <= b['observed_at'] for a, b in zip(rows, rows[1:])), request
        if 'depth_m=4' in request: assert rows and all(row['depth_m'] == 4 for row in rows)
        if 'current_direction' in request: assert rows and all(row.get('compass') and row.get('direction_convention') == 'to' for row in rows)
    if 'error' in data: assert data['error']['details'] is None
for method in ('POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'):
    try: response = urlopen(Request(base + '/v1/buoys', method=method), timeout=30)
    except HTTPError as e: response = e
    with response:
        assert response.status == 405, (method, response.status)
        if method != 'HEAD':
            body = json.load(response)
            schema = spec['paths']['/v1/buoys']['get']['responses']['405']['content']['application/json']['schema']
            document = {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'components': spec['components'], **schema}
            Draft202012Validator(document, format_checker=FormatChecker()).validate(body)
            assert body['error']['code'] == 'METHOD_NOT_ALLOWED'
req = Request(base + '/v1/buoys', method='OPTIONS', headers={'Origin': 'https://example.com', 'Access-Control-Request-Method': 'GET'})
with urlopen(req, timeout=30) as response:
    assert response.status == 204 and response.headers['Access-Control-Allow-Origin'] == '*'
    assert response.headers['Access-Control-Allow-Methods'] == 'GET, OPTIONS'
print(f'OpenAPI 3.1 valid; {len(cases)} live responses match documented schemas and statuses; POST/PUT/PATCH/DELETE/HEAD 405; OPTIONS 204.')
print('500 response and upstream outages reviewed against source; not induced on production.')
