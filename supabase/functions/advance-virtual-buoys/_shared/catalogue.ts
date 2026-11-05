export type Measurement = {
  key: string
  label: string
  standardName: string
  unit: string
  depthM: number | null
  direction?: 'to' | 'from'
  relative?: boolean
}

export const catalogue: Measurement[] = [
  ...[1, 4, 8].map((depthM) => ({ key: 'water_temperature', label: 'Water temperature', standardName: 'sea_water_temperature', unit: '°C', depthM })),
  ...[1, 4, 8].map((depthM) => ({ key: 'current_speed', label: 'Current speed', standardName: 'sea_water_velocity', unit: 'm/s', depthM })),
  ...[1, 4, 8].map((depthM) => ({ key: 'current_direction', label: 'Current direction', standardName: 'sea_water_to_direction', unit: '°', depthM, direction: 'to' as const })),
  ...[1, 8].map((depthM) => ({ key: 'dissolved_oxygen_saturation', label: 'Dissolved oxygen saturation', standardName: 'fractional_saturation_of_oxygen_in_sea_water', unit: '%', depthM })),
  { key: 'phycocyanin', label: 'Phycocyanin', standardName: 'mass_concentration_of_phycocyanin_in_water', unit: 'µg/L', depthM: 1 },
  { key: 'chlorophyll', label: 'Chlorophyll', standardName: 'mass_concentration_of_chlorophyll_a_in_water', unit: 'µg/L', depthM: 1 },
  { key: 'cdom', label: 'CDOM (relative signal)', standardName: 'colored_dissolved_organic_matter_relative_signal', unit: '1', depthM: 1, relative: true },
  { key: 'turbidity', label: 'Turbidity', standardName: 'sea_water_turbidity', unit: 'NTU', depthM: 2 },
  { key: 'air_temperature', label: 'Air temperature', standardName: 'air_temperature', unit: '°C', depthM: null },
  { key: 'barometric_pressure', label: 'Barometric pressure', standardName: 'air_pressure', unit: 'hPa', depthM: null },
  { key: 'wind_speed', label: 'Wind speed', standardName: 'wind_speed', unit: 'm/s', depthM: null },
  { key: 'wind_gust', label: 'Wind gust', standardName: 'wind_speed_of_gust', unit: 'm/s', depthM: null },
  { key: 'wind_direction', label: 'Wind direction', standardName: 'wind_from_direction', unit: '°', depthM: null, direction: 'from' },
  { key: 'significant_wave_height', label: 'Significant wave height', standardName: 'sea_surface_wave_significant_height', unit: 'm', depthM: null },
  { key: 'wave_mean_period', label: 'Wave mean period', standardName: 'sea_surface_wave_mean_period', unit: 's', depthM: null },
  { key: 'wave_direction', label: 'Wave direction', standardName: 'sea_surface_wave_from_direction', unit: '°', depthM: null, direction: 'from' },
]

export const buoys = [
  { slug: 'west', name: 'West Virtual Buoy', latitude: 42.025, longitude: -82.96, lagSteps: 1, currentOffset: [0.035, 0.012] as const, waterOffset: 0.12, biologyOffset: 0.92, turbidityBase: 2.2 },
  { slug: 'central', name: 'Central Virtual Buoy', latitude: 41.985, longitude: -82.72, lagSteps: 2, currentOffset: [-0.018, 0.028] as const, waterOffset: -0.08, biologyOffset: 1.04, turbidityBase: 1.4 },
  { slug: 'east', name: 'East Virtual Buoy', latitude: 41.93, longitude: -82.49, lagSteps: 3, currentOffset: [0.012, -0.024] as const, waterOffset: 0.03, biologyOffset: 0.88, turbidityBase: 0.9 },
]
