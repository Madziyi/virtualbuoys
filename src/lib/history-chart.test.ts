import { describe, expect, it } from 'vitest'
import { prepareHistory } from './history-chart'
import type { Observation } from './explorer'
const row = (time: string, depth: number, value: number): Observation => ({ observed_at: time, depth_m: depth, value, provenance: 'synthetic' })
describe('history comparison data', () => {
  it('aligns depth readings chronologically and leaves gaps unconnected', () => {
    const result = prepareHistory([row('2026-01-01T00:20:00Z', 1, 3), row('2026-01-01T00:00:00Z', 4, 2), row('2026-01-01T00:00:00Z', 1, 1)])
    expect(result.depths).toEqual([1, 4])
    expect(result.points).toEqual([
      { time: Date.parse('2026-01-01T00:00:00Z'), depth_1: 1, depth_4: 2 },
      { time: Date.parse('2026-01-01T00:10:00Z'), depth_1: null, depth_4: null },
      { time: Date.parse('2026-01-01T00:20:00Z'), depth_1: 3, depth_4: null },
    ])
  })
})
