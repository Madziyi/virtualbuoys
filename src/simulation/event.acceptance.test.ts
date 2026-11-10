import { describe, expect, it } from 'vitest'
import { buoys, catalogue } from './catalogue'
import { advanceOneStep, createInitialState, STEP_MS } from './generator'
import { EVENT_FRAMES, EVENT_SEEDS, generateEvent, oxygenSaturationMgL, type EventFrame, type Scenario } from './event'

const scenarios: Scenario[] = ['normal', 'storm', 'turnover', 'hab']
const runs = Object.fromEntries(scenarios.map(s => [s, generateEvent(s)])) as Record<Scenario, EventFrame[]>
const value = (frame: EventFrame, slug: string, key: string, depth: number | null = null) => frame.observations.find(r => r.buoySlug === slug && r.key === key && r.depthM === depth)!.value
const bounds: Record<string, [number, number]> = { water_temperature: [0, 35], current_speed: [0, 2], current_direction: [0, 360], dissolved_oxygen_saturation: [78, 145], phycocyanin: [0.03, 9.5], chlorophyll: [0.2, 12], cdom: [0, 2.8], turbidity: [0.05, 11.8], air_temperature: [-30, 40], barometric_pressure: [960, 1040], wind_speed: [0, 20], wind_gust: [0, 25], wind_direction: [0, 360], significant_wave_height: [0, 4], wave_mean_period: [1, 8], wave_direction: [0, 360] }

