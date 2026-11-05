import { beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ ranges: [] as Array<[string, number, number]> }))
vi.mock('./supabase', () => ({
  supabase: {
    from(table: string) {
      let channel = ''
      const query = {
        select: () => query,
        eq: (field: string, value: string) => { if (field === 'channel_id') channel = value; return query },
        gte: () => query,
        lte: () => query,
        order: () => query,
        single: async () => ({ data: { id: table === 'buoys' ? 'buoy-id' : 'parameter-id' }, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [{id:'one',depth_m:1},{id:'eight',depth_m:8}], error:null }).then(resolve),
        range: async (start: number, end: number) => {
          mock.ranges.push([channel,start,end])
          const total = channel === 'one' ? 1001 : 2
          const data = Array.from({length: Math.max(0, Math.min(total, end + 1) - start)}, (_,i) => {
            const index = start + i
            return {observed_at: new Date(Date.UTC(2026,0,1) + index * 600000).toISOString(), value: index + (channel === 'eight' ? 8000 : 0), provenance:'synthetic'}
          })
          return {data,error:null}
        },
      }
      return query
    },
  },
}))
import { compass, fetchHistory, makeCsv } from './explorer'

describe('explorer data', () => {
  beforeEach(() => { mock.ranges.length = 0 })
  it('wraps compass bearings around north', () => {
    expect([compass(359), compass(1), compass(69), compass(245)]).toEqual(['N','N','ENE','WSW'])
  })
  it('retrieves every page and sorts multiple depths without duplicates', async () => {
    const rows = await fetchHistory('central','water_temperature','2026-01-01T00:00:00Z','2026-01-08T00:00:00Z')
    expect(mock.ranges).toContainEqual(['one',0,999])
    expect(mock.ranges).toContainEqual(['one',1000,1999])
    expect(rows).toHaveLength(1003)
    expect(new Set(rows.map(r => `${r.depth_m}:${r.observed_at}`)).size).toBe(1003)
    expect(rows.slice(0,4).map(r => [r.depth_m,r.value])).toEqual([[1,0],[8,8000],[1,1],[8,8001]])
    expect(rows.at(-1)?.value).toBe(1000)
    expect(rows.every((r,i) => i === 0 || rows[i-1].observed_at <= r.observed_at)).toBe(true)
  })
  it('exports exactly the selected multi-depth dataset, with UTC and synthetic metadata', async () => {
    const rows = await fetchHistory('central','water_temperature','2026-01-01T00:00:00Z','2026-01-08T00:00:00Z')
    const csv = makeCsv(rows, {slug:'central', name:'Central Virtual Buoy'}, {key:'water_temperature', label:'Water temperature', unit:'°C'})
    const lines = csv.trim().split('\r\n')
    expect(lines).toHaveLength(rows.length + 1)
    expect(lines[1]).toBe('"central","Central Virtual Buoy","water_temperature","Water temperature","1","0","°C","","2026-01-01T00:00:00.000Z","synthetic"')
    expect(lines[2]).toContain('"8","8000","°C","","2026-01-01T00:00:00.000Z","synthetic"')
    expect(makeCsv([rows[0]], {slug:'central',name:'Central, Virtual Buoy'}, {key:'current_direction',label:'Current direction',unit:'°',direction:'to'})).toContain('"Central, Virtual Buoy","current_direction","Current direction","1","0","°","to"')
  })
})
