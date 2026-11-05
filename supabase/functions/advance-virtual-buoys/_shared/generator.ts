import { buoys, catalogue } from './catalogue.ts'

export const STEP_MS = 10 * 60 * 1000
export const GENERATOR_SEED = 20261105

export type RegionalState = {
  air: number; pressure: number; wind: number; windBearing: number
  wave: number; wavePeriod: number; waveBearing: number; stratification: number
  mix: number; surfaceTemperature: number
}
export type BuoyState = {
  temperatures: [number, number, number]
  oxygen: [number, number]
  phyco: number; chlorophyll: number; cdom: number; turbidity: number
  currents: [[number, number], [number, number], [number, number]]
}
export type GeneratorState = {
  version: 1; seed: number; rng: number; tick: number
  lastObservedAt: string | null
  backfillFirstAt?: string
  backfillThroughAt?: string
  regional: RegionalState
  buoys: BuoyState[]
  history: RegionalState[]
}
export type GeneratedObservation = { buoySlug: string; key: string; depthM: number | null; value: number }
export type GeneratedStep = { observedAt: string; state: GeneratorState; observations: GeneratedObservation[]; regional: RegionalState }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const wrap = (degrees: number) => ((degrees % 360) + 360) % 360

function random(state: GeneratorState): number {
  state.rng = (state.rng + 0x6d2b79f5) | 0
  let t = state.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function normal(state: GeneratorState): number {
  const a = Math.max(random(state), 1e-9)
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * random(state))
}

function seasonalTargets(at: Date) {
  const yearProgress = (at.getTime() - Date.UTC(at.getUTCFullYear(), 0, 1)) / (365.25 * 24 * 60 * 60 * 1000)
  const hour = at.getUTCHours() + at.getUTCMinutes() / 60
  const phase = 2 * Math.PI * (yearProgress - 0.55)
  return {
    air: 16.4 + 12.0 * Math.cos(phase) + 1.2 * Math.sin((hour - 9) * Math.PI / 12),
    water: 13.3 + 10.3 * Math.cos(phase),
    stratification: Math.max(0, 4.0 * Math.cos(phase - 0.05)),
  }
}

export function createInitialState(seed: number, startAt: string): GeneratorState {
  const targets = seasonalTargets(new Date(startAt))
  return {
    version: 1, seed, rng: seed | 0, tick: 0, lastObservedAt: null,
    regional: { air: targets.air, pressure: 1014, wind: 4.2, windBearing: 245, wave: 0.7, wavePeriod: 2.5, waveBearing: 250, stratification: targets.stratification, mix: 0.15, surfaceTemperature: targets.water },
    buoys: buoys.map((buoy) => ({
      temperatures: [targets.water + buoy.waterOffset, targets.water + buoy.waterOffset - targets.stratification * 0.42, targets.water + buoy.waterOffset - targets.stratification],
      oxygen: [113 + buoy.waterOffset, 108 + buoy.waterOffset],
      phyco: 1.35 * buoy.biologyOffset, chlorophyll: 2.9 * buoy.biologyOffset,
      cdom: 0.72 + (1 - buoy.biologyOffset) * 1.2, turbidity: buoy.turbidityBase,
      currents: [[0.1, 0.04], [0.085, 0.03], [0.07, 0.02]],
    })),
    history: [],
  }
}

function directionFromComponents(east: number, north: number) {
  return wrap(Math.atan2(east, north) * 180 / Math.PI)
}

