import { useEffect, useRef, useState } from 'react'
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(mapLibreWorkerUrl)

const fallbackStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'water-background',
      type: 'background',
      paint: { 'background-color': '#d9edf0' },
    },
  ],
}

export function LakeMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: import.meta.env.VITE_MAP_STYLE_URL || fallbackStyle,
      center: [-82.6, 41.7],
      zoom: 7,
      attributionControl: false,
      interactive: false,
    })
    mapRef.current = map
    map.once('load', () => setMapLoaded(true))

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <section className="map-card" aria-label="Lake Erie map preview">
      <div className="map-heading">
        <div>
          <span className="eyebrow">Western basin · map preview</span>
          <h2>Three places to explore</h2>
        </div>
        <span className="map-status"><i /> {mapLoaded ? 'Map ready' : 'Map initializing'}</span>
      </div>
      <div className="map-frame" ref={containerRef} data-testid="maplibre-map" />
      <p className="map-caption">Buoy locations and basemap will be finalized with the network in VBUOY-002.</p>
    </section>
  )
}