describe('Event Mode accelerated acceptance harness', () => {
  for (const scenario of scenarios) it(`${scenario}: deterministic complete catalogue, cadence and bounds`, () => {
    const frames = runs[scenario]
    expect(frames).toHaveLength(EVENT_FRAMES[scenario])
    expect(generateEvent(scenario)).toEqual(frames)
    expect(new Set(frames.map(f => f.observedAt)).size).toBe(frames.length)
    frames.forEach((frame, i) => {
      if (i) expect(Date.parse(frame.observedAt) - Date.parse(frames[i - 1].observedAt)).toBe(STEP_MS)
      expect(frame.observations).toHaveLength(69)
      expect(new Set(frame.observations.map(r => `${r.buoySlug}/${r.key}/${r.depthM}`)).size).toBe(69)
      for (const row of frame.observations) {
        expect(catalogue.some(c => c.key === row.key && c.depthM === row.depthM && c.unit)).toBe(true)
        expect(Number.isFinite(row.value)).toBe(true)
        expect(row.value).toBeGreaterThanOrEqual(bounds[row.key][0])
        expect(row.value).toBeLessThanOrEqual(bounds[row.key][1])
      }
      for (const b of buoys) expect(value(frame, b.slug, 'wind_gust')).toBeGreaterThanOrEqual(value(frame, b.slug, 'wind_speed'))
    })
    expect(value(frames[0], 'west', 'water_temperature', 1)).not.toBe(value(frames[0], 'central', 'water_temperature', 1))
    expect(value(frames[0], 'east', 'water_temperature', 1)).not.toBe(value(frames[0], 'central', 'water_temperature', 1))
    expect(catalogue.find(c => c.key === 'current_direction')?.direction).toBe('to')
    expect(catalogue.find(c => c.key === 'wind_direction')?.direction).toBe('from')
    expect(catalogue.find(c => c.key === 'wave_direction')?.direction).toBe('from')
  }, 30000)
  it('normal is exactly the underlying normal generator after pre-roll', () => {
    const start = Date.parse('2026-07-15T00:00:00Z')
    let state = createInitialState(EVENT_SEEDS.normal, new Date(start - 72 * STEP_MS).toISOString())
    for (let i = 0; i < 72; i++) state = advanceOneStep(state, new Date(start - (71 - i) * STEP_MS).toISOString()).state
    for (let i = 0; i < EVENT_FRAMES.normal; i++) {
      const step = advanceOneStep(state, new Date(start + (i + 1) * STEP_MS).toISOString())
      expect(runs.normal[i].observations).toEqual(step.observations)
      state = step.state
    }
  })
  it('storm has lagged wave response and recovery', () => {
    const f = runs.storm, series = (key: string) => f.map(x => value(x, 'central', key))
    const wind = series('wind_speed'), wave = series('significant_wave_height'), pressure = series('barometric_pressure')
    expect(Math.max(...wind) - wind[0]).toBeGreaterThan(3)
    expect(wave.indexOf(Math.max(...wave))).toBeGreaterThan(wind.indexOf(Math.max(...wind)))
    expect(wind.at(-1)!).toBeLessThan(Math.max(...wind) - 2)
    expect(wave.at(-1)!).toBeLessThan(Math.max(...wave) - 0.3)
    expect(pressure.indexOf(Math.min(...pressure))).toBeLessThan(f.length * 0.8)
  })
  it('turnover gradually mixes temperature and oxygen at all buoys', () => {
    const f = runs.turnover
    for (const b of buoys) {
      const gradient = f.map(x => value(x, b.slug, 'water_temperature', 1) - value(x, b.slug, 'water_temperature', 8))
      const initial = f.slice(0, 18), mixed = f.slice(-18)
      const satGap = (x: EventFrame) => Math.abs(value(x, b.slug, 'dissolved_oxygen_saturation', 1) - value(x, b.slug, 'dissolved_oxygen_saturation', 8))
      const oxygenGapMgL = (x: EventFrame) => {
        const surfaceT = value(x, b.slug, 'water_temperature', 1), deepT = value(x, b.slug, 'water_temperature', 8)
        return Math.abs(value(x, b.slug, 'dissolved_oxygen_saturation', 1) / 100 * oxygenSaturationMgL(surfaceT) - value(x, b.slug, 'dissolved_oxygen_saturation', 8) / 100 * oxygenSaturationMgL(deepT))
      }
      const mean = (xs: number[]) => xs.reduce((a, v) => a + v, 0) / xs.length
      expect(mean(initial.map((_, i) => Math.abs(gradient[i])))).toBeGreaterThanOrEqual(3)
      expect(mean(initial.map(satGap))).toBeGreaterThanOrEqual(8)
      expect(mean(mixed.map(x => Math.abs(value(x, b.slug, 'water_temperature', 1) - value(x, b.slug, 'water_temperature', 8))))).toBeLessThanOrEqual(1.5)
      const initialMgL = mean(initial.map(oxygenGapMgL)), mixedMgL = mean(mixed.map(oxygenGapMgL))
      expect(mixedMgL).toBeLessThanOrEqual(initialMgL * 0.4)
      expect(mean(mixed.map(satGap))).toBeLessThanOrEqual(5)
      expect(mean(mixed.map(satGap))).toBeLessThan(mean(initial.map(satGap)))
      expect(Math.max(...gradient.slice(1).map((v, i) => Math.abs(v - gradient[i])))).toBeLessThan(0.2)
      expect(Math.max(...f.slice(1).map((x, i) => Math.abs(value(x, b.slug, 'dissolved_oxygen_saturation', 1) - value(f[i], b.slug, 'dissolved_oxygen_saturation', 1))))).toBeLessThan(10)
    }
  })
  it('HAB-like pigments grow independently over many hours under calmer conditions', () => {
    const f = runs.hab
    for (const b of buoys) {
      const p = f.map(x => value(x, b.slug, 'phycocyanin', 1)), c = f.map(x => value(x, b.slug, 'chlorophyll', 1))
      expect(Math.max(...p)).toBeGreaterThan(2 * p[0])
      expect(p.indexOf(Math.max(...p))).toBeGreaterThan(36)
      expect(Math.max(...c)).toBeGreaterThan(c[0] * 1.2)
      expect(c.at(-1)! / p.at(-1)!).not.toBeCloseTo(c[0] / p[0], 1)
    }
    expect(Math.max(...f.map(x => value(x, 'central', 'wind_speed')))).toBeLessThan(Math.max(...runs.storm.map(x => value(x, 'central', 'wind_speed'))))
  })
})
