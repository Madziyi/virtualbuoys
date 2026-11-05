import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'

const server = await createServer({
  configFile: false,
  plugins: [react()],
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { simulateDays, GENERATOR_SEED, STEP_MS } = await server.ssrLoadModule('/src/simulation/generator.ts')
  const { buoys } = await server.ssrLoadModule('/src/simulation/catalogue.ts')
  const startAt = '2026-07-01T00:00:00.000Z'
  const run = simulateDays(GENERATOR_SEED, startAt, 30)
  const repeated = simulateDays(GENERATOR_SEED, startAt, 30)
  const timestamps = run.steps.map((step) => Date.parse(step.observedAt))
  const rows = run.steps.flatMap((step) => step.observations)
  const correlation = (xs, ys) => {
    const mx = xs.reduce((sum, x) => sum + x, 0) / xs.length
    const my = ys.reduce((sum, y) => sum + y, 0) / ys.length
    const cross = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0)
    const sx = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0))
    const sy = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0))
    return cross / (sx * sy)
  }
  const quantile = (values, p) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)]
  const get = (step, slug, key, depthM = null) => step.observations.find((row) => row.buoySlug === slug && row.key === key && row.depthM === depthM).value
  const windWave = correlation(run.steps.map((step) => step.regional.wind), run.steps.map((step) => step.regional.wave))
  const crossBuoy = correlation(run.steps.map((step) => get(step, 'west', 'water_temperature', 1)), run.steps.map((step) => get(step, 'central', 'water_temperature', 1)))
  const quantiles = Object.fromEntries(['phycocyanin', 'chlorophyll', 'cdom', 'turbidity'].map((key) => [key, quantile(rows.filter((row) => row.key === key).map((row) => row.value), 0.95)]))
  const delta = (getter) => quantile(run.steps.slice(1).flatMap((step, i) => buoys.map((buoy) => Math.abs(getter(step, buoy.slug) - getter(run.steps[i], buoy.slug)))), 0.9)
  const rateP90 = {
    airTemperatureC: delta((step) => step.regional.air),
    windSpeedMps: delta((step) => step.regional.wind),
    windGustMps: delta((step, slug) => get(step, slug, 'wind_gust')),
    waveHeightM: delta((step) => step.regional.wave),
    waterTemperatureC: quantile(run.steps.slice(1).flatMap((step, i) => buoys.flatMap((buoy) => [1, 4, 8].map((depth) => Math.abs(get(step, buoy.slug, 'water_temperature', depth) - get(run.steps[i], buoy.slug, 'water_temperature', depth))))), 0.9),
  }
  const allFinite = rows.every((row) => Number.isFinite(row.value))
  const cadenceOk = timestamps.length === 4320 && new Set(timestamps).size === 4320 && timestamps.every((t, i) => i === 0 || t - timestamps[i - 1] === STEP_MS)
  const gustOk = run.steps.every((step) => buoys.every((buoy) => get(step, buoy.slug, 'wind_gust') >= get(step, buoy.slug, 'wind_speed')))
  const currentOk = run.steps.every((step) => buoys.every((buoy) => [1, 4, 8].every((depth) => get(step, buoy.slug, 'current_speed', depth) >= 0 && get(step, buoy.slug, 'current_direction', depth) >= 0 && get(step, buoy.slug, 'current_direction', depth) < 360)))
  const maxTemperatureStep = Math.max(...run.steps.slice(1).flatMap((step, i) => buoys.flatMap((buoy) => [1, 4, 8].map((depth) => Math.abs(get(step, buoy.slug, 'water_temperature', depth) - get(run.steps[i], buoy.slug, 'water_temperature', depth))))))
  const valuesByBuoy = buoys.map((buoy) => run.steps.map((step) => get(step, buoy.slug, 'water_temperature', 1)))
  const spatiallyDifferent = valuesByBuoy.every((values, i) => i === 0 || values.some((value, index) => value !== valuesByBuoy[i - 1][index]))
  const deterministic = createHash('sha256').update(JSON.stringify(run)).digest('hex') === createHash('sha256').update(JSON.stringify(repeated)).digest('hex')
  const report = {
    seed: GENERATOR_SEED,
    startAt,
    days: 30,
    timestampsPerBuoy: 4320,
    publicValues: rows.length,
    exactTenMinuteCadence: cadenceOk,
    uniqueTimestamps: new Set(timestamps).size,
    allFinite,
    deterministicRerun: deterministic,
    gustAtLeastWind: gustOk,
    currentSpeedAndDirectionValid: currentOk,
    maximumTenMinuteTemperatureChangeC: maxTemperatureStep,
    windWaveCorrelation: windWave,
    westCentralTemperatureCorrelation: crossBuoy,
    buoySeriesNotIdentical: spatiallyDifferent,
    waterQualityP95: quantiles,
    normalModeRateP90: rateP90,
    maxima: Object.fromEntries(['phycocyanin', 'chlorophyll', 'cdom', 'turbidity'].map((key) => [key, Math.max(...rows.filter((row) => row.key === key).map((row) => row.value))])),
  }
  console.log(JSON.stringify(report, null, 2))
  const check = (condition, message) => { if (!condition) throw new Error(`30-day acceptance failed: ${message}`) }
  check(cadenceOk, 'cadence or duplicate timestamps')
  check(allFinite && deterministic, 'non-finite values or non-deterministic rerun')
  check(gustOk && currentOk, 'gust/current constraints')
  check(maxTemperatureStep < 0.2, 'temperature continuity')
  check(windWave >= 0.4 && windWave <= 0.8, 'wind-wave correlation outside 0.4–0.8')
  check(crossBuoy > 0.9 && spatiallyDifferent, 'buoy series are not appropriately related/different')
  check(quantiles.phycocyanin <= 7.1 && quantiles.chlorophyll <= 8.5 && quantiles.cdom <= 2 && quantiles.turbidity <= 10.5, 'water-quality p95 outside historical robust envelopes')
  check(rateP90.airTemperatureC <= 0.26 && rateP90.windSpeedMps <= 0.56 && rateP90.windGustMps <= 0.94 && rateP90.waveHeightM <= 0.039 && rateP90.waterTemperatureC <= 0.05, 'rate-of-change p90 exceeds reference scale')
  check(report.maxima.phycocyanin < 10 && report.maxima.chlorophyll < 12 && report.maxima.cdom < 3 && report.maxima.turbidity < 12, 'unintentional HAB or extreme water-quality state')
} finally {
  await server.close()
}
