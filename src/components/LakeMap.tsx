import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { buoys, catalogue } from '../simulation/catalogue'
import { supabase } from '../lib/supabase'

setWorkerUrl(mapLibreWorkerUrl)

const defaultStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm-raster', type: 'raster', source: 'openstreetmap' }],
}

type LatestReading = { buoy_slug: string; key: string; depth_m: number | null; value: number; observed_at: string }

function markerElement(slug: string, name: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'virtual-buoy-marker'
  button.setAttribute('aria-label', `${name}, virtual buoy`)
  button.title = `${name} · virtual / synthetic`
  button.textContent = slug[0].toUpperCase()
  return button
}

function detailsFor(slug: string, readings: LatestReading[]) {
  const latest = readings.filter((reading) => reading.buoy_slug === slug)
  const timestamp = latest.reduce<string | null>((value, reading) => !value || reading.observed_at > value ? reading.observed_at : value, null)
  const getValue = (key: string, depth: number | null) => latest.find((reading) => reading.key === key && reading.depth_m === depth)?.value
  const rows = [
    ['Water · 1 m', getValue('water_temperature', 1), '°C'],
    ['Current · 1 m', getValue('current_speed', 1), 'm/s'],
    ['Wind', getValue('wind_speed', null), 'm/s'],
  ]
  return { timestamp, rows }
}

export function LakeMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRefs = useRef<Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [readings, setReadings] = useState<LatestReading[]>([])
  const [dataStatus, setDataStatus] = useState('Loading latest synthetic observations')

  useEffect(() => {
    if (!containerRef.current) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: import.meta.env.VITE_MAP_STYLE_URL || defaultStyle,
      center: [-82.72, 41.99],
      zoom: 8.2,
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ showCompass: true }), 'top-right')
    mapRef.current = map
    map.once('load', () => {
      for (const site of buoys) {
        const marker = new Marker({ element: markerElement(site.slug, site.name), color: '#df965d' })
          .setLngLat([site.longitude, site.latitude])
          .addTo(map)
        markerRefs.current.push(marker)
      }
      setMapLoaded(true)
    })
    return () => {
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    let active = true
    const client = supabase
    if (!client) {
      setDataStatus('Configure Supabase to inspect latest readings')
      return () => { active = false }
    }
    const refresh = () => {
      client.from('latest_observations').select('buoy_slug,key,depth_m,value,observed_at').then(({ data, error }) => {
        if (!active) return
        if (error) setDataStatus('Latest readings are temporarily unavailable')
        else {
          setReadings((data ?? []) as LatestReading[])
          setDataStatus(data?.length ? 'Latest synthetic readings loaded · refreshes every minute' : 'Awaiting the first synthetic observations')
        }
      })
    }
    refresh()
    const intervalId = window.setInterval(refresh, 60_000)
    return () => { active = false; window.clearInterval(intervalId) }
  }, [])

  return (
    <section className="map-card" aria-label="Western Lake Erie virtual buoy map">
      <div className="map-heading">
        <div>
          <span className="eyebrow">Western basin · synthetic network</span>
          <h2>Three places to explore</h2>
          <p className="map-status-text">{dataStatus}</p>
        </div>
        <span className="map-status"><i className={mapLoaded ? 'ready' : ''} /> {mapLoaded ? 'Map ready' : 'Map initializing'}</span>
      </div>
      <div className="map-frame" ref={containerRef} data-testid="maplibre-map" />
      <div className="buoy-summaries">
        {buoys.map((site) => {
          const detail = detailsFor(site.slug, readings)
          return (
            <article className="buoy-summary" key={site.slug}>
              <span className="buoy-summary-tag">VIRTUAL · SYNTHETIC</span>
              <h3>{site.name}</h3>
              <time dateTime={detail.timestamp ?? undefined}>{detail.timestamp ? new Date(detail.timestamp).toLocaleString() : 'No observations yet'}</time>
              <div className="sample-values">
                {detail.rows.map(([label, value, unit]) => (
                  <span key={label}>{label}: {value === undefined ? '—' : Number(value).toFixed(1)} {unit}</span>
                ))}
              </div>
            </article>
          )
        })}
      </div>
      <p className="map-caption">Synthetic educational data only. Buoy positions are illustrative Essex County nearshore sites, not operational stations. CDOM is reported as a relative signal.</p>
      <span className="sr-only">{catalogue.length} virtual measurement channels are catalogued.</span>
    </section>
  )
}