export function advanceOneStep(previous: GeneratorState, observedAt: string): GeneratedStep {
  if (previous.lastObservedAt && Date.parse(observedAt) <= Date.parse(previous.lastObservedAt)) {
    return { observedAt: previous.lastObservedAt, state: structuredClone(previous), observations: [], regional: structuredClone(previous.regional) }
  }
  const state = structuredClone(previous)
  const at = new Date(observedAt)
  const target = seasonalTargets(at)
  const old = state.regional
  const windInnovation = normal(state)
  const front = Math.sin(state.tick / 510 + state.seed % 37) * 1.25 + Math.sin(state.tick / 127 + 2.1) * 0.55
  const wind = clamp(mix(old.wind, 4.8 + front + Math.abs(windInnovation) * 0.48, 0.065) + windInnovation * 0.15, 0.2, 14)
  const windBearing = wrap(old.windBearing + normal(state) * 1.9 + Math.sin(state.tick / 260) * 0.3)
  const swell = Math.sin(state.tick / 143 + 0.7) * 0.2 + Math.sin(state.tick / 53 + 1.4) * 0.08
  const waveTarget = clamp(0.4 + wind * 0.15 + swell, 0.25, 2.7)
  const wave = clamp(mix(old.wave, waveTarget, 0.09) + normal(state) * 0.02, 0.15, 3.1)
  const regional: RegionalState = {
    air: mix(old.air, target.air, 0.012) + normal(state) * 0.085,
    pressure: clamp(mix(old.pressure, 1014 - front * 3.2, 0.018) + normal(state) * 0.3, 980, 1040),
    wind, windBearing,
    wave,
    wavePeriod: clamp(mix(old.wavePeriod, 1.25 + wave * 1.15, 0.06) + normal(state) * 0.012, 1, 8),
    waveBearing: wrap(mix(old.waveBearing, windBearing, 0.045) + normal(state) * 0.45),
    stratification: mix(old.stratification, target.stratification * Math.exp(-wind / 28), 0.004),
    mix: clamp(mix(old.mix, wind / 14, 0.035), 0, 1),
    surfaceTemperature: mix(old.surfaceTemperature, target.water, 0.0014) + normal(state) * 0.025,
  }
  state.history = [...state.history, regional].slice(-4)
  const observations: GeneratedObservation[] = []

  state.buoys = state.buoys.map((b, i) => {
    const site = buoys[i]
    const forcing = state.history[Math.max(0, state.history.length - site.lagSteps)] ?? regional
    const water = [...b.temperatures] as [number, number, number]
    const targets = [forcing.surfaceTemperature + site.waterOffset, forcing.surfaceTemperature + site.waterOffset - forcing.stratification * 0.42, forcing.surfaceTemperature + site.waterOffset - forcing.stratification]
    water[0] = mix(water[0], targets[0], 0.012) + normal(state) * 0.012
    water[1] = mix(water[1], targets[1], 0.01) + normal(state) * 0.01
    water[2] = mix(water[2], targets[2], 0.009) + normal(state) * 0.009
    const oxygen: [number, number] = [
      clamp(mix(b.oxygen[0], 111 + (water[0] - 18) * -0.45 + forcing.mix * 9, 0.018) + normal(state) * 0.22, 82, 145),
      clamp(mix(b.oxygen[1], 106 + (water[2] - 18) * -0.38 + forcing.mix * 12, 0.014) + normal(state) * 0.18, 78, 142),
    ]
    const biologicalSignal = Math.sin(state.tick / (900 + i * 130) + i * 1.7)
    const phyco = clamp(mix(b.phyco, Math.max(0.08, (1.2 + biologicalSignal * 0.45 + forcing.surfaceTemperature * 0.018) * site.biologyOffset), 0.025) * Math.exp(normal(state) * 0.025), 0.03, 9.5)
    const chlorophyll = clamp(mix(b.chlorophyll, Math.max(0.3, (2.5 + Math.sin(state.tick / (1200 + i * 160) + 0.8) * 0.8) * site.biologyOffset), 0.018) * Math.exp(normal(state) * 0.02), 0.2, 12)
    const cdom = clamp(mix(b.cdom, 0.62 + 0.18 * Math.sin(state.tick / (1500 + i * 120) + i) + site.biologyOffset * 0.08, 0.015) + normal(state) * 0.006, 0, 2.8)
    const turbidity = clamp(mix(b.turbidity, site.turbidityBase + Math.max(0, forcing.wave - 0.5) * (0.18 + i * 0.025), 0.025) + normal(state) * 0.035, 0.05, 11.8)
    const currents = b.currents.map(([east, north], depthIndex) => {
      const depthScale = [1, 0.82, 0.65][depthIndex]
      const flowPhase = state.tick / (170 + i * 35) + i * 1.9 + depthIndex * 0.7
      const nextEast = mix(east, (0.09 + Math.sin(flowPhase) * 0.055 + site.currentOffset[0]) * depthScale, 0.12) + normal(state) * 0.0025
      const nextNorth = mix(north, (0.035 + Math.cos(flowPhase * 0.8) * 0.045 + site.currentOffset[1]) * depthScale, 0.12) + normal(state) * 0.0025
      return [nextEast, nextNorth] as [number, number]
    }) as BuoyState['currents']
    const next: BuoyState = { temperatures: water, oxygen, phyco, chlorophyll, cdom, turbidity, currents }
    const values: Record<string, number[]> = {
      water_temperature: water,
      current_speed: currents.map(([east, north]) => Math.hypot(east, north)),
      current_direction: currents.map(([east, north]) => directionFromComponents(east, north)),
      dissolved_oxygen_saturation: oxygen,
      phycocyanin: [phyco], chlorophyll: [chlorophyll], cdom: [cdom], turbidity: [turbidity],
      air_temperature: [regional.air], barometric_pressure: [regional.pressure], wind_speed: [wind],
      wind_gust: [wind + Math.max(0.2, wind * 0.12 + Math.abs(normal(state)) * 0.48)],
      wind_direction: [windBearing], significant_wave_height: [wave], wave_mean_period: [regional.wavePeriod], wave_direction: [regional.waveBearing],
    }
    for (const measurement of catalogue) {
      const index = measurement.key === 'water_temperature' || measurement.key.startsWith('current_') ? [1, 4, 8].indexOf(measurement.depthM ?? -1)
        : measurement.key === 'dissolved_oxygen_saturation' ? [1, 8].indexOf(measurement.depthM ?? -1) : 0
      const value = values[measurement.key][index]
      observations.push({ buoySlug: site.slug, key: measurement.key, depthM: measurement.depthM, value })
    }
    return next
  })
  state.tick += 1
  state.lastObservedAt = new Date(observedAt).toISOString()
  state.regional = regional
  return { observedAt: state.lastObservedAt, state, observations, regional }
}

export function simulateDays(seed: number, startAt: string, days: number) {
  const count = Math.round(days * 24 * 60 / 10)
  let state = createInitialState(seed, startAt)
  const steps: GeneratedStep[] = []
  let time = new Date(startAt).getTime()
  for (let i = 0; i < count; i += 1) {
    time += STEP_MS
    const step = advanceOneStep(state, new Date(time).toISOString())
    state = step.state
    steps.push(step)
  }
  return { state, steps }
}

export function isStepDue(lastObservedAt: string | null, now: string) {
  const target = Math.floor(new Date(now).getTime() / STEP_MS) * STEP_MS
  return !lastObservedAt || target > new Date(lastObservedAt).getTime()
}
