import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { buoys, catalogue } from '../simulation/catalogue'
import { HistoryChart } from './HistoryChart'
import { ReadingCards } from './ReadingCards'
import { compass, fetchHistory, fetchLatest, makeCsv, type Latest, type Observation } from '../lib/explorer'
import { generateEvent, type EventFrame, type Scenario } from '../simulation/event'

setWorkerUrl(workerUrl)
const style: StyleSpecification = { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] }
const parameters = catalogue.filter((item, index) => catalogue.findIndex(p => p.key === item.key) === index)
function timeAgo(timestamp: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}
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
export function LakeMap() {
  const container = useRef<HTMLDivElement>(null), trends = useRef<HTMLDetailsElement>(null), markers = useRef<Record<string, HTMLButtonElement>>({})
  const [selected, setSelected] = useState('central'), [key, setKey] = useState('water_temperature'), [range, setRange] = useState('24h')
  const [latest, setLatest] = useState<Latest[]>([]), [history, setHistory] = useState<Observation[]>([])
  const [scenario, setScenario] = useState<Scenario>('storm'), [eventFrames, setEventFrames] = useState<EventFrame[] | null>(null), [frameIndex, setFrameIndex] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(5)
  const [latestStatus, setLatestStatus] = useState('Loading latest observations…'), [historyStatus, setHistoryStatus] = useState('Loading history…'), [refresh, setRefresh] = useState(0)
  const [ageClock, setAgeClock] = useState(Date.now())
  const buoy = buoys.find(b => b.slug === selected)!, parameter = parameters.find(p => p.key === key)!
  useEffect(() => {
    if (!container.current) return
    const map = new MapLibreMap({container: container.current, style: import.meta.env.VITE_MAP_STYLE_URL || style, center: [-82.72,41.99], zoom: 8.2, attributionControl: {compact: true}})
    map.addControl(new NavigationControl(), 'top-right')
    map.once('load', () => buoys.forEach(site => { const button = document.createElement('button'); button.type = 'button'; button.className = 'virtual-buoy-marker'; button.setAttribute('aria-label', `Select ${site.name}`); button.setAttribute('aria-pressed', String(site.slug === 'central')); const dot = document.createElement('span'); dot.className = 'virtual-buoy-dot'; dot.setAttribute('aria-hidden', 'true'); const label = document.createElement('span'); label.className = 'virtual-buoy-label'; label.textContent = site.name.replace(' Virtual Buoy', ''); button.append(dot, label); button.onclick = () => setSelected(site.slug); markers.current[site.slug] = button; new Marker({element: button, anchor: 'bottom'}).setLngLat([site.longitude,site.latitude]).addTo(map) }))
    return () => { map.remove(); markers.current = {} }
  }, [])
  useEffect(() => { Object.entries(markers.current).forEach(([slug,button]) => button.setAttribute('aria-pressed', String(slug === selected))) }, [selected])
  useEffect(() => { const timer = window.setInterval(() => setAgeClock(Date.now()), 30000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { let active = true; const load = () => fetchLatest().then(rows => { if (active) { setLatest(rows); setLatestStatus(rows.length ? '' : 'No observations yet.'); setRefresh(n => n+1) } }).catch(() => { if (active) setLatestStatus('Latest observations are temporarily unavailable.') }); void load(); const timer = window.setInterval(load, 60000); return () => {active = false; window.clearInterval(timer)} }, [])
  useEffect(() => { if (eventFrames && playing) { const timer = window.setInterval(() => setFrameIndex(i => { if (i >= eventFrames.length - 1) { setPlaying(false); return i } return i + 1 }), 1000 / speed); return () => window.clearInterval(timer) } }, [eventFrames, playing, speed])
  useEffect(() => { if (eventFrames) { setHistoryStatus(''); return } let active = true; const end = new Date(), days = range === '24h' ? 1 : range === '3d' ? 3 : 7; setHistoryStatus('Loading history…'); setHistory([]); fetchHistory(selected,key,new Date(end.getTime()-days*86400000).toISOString(),end.toISOString()).then(rows => {if (active) {setHistory(rows); setHistoryStatus('')}}).catch(() => {if (active) setHistoryStatus('History is temporarily unavailable.')}); return () => {active = false} }, [selected,key,range,refresh,eventFrames])
  const currentFrame = eventFrames?.[frameIndex]
  const scenarioMinutes = eventFrames ? Math.min((frameIndex + 1) * 10, eventFrames.length * 10) : 0
  const scenarioClock = `Day ${Math.floor(scenarioMinutes / 1440) + 1} · ${String(Math.floor((scenarioMinutes % 1440) / 60)).padStart(2,'0')}:${String(scenarioMinutes % 60).padStart(2,'0')}`
  const eventRows: Latest[] = currentFrame?.observations.filter(r => r.buoySlug === selected).map(r => ({buoy_slug:r.buoySlug,key:r.key,depth_m:r.depthM,value:r.value,observed_at:currentFrame.observedAt})) ?? []
  const liveRows = latest.filter(r => r.buoy_slug === selected)
  const selectedRows = eventFrames ? eventRows : liveRows
  const timestamp = liveRows.reduce((a,r) => r.observed_at > a ? r.observed_at : a, '')
  const eventHistory: Observation[] = eventFrames && currentFrame ? eventFrames.slice(0, frameIndex + 1).flatMap(frame => frame.observations.filter(r => r.buoySlug === selected && r.key === key).map(r => ({depth_m:r.depthM,value:r.value,observed_at:frame.observedAt,provenance:'synthetic_event'}))) : []
  const visibleHistory = eventFrames ? eventHistory : history
  const download = () => { const csv = eventFrames ? ['buoy_slug,buoy_name,parameter_key,parameter_name,depth_m,value,unit,direction_convention,observed_at,simulated_at,data_source,scenario', ...visibleHistory.map(r => [selected,buoy.name,key,parameter.label,r.depth_m,r.value,parameter.unit,parameter.direction ?? '',r.observed_at,r.observed_at,'synthetic_event',scenario].map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(','))].join('\r\n')+'\r\n' : makeCsv(history,buoy,parameter); const blob = new Blob([csv], {type:'text/csv;charset=utf-8'}), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href=url; a.download=eventFrames ? `${selected}-${scenario}-${key.replaceAll('_','-')}-event.csv` : `${selected}-${key.replaceAll('_','-')}-${range}.csv`; a.click(); URL.revokeObjectURL(url) }
  const startEvent = () => { setEventFrames(generateEvent(scenario)); setFrameIndex(0); setPlaying(true) }
  const exitEvent = () => { setPlaying(false); setEventFrames(null); setFrameIndex(0); setRefresh(n => n + 1); void fetchLatest().then(setLatest).catch(() => setLatestStatus('Latest observations are temporarily unavailable.')) }
  return <>
    <section className={`event-panel${eventFrames ? ' event-active' : ''}`} aria-label="Event Mode">
      <div className="event-panel-copy"><span className="eyebrow">Explore a scenario</span><h2>Event Mode</h2><p>Play an educational simulation of changing lake conditions. It uses a separate synthetic baseline, not current readings or a forecast.</p></div>
      <div className="event-controls">
        <label>Scenario <select value={scenario} onChange={e => setScenario(e.target.value as Scenario)} disabled={!!eventFrames}><option value="normal">Normal · 24 hours</option><option value="storm">Storm · 24 hours</option><option value="turnover">Turnover · 48 hours</option><option value="hab">HAB-like · 72 hours</option></select></label>
        {!eventFrames ? <button className="button button-primary" onClick={startEvent}>Start</button> : <>
          <strong className="event-warning">SYNTHETIC EVENT · NOT CURRENT CONDITIONS</strong>
          <div className="event-session-controls"><button type="button" onClick={() => setPlaying(v => !v)}>{playing ? 'Pause' : 'Play'}</button><button type="button" onClick={() => {setFrameIndex(0);setPlaying(false)}}>Restart</button><button type="button" onClick={exitEvent}>Exit Event Mode</button>
          <label>Speed <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>{[1,2,5,10].map(v => <option key={v} value={v}>{v}×</option>)}</select></label></div>
          <div className="event-progress"><span>{scenarioClock}</span><progress max={eventFrames.length - 1} value={frameIndex} aria-label="Scenario progress"/><span>{Math.round(frameIndex / (eventFrames.length - 1) * 100)}%</span></div>
          <small>1× = one 10-minute simulated reading per second. Faster settings play more frames each second.</small>
        </>}
      </div>
    </section>
    <div className="dashboard-grid">
    <section className="map-card" aria-label="Western Lake Erie virtual buoy map"><div className="map-heading"><div><span className="eyebrow">Virtual buoy network</span><h2>Western Lake Erie</h2></div></div><div className="map-frame" ref={container} data-testid="maplibre-map" />
      <div className="buoy-summaries" aria-label="Select a virtual buoy">{buoys.map(site => <button className="buoy-summary" type="button" key={site.slug} aria-pressed={selected === site.slug} onClick={() => setSelected(site.slug)}><span className="buoy-summary-tag">VIRTUAL · SYNTHETIC</span><strong>{site.name}</strong></button>)}</div><p className="map-caption">Illustrative Essex County nearshore sites · Synthetic educational data only</p>
    </section>
    <section className="detail">{eventFrames && <span className="event-warning">SYNTHETIC EVENT · NOT CURRENT CONDITIONS</span>}<div className="detail-title-row"><h2>{buoy.name}</h2><span className="updated-ago">Updated {timestamp ? timeAgo(timestamp, ageClock) : latestStatus}</span></div>
      <ReadingCards rows={selectedRows} onSelect={k => { setKey(k); if (trends.current) trends.current.open = true; document.getElementById('history')?.scrollIntoView() }} />
    </section>
    </div>
    <details className="trends-disclosure" ref={trends}><summary>Explore The Trends</summary><section className="history" id="history"><span className="eyebrow">A closer look</span><h2>Explore the data</h2><p>Synthetic · educational. Select a parameter to follow its observations over time.</p><div className="history-controls"><label>Parameter <select value={key} onChange={e => setKey(e.target.value)}>{parameters.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label><fieldset><legend>Time range</legend>{['24h','3d','7d'].map(r => <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)}>{r === '24h' ? '24 h' : r === '3d' ? '3 d' : '7 d'}</button>)}</fieldset><button type="button" className="button button-primary" onClick={download} disabled={(!history.length && !eventFrames) || !!historyStatus}>Download CSV</button></div>
      <div className="chart-wrap"><h3>{parameter.label} · {parameter.unit === '1' ? 'relative' : parameter.unit}</h3>{historyStatus ? <p role="status">{historyStatus}</p> : <HistoryChart rows={visibleHistory} direction={parameter.direction} unit={parameter.unit} range={range} label={parameter.label}/>}</div>
      <div className="education"><div><h3>What is it?</h3><p>{education[key][0]}</p></div><div><h3>Why look at it?</h3><p>{education[key][1]}</p></div>{parameter.direction && <p>Bearings are clockwise from north: 0° N, 90° E, 180° S, 270° W. {parameter.direction === 'from' ? 'Direction describes where wind or waves come FROM.' : 'Direction describes where water moves TO.'} Points are shown without connecting lines to avoid a false swing across north.</p>}</div>
      <details><summary>View exact observations ({visibleHistory.length})</summary><div className="table-wrap"><table><thead><tr><th>Time (UTC)</th><th>Depth</th><th>Value</th></tr></thead><tbody>{visibleHistory.map(r => <tr key={`${r.observed_at}-${r.depth_m}`}><td>{new Date(r.observed_at).toISOString()}</td><td>{r.depth_m === null ? '—' : `${r.depth_m} m`}</td><td>{r.value} {parameter.unit === '1' ? 'relative' : parameter.unit}{parameter.direction ? ` ${compass(r.value)} ${parameter.direction.toUpperCase()}` : ''}</td></tr>)}</tbody></table></div></details>
    </section></details>
  </>
}
