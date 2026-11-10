import { describe, expect, it } from 'vitest'
import specText from '../../docs/openapi.yaml?raw'
import { parse } from 'yaml'
describe('checked-in OpenAPI contract', () => {
  const spec = parse(specText)
  it('documents exactly the public routes and applicable response codes', () => {
    const codes: Record<string, string[]> = {
      '/v1/health': ['200','405','500'], '/v1/buoys': ['200','405','500'], '/v1/parameters': ['200','405','500'],
      '/v1/buoys/{slug}': ['200','404','405','500'], '/v1/buoys/{slug}/latest': ['200','404','405','500'],
      '/v1/buoys/{slug}/observations': ['200','400','404','405','500'],
    }
    expect(spec.openapi).toBe('3.1.0')
    expect(Object.keys(spec.paths).sort()).toEqual(Object.keys(codes).sort())
    for (const [path, expected] of Object.entries(codes)) {
      expect(Object.keys(spec.paths[path])).toEqual(['get'])
      expect(Object.keys(spec.paths[path].get.responses).sort()).toEqual(expected.sort())
      for (const status of expected) expect(spec.paths[path].get.responses[status].content['application/json'].schema).toBeDefined()
    }
  })
  it('defines every history input and its constraints', () => {
    const params = spec.paths['/v1/buoys/{slug}/observations'].get.parameters
    expect(params.map((p: {name:string}) => p.name)).toEqual(['slug','parameter','hours','start','end','depth_m'])
    const find = (name: string) => params.find((p: {name:string}) => p.name === name)
    expect(find('parameter').required).toBe(true)
    expect(find('parameter').schema.enum).toHaveLength(16)
    expect(find('hours').schema.maximum).toBe(168)
    expect(find('hours').schema.exclusiveMinimum).toBe(0)
    expect(find('start').schema.pattern).toBe(find('end').schema.pattern)
    expect(find('depth_m').schema.type).toBe('number')
    expect(spec.paths['/v1/buoys/{slug}/observations'].get.responses['200'].content['application/json'].schema.properties.observations).toBeDefined()
  })
})
