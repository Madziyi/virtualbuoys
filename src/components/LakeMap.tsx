import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { buoys, catalogue } from '../simulation/catalogue'
import { HistoryChart } from './HistoryChart'
import { compass, fetchHistory, fetchLatest, makeCsv, type Latest, type Observation } from '../lib/explorer'

setWorkerUrl(workerUrl)
const style: StyleSpecification = { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] }
const parameters = catalogue.filter((item, index) => catalogue.findIndex(p => p.key === item.key) === index)
const groups: [string, string[]][] = [
  ['Weather', ['air_temperature','barometric_pressure','wind_speed','wind_gust','wind_direction']],
  ['Water quality', ['dissolved_oxygen_saturation','phycocyanin','chlorophyll','cdom','turbidity']],
  ['Water column', ['water_temperature']],
  ['Waves & currents', ['significant_wave_height','wave_mean_period','wave_direction','current_speed','current_direction']],
]
const education: Record<string, [string,string]> = {
  water_temperature: ['Water temperature at a virtual depth.', 'Compare depths to explore how the water column changes.'],
  current_speed: ['How quickly water moves at a virtual depth.', 'Compare flow between depths and over time.'],
  current_direction: ['The compass bearing water moves toward at a virtual depth.', 'Explore how the direction of flow changes.'],
  dissolved_oxygen_saturation: ['The percentage of oxygen saturation in water at a virtual depth.', 'Compare oxygen conditions across depths and time.'],
  phycocyanin: ['A pigment associated with cyanobacteria.', 'Changes can help explore bloom-like conditions.'],
  chlorophyll: ['A pigment associated with photosynthetic organisms.', 'Changes can help explore variations in algae.'],
  cdom: ['Colored dissolved organic matter represented as a relative synthetic signal, not an absolute concentration.', 'Compare changes in this signal over time.'],
  turbidity: ['A measure of water cloudiness.', 'Explore changes in suspended material.'],
  air_temperature: ['The temperature of air near the lake.', 'Compare the weather with water temperatures.'],
  barometric_pressure: ['The pressure exerted by the atmosphere.', 'Follow changing weather patterns.'],
  wind_speed: ['The sustained speed of the wind.', 'Explore its relationship with waves and currents.'],
  wind_gust: ['A short peak in wind speed.', 'Compare brief stronger winds with sustained wind.'],
  wind_direction: ['The compass bearing the wind comes from.', 'Explore where winds approach the lake from.'],
  significant_wave_height: ['A representative height of the larger waves.', 'Compare wave conditions as weather changes.'],
  wave_mean_period: ['The average time between waves.', 'Explore how the spacing of waves changes.'],
  wave_direction: ['The compass bearing waves come from.', 'Explore where waves approach from.'],
}
const format = (value: number, unit: string, direction?: string) => direction ? `${value.toFixed(1)}° ${compass(value)} ${direction.toUpperCase()}` : `${value.toFixed(2)} ${unit === '1' ? 'relative' : unit}`

