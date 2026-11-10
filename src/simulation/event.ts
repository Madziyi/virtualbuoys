import { advanceOneStep, createInitialState, STEP_MS, type GeneratedObservation } from './generator'

export type Scenario = 'normal' | 'storm' | 'turnover' | 'hab'
export type EventFrame = { observedAt: string; observations: GeneratedObservation[] }
export const EVENT_VERSION = 'event-v1'
export const EVENT_FRAMES: Record<Scenario, number> = { normal: 144, storm: 144, turnover: 288, hab: 432 }
export const EVENT_SEEDS: Record<Scenario, number> = { normal: 5101, storm: 5102, turnover: 5103, hab: 5104 }
const STARTS: Record<Scenario, string> = { normal: '2026-07-15T00:00:00Z', storm: '2026-08-15T00:00:00Z', turnover: '2026-08-15T00:00:00Z', hab: '2026-07-15T00:00:00Z' }
const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t) }
const pulse = (x: number, start: number, rise: number, fall: number, end: number) => smooth((x - start) / (rise - start)) * (1 - smooth((x - fall) / (end - fall)))
// Freshwater polynomial approximation (mg/L) at local water temperature.
export const oxygenSaturationMgL = (temperatureC: number, pressureHpa = 1013.25) => {
  const t = temperatureC
  const atStandardPressure = 14.652 - 0.41022 * t + 0.007991 * t ** 2 - 0.000077774 * t ** 3
  return atStandardPressure * pressureHpa / 1013.25
}

/** Fixed, relative educational timelines; no live data or persistent state is used. */
export function generateEvent(scenario: Scenario): EventFrame[] {
  const start = Date.parse(STARTS[scenario])
  let state = createInitialState(EVENT_SEEDS[scenario], new Date(start - 72 * STEP_MS).toISOString())
  for (let i = 0; i < 72; i++) state = advanceOneStep(state, new Date(start - (71 - i) * STEP_MS).toISOString()).state
  const frames: EventFrame[] = []
  const oxygenMgL = new Map<string, [number, number]>()
  for (let i = 0; i < EVENT_FRAMES[scenario]; i++) {
    const step = advanceOneStep(state, new Date(start + (i + 1) * STEP_MS).toISOString())
    state = step.state
    const t = i / (EVENT_FRAMES[scenario] - 1)
    const wind = scenario === 'storm' ? pulse(t, 0.04, 0.3, 0.48, 0.86) : scenario === 'turnover' ? pulse(t, 0.07, 0.25, 0.67, 0.95) : 0
    const wave = scenario === 'storm' ? pulse(t, 0.10, 0.39, 0.56, 0.96) : scenario === 'turnover' ? pulse(t, 0.11, 0.32, 0.73, 1) : 0
    const mixing = scenario === 'turnover' ? smooth((t - 0.08) / 0.63) : scenario === 'storm' ? 0.18 * smooth((t - 0.18) / 0.65) : 0
    const growth = scenario === 'hab' ? smooth((t - 0.05) / 0.8) : 0
    if (scenario === 'turnover' && i === 0) {
      for (const slug of ['west', 'central', 'east']) {
        const surfaceTemp = step.observations.find(o => o.buoySlug === slug && o.key === 'water_temperature' && o.depthM === 1)!.value
        const deepTemp = step.observations.find(o => o.buoySlug === slug && o.key === 'water_temperature' && o.depthM === 8)!.value
        const surfaceSaturation = 112
        const deepSaturation = 91
        oxygenMgL.set(slug, [surfaceSaturation / 100 * oxygenSaturationMgL(surfaceTemp, step.regional.pressure), deepSaturation / 100 * oxygenSaturationMgL(deepTemp, step.regional.pressure)])
      }
    }
    if (scenario === 'turnover') {
      for (const slug of ['west', 'central', 'east']) {
        const pair = oxygenMgL.get(slug)!
        const rate = mixing * 0.055
        const transfer = (pair[0] - pair[1]) * rate / 2
        pair[0] -= transfer
        pair[1] += transfer
      }
    }
    const observations = step.observations.map((row) => {
      let value = row.value
      const station = ['west', 'central', 'east'].indexOf(row.buoySlug)
      if (row.key === 'wind_speed') value += 5 * wind
      if (row.key === 'wind_gust') value += 5.8 * wind
      if (row.key === 'barometric_pressure') value -= 13 * (scenario === 'storm' ? pulse(t, 0, 0.27, 0.45, 0.88) : 0)
      if (row.key === 'significant_wave_height') value += 0.9 * wave
      if (row.key === 'wave_mean_period') value += 0.65 * wave
      if (row.key === 'current_speed') value *= 1 + 0.35 * wave
      if (row.key === 'turbidity') value += wave * (0.35 + station * 0.14)
      if (row.key === 'water_temperature' && row.depthM !== null) value += mixing * (row.depthM === 1 ? -1.2 : row.depthM === 4 ? 0.15 : 1.4)
      if (row.key === 'dissolved_oxygen_saturation' && scenario === 'turnover' && row.depthM !== null) {
        if (row.depthM === 1 || row.depthM === 8) {
          const depthIndex = row.depthM === 1 ? 0 : 1
          const temperature = step.observations.find(o => o.buoySlug === row.buoySlug && o.key === 'water_temperature' && o.depthM === row.depthM)!.value + mixing * (row.depthM === 1 ? -1.2 : 1.4)
          value = oxygenMgL.get(row.buoySlug)![depthIndex] / oxygenSaturationMgL(temperature, step.regional.pressure) * 100
        }
      }
      if (row.key === 'phycocyanin') value = Math.min(9.5, value * (1 + 1.8 * growth))
      if (row.key === 'chlorophyll' && scenario === 'hab') value = Math.min(12, value * (1 + 0.8 * smooth((t - 0.13) / 0.8)))
      return { ...row, value }
    })
    frames.push({ observedAt: step.observedAt, observations })
  }
  return frames
}
