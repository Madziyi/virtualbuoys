import { describe, expect, it } from 'vitest'
import specText from '../../docs/openapi.yaml?raw'
import { parse } from 'yaml'
describe('checked-in OpenAPI contract', () => {
  it('lists every public route with only GET and required history parameter', () => {
    const spec = parse(specText)
    expect(Object.keys(spec.paths).sort()).toEqual(['/v1/health','/v1/buoys','/v1/buoys/{slug}','/v1/buoys/{slug}/latest','/v1/buoys/{slug}/observations','/v1/parameters'].sort())
    for (const path of Object.values(spec.paths)) expect(Object.keys(path as object)).toEqual(['get'])
    const history = spec.paths['/v1/buoys/{slug}/observations'].get
    expect(history.parameters.find((p: {name:string}) => p.name === 'parameter').required).toBe(true)
    expect(history.parameters.find((p: {name:string}) => p.name === 'hours').schema.maximum).toBe(168)
    expect(history.responses['200'].content['application/json'].schema.properties.observations).toBeDefined()
  })
})
