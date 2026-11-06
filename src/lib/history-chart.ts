import type { Observation } from './explorer'
export const seriesKey = (depth: number | null) => depth === null ? 'surface' : `depth_${depth}`
export function prepareHistory(rows: Observation[]) {
  if (!rows.length) return { points: [], depths: [] as (number | null)[] }
  const depths = [...new Set(rows.map(row => row.depth_m))].sort((a, b) => (a ?? 0) - (b ?? 0))
  const times = rows.map(row => Date.parse(row.observed_at))
  const start = Math.min(...times), end = Math.max(...times)
  const grid = new Map<number, Record<string, number | null>>()
  for (let time = start; time <= end; time += 600000) {
    grid.set(time, Object.fromEntries([['time', time], ...depths.map(depth => [seriesKey(depth), null])]))
  }
  for (const row of rows) {
    const time = Date.parse(row.observed_at)
    const point = grid.get(time) ?? { time }
    point[seriesKey(row.depth_m)] = row.value
    grid.set(time, point)
  }
  return { depths, points: [...grid.values()].sort((a, b) => Number(a.time) - Number(b.time)) }
}
