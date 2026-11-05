import { describe, expect, it } from 'vitest'
import { compass, makeCsv } from './explorer'
describe('explorer data formatting', () => {
  it('wraps compass bearings around north', () => {
    expect([compass(359), compass(1), compass(69), compass(245)]).toEqual(['N','N','ENE','WSW'])
  })
  it('exports exactly the supplied observations with context and escaped fields', () => {
    const rows = [{depth_m: 1, value: 1.234567, observed_at: '2026-11-05T12:00:00Z', provenance: 'synthetic'}, {depth_m: 8, value: 2, observed_at: '2026-11-05T12:00:00Z', provenance: 'synthetic'}]
    const csv = makeCsv(rows, {slug:'central', name:'Central, Virtual Buoy'}, {key:'water_temperature', label:'Water temperature', unit:'°C'})
    expect(csv.trim().split('\r\n')).toHaveLength(3)
    expect(csv).toContain('"Central, Virtual Buoy"')
    expect(csv).toContain('"1.234567"')
    expect(csv).toContain('"2026-11-05T12:00:00.000Z","synthetic"')
  })
})
