import { describe, expect, it } from 'vitest'
import { catalogue, buoys } from './catalogue'
import { advanceOneStep, GENERATOR_SEED, simulateDays, STEP_MS } from './generator'

const startAt = '2026-07-01T00:00:00.000Z'
const days = 30
const simulation = simulateDays(GENERATOR_SEED, startAt, days)

function quantile(values: number[], fraction: number) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * fraction)]
}

function correlation(xs: number[], ys: number[]) {
  const mx = xs.reduce((sum, x) => sum + x, 0) / xs.length
  const my = ys.reduce((sum, y) => sum + y, 0) / ys.length
  const covariance = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0)
  const sx = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0))
  const sy = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0))
  return covariance / (sx * sy)
}

function channel(step: (typeof simulation.steps)[number], slug: string, key: string, depthM: number | null = null) {
  return step.observations.find((row) => row.buoySlug === slug && row.key === key && row.depthM === depthM)!.value
}

describe('30-day normal-mode harness', () => {
  it('keeps fixed cadence, unique timestamps, and byte-identical seeded reruns', () => {
    expect(simulation.steps).toHaveLength(30 * 24 * 6)
    const timestamps = simulation.steps.map((step) => Date.parse(step.observedAt))
    expect(new Set(timestamps).size).toBe(timestamps.length)
    expect(timestamps.every((time, i) => i === 0 || time - timestamps[i - 1] === STEP_MS)).toBe(true)
    const repeated = simulateDays(GENERATOR_SEED, startAt, days)
    expect(JSON.stringify(repeated)).toBe(JSON.stringify(simulation))
  })

  it('keeps every public value finite and respects direction, speed, gust and temperature continuity', () => {
    const byKey = new Map(catalogue.map((measurement) => [`${measurement.key}:${measurement.depthM}`, measurement]))
    for (const step of simulation.steps) {
      expect(step.observations.every((row) => Number.isFinite(row.value))).toBe(true)
      for (const buoy of buoys) {
        expect(channel(step, buoy.slug, 'wind_gust')).toBeGreaterThanOrEqual(channel(step, buoy.slug, 'wind_speed'))
        for (const depthM of [1, 4, 8]) {
          expect(channel(step, buoy.slug, 'current_speed', depthM)).toBeGreaterThanOrEqual(0)
          const bearing = channel(step, buoy.slug, 'current_direction', depthM)
          expect(bearing).toBeGreaterThanOrEqual(0)
          expect(bearing).toBeLessThan(360)
        }
      }
    }
    const maxWaterChange = Math.max(...simulation.steps.slice(1).flatMap((step, i) =>
      buoys.flatMap((buoy) => [1, 4, 8].map((depth) => Math.abs(channel(step, buoy.slug, 'water_temperature', depth) - channel(simulation.steps[i], buoy.slug, 'water_temperature', depth))),
      ),
    ))
    expect(maxWaterChange).toBeLessThan(0.2)
    expect(byKey.size).toBe(catalogue.length)
  })

  it('shares regional forcing while preserving related, non-identical buoy water series', () => {
    const wind = simulation.steps.map((step) => step.regional.wind)
    const waves = simulation.steps.map((step) => step.regional.wave)
    const windWaveCorrelation = correlation(wind, waves)
    const west = simulation.steps.map((step) => channel(step, 'west', 'water_temperature', 1))
    const central = simulation.steps.map((step) => channel(step, 'central', 'water_temperature', 1))
    const east = simulation.steps.map((step) => channel(step, 'east', 'water_temperature', 1))
    const spatialCorrelation = correlation(west, central)
    const spatialDifference = west.some((value, i) => value !== central[i]) && central.some((value, i) => value !== east[i])
    console.info(JSON.stringify({ windWaveCorrelation, spatialCorrelation, spatialDifference }))
    expect(windWaveCorrelation).toBeGreaterThanOrEqual(0.4)
    expect(windWaveCorrelation).toBeLessThanOrEqual(0.8)
    expect(spatialCorrelation).toBeGreaterThan(0.9)
    expect(spatialDifference).toBe(true)
    expect(simulation.steps.every((step) => step.regional.wind === step.regional.wind && step.regional.wave === step.regional.wave)).toBe(true)
  })

  it('keeps normal water-quality levels and rates below reference envelopes and avoids incident states', () => {
    const all = simulation.steps.flatMap((step) => step.observations)
    const p95 = (key: string) => quantile(all.filter((row) => row.key === key).map((row) => row.value), 0.95)
    const peak = (key: string) => Math.max(...all.filter((row) => row.key === key).map((row) => row.value))
    expect(p95('phycocyanin')).toBeLessThanOrEqual(7.1)
    expect(p95('chlorophyll')).toBeLessThanOrEqual(8.5)
    expect(p95('cdom')).toBeLessThanOrEqual(2)
    expect(p95('turbidity')).toBeLessThanOrEqual(10.5)
    expect(peak('phycocyanin')).toBeLessThan(10)
    expect(peak('chlorophyll')).toBeLessThan(12)
    expect(peak('cdom')).toBeLessThan(3)
    expect(peak('turbidity')).toBeLessThan(12)
    const deltaP90 = (getter: (step: (typeof simulation.steps)[number], buoy: string) => number) => quantile(
      simulation.steps.slice(1).flatMap((step, i) => buoys.map((buoy) => Math.abs(getter(step, buoy.slug) - getter(simulation.steps[i], buoy.slug)))), 0.9,
    )
    expect(deltaP90((step) => step.regional.wind)).toBeLessThanOrEqual(0.56)
    expect(deltaP90((step) => step.regional.wave)).toBeLessThanOrEqual(0.039)
    expect(deltaP90((step) => step.regional.air)).toBeLessThanOrEqual(0.26)
    expect(deltaP90((step, slug) => channel(step, slug, 'wind_gust'))).toBeLessThanOrEqual(0.94)
    const temperatureDeltaP90 = quantile(simulation.steps.slice(1).flatMap((step, i) => buoys.flatMap((buoy) =>
      [1, 4, 8].map((depth) => Math.abs(channel(step, buoy.slug, 'water_temperature', depth) - channel(simulation.steps[i], buoy.slug, 'water_temperature', depth))),
    )), 0.9)
    expect(temperatureDeltaP90).toBeLessThanOrEqual(0.05)
    console.info(JSON.stringify({ p95: { phycocyanin: p95('phycocyanin'), chlorophyll: p95('chlorophyll'), cdom: p95('cdom'), turbidity: p95('turbidity') }, peaks: { phycocyanin: peak('phycocyanin'), chlorophyll: peak('chlorophyll'), cdom: peak('cdom'), turbidity: peak('turbidity') } }))
  })

  it('advances duplicate invocations idempotently at an already completed slot', () => {
    const step = simulation.steps[0]
    expect(Date.parse(step.observedAt) - Date.parse(startAt)).toBe(STEP_MS)
    const repeated = advanceOneStep(step.state, step.observedAt)
    expect(repeated.observedAt).toBe(step.observedAt)
    expect(repeated.state.tick).toBe(step.state.tick)
    expect(repeated.observations).toHaveLength(0)
  })
})