export function LakeMap() {
  const container = useRef<HTMLDivElement>(null), markers = useRef<Record<string, HTMLButtonElement>>({})
  const [selected, setSelected] = useState('central'), [key, setKey] = useState('water_temperature'), [range, setRange] = useState('24h')
  const [latest, setLatest] = useState<Latest[]>([]), [history, setHistory] = useState<Observation[]>([])
  const [latestStatus, setLatestStatus] = useState('Loading latest observations…'), [historyStatus, setHistoryStatus] = useState('Loading history…'), [refresh, setRefresh] = useState(0)
  const buoy = buoys.find(b => b.slug === selected)!, parameter = parameters.find(p => p.key === key)!
  useEffect(() => {
    if (!container.current) return
    const map = new MapLibreMap({container: container.current, style: import.meta.env.VITE_MAP_STYLE_URL || style, center: [-82.72,41.99], zoom: 8.2, attributionControl: {compact: true}})
    map.addControl(new NavigationControl(), 'top-right')
    map.once('load', () => buoys.forEach(site => { const button = document.createElement('button'); button.type = 'button'; button.className = 'virtual-buoy-marker'; button.textContent = site.slug[0].toUpperCase(); button.setAttribute('aria-label', `Select ${site.name}`); button.setAttribute('aria-pressed', String(site.slug === 'central')); button.onclick = () => setSelected(site.slug); markers.current[site.slug] = button; new Marker({element: button}).setLngLat([site.longitude,site.latitude]).addTo(map) }))
    return () => { map.remove(); markers.current = {} }
  }, [])
  useEffect(() => { Object.entries(markers.current).forEach(([slug,button]) => button.setAttribute('aria-pressed', String(slug === selected))) }, [selected])
  useEffect(() => { let active = true; const load = () => fetchLatest().then(rows => { if (active) { setLatest(rows); setLatestStatus(rows.length ? '' : 'No observations yet.'); setRefresh(n => n+1) } }).catch(() => { if (active) setLatestStatus('Latest observations are temporarily unavailable.') }); void load(); const timer = window.setInterval(load, 60000); return () => {active = false; window.clearInterval(timer)} }, [])
  useEffect(() => { let active = true; const end = new Date(), days = range === '24h' ? 1 : range === '3d' ? 3 : 7; setHistoryStatus('Loading history…'); setHistory([]); fetchHistory(selected,key,new Date(end.getTime()-days*86400000).toISOString(),end.toISOString()).then(rows => {if (active) {setHistory(rows); setHistoryStatus('')}}).catch(() => {if (active) setHistoryStatus('History is temporarily unavailable.')}); return () => {active = false} }, [selected,key,range,refresh])
  const selectedRows = latest.filter(r => r.buoy_slug === selected), timestamp = selectedRows.reduce((a,r) => r.observed_at > a ? r.observed_at : a, '')
  const download = () => { const blob = new Blob([makeCsv(history,buoy,parameter)], {type:'text/csv;charset=utf-8'}), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href=url; a.download=`${selected}-${key.replaceAll('_','-')}-${range}.csv`; a.click(); URL.revokeObjectURL(url) }
  return <>
    <div className="dashboard-grid">
    <section className="map-card" aria-label="Western Lake Erie virtual buoy map"><div className="map-heading"><div><span className="eyebrow">Virtual buoy network</span><h2>Western Lake Erie</h2></div></div><div className="map-frame" ref={container} data-testid="maplibre-map" />
      <div className="buoy-summaries" aria-label="Select a virtual buoy">{buoys.map(site => <button className="buoy-summary" type="button" key={site.slug} aria-pressed={selected === site.slug} onClick={() => setSelected(site.slug)}><span className="buoy-summary-tag">VIRTUAL · SYNTHETIC</span><strong>{site.name}</strong></button>)}</div><p className="map-caption">Illustrative Essex County nearshore sites · Synthetic educational data only</p>
    </section>
    <section className="detail"><span className="eyebrow">VIRTUAL · SYNTHETIC</span><h2>{buoy.name}</h2><p>Data updates every 10 minutes. {timestamp ? <>Latest observation: <time dateTime={timestamp}>{new Date(timestamp).toLocaleString()}</time>.</> : latestStatus}</p><p className="coordinates">{buoy.latitude.toFixed(3)}° N · {Math.abs(buoy.longitude).toFixed(3)}° W</p>
      <div className="reading-groups">{groups.map(([name,keys]) => <section key={name}><h3>{name}</h3>{keys.map(k => {const p = parameters.find(item => item.key === k)!; const readings = selectedRows.filter(r => r.key === k).sort((a,b) => (a.depth_m ?? 0)-(b.depth_m ?? 0)); return <div className="reading" key={k}><button type="button" onClick={() => {setKey(k); document.getElementById('history')?.scrollIntoView()}}>{p.label}</button><span>{readings.length ? readings.map(r => `${r.depth_m === null ? '' : `${r.depth_m} m: `}${format(r.value,p.unit,p.direction)}`).join(' · ') : '—'}</span></div>})}</section>)}</div>
    </section>
    </div>
    <section className="history" id="history"><span className="eyebrow">A closer look</span><h2>Explore the data</h2><p>Synthetic · educational. Select a parameter to follow its observations over time.</p><div className="history-controls"><label>Parameter <select value={key} onChange={e => setKey(e.target.value)}>{parameters.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label><fieldset><legend>Time range</legend>{['24h','3d','7d'].map(r => <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)}>{r === '24h' ? '24 h' : r === '3d' ? '3 d' : '7 d'}</button>)}</fieldset><button type="button" className="button button-primary" onClick={download} disabled={!history.length || !!historyStatus}>Download CSV</button></div>
      <div className="chart-wrap"><h3>{parameter.label} · {parameter.unit === '1' ? 'relative' : parameter.unit}</h3>{historyStatus ? <p role="status">{historyStatus}</p> : <HistoryChart rows={history} direction={parameter.direction} unit={parameter.unit} range={range} label={parameter.label}/>}</div>
      <div className="education"><div><h3>What is it?</h3><p>{education[key][0]}</p></div><div><h3>Why look at it?</h3><p>{education[key][1]}</p></div>{parameter.direction && <p>Bearings are clockwise from north: 0° N, 90° E, 180° S, 270° W. {parameter.direction === 'from' ? 'Direction describes where wind or waves come FROM.' : 'Direction describes where water moves TO.'} Points are shown without connecting lines to avoid a false swing across north.</p>}</div>
      <details><summary>View exact observations ({history.length})</summary><div className="table-wrap"><table><thead><tr><th>Time (UTC)</th><th>Depth</th><th>Value</th></tr></thead><tbody>{history.map(r => <tr key={`${r.observed_at}-${r.depth_m}`}><td>{new Date(r.observed_at).toISOString()}</td><td>{r.depth_m === null ? '—' : `${r.depth_m} m`}</td><td>{r.value} {parameter.unit === '1' ? 'relative' : parameter.unit}{parameter.direction ? ` ${compass(r.value)} ${parameter.direction.toUpperCase()}` : ''}</td></tr>)}</tbody></table></div></details>
    </section>
  </>
}
