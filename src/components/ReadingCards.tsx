import type { ReactNode } from 'react'
import { catalogue } from '../simulation/catalogue'
import { compass, type Latest } from '../lib/explorer'

const icons: Record<string, ReactNode> = {
  temperature: <><path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 10v7"/></>,
  pressure: <><path d="M4 19a9 9 0 1 1 16 0Z"/><path d="m12 14 4-4M8 16h.01M16 16h.01"/></>,
  wind: <><path d="M3 8h11a3 3 0 1 0-3-3M2 12h17a2 2 0 1 1-2 2M4 16h7a3 3 0 1 1-3 3"/></>,
  wave: <><path d="M2 10c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 16c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/></>,
  direction: <><circle cx="12" cy="12" r="9"/><path d="m16 8-2.3 5.7L8 16l2.3-5.7L16 8Z"/></>,
  speed: <><path d="M4 19a9 9 0 1 1 16 0Z"/><path d="m12 15 4-5"/><circle cx="12" cy="15" r="1"/></>,
  water: <path d="M12 3s-6 6.4-6 10.3a6 6 0 0 0 12 0C18 9.4 12 3 12 3Z"/>,
  biology: <><path d="M9 3h6M10 3v6l-5 8.5A2.3 2.3 0 0 0 7 21h10a2.3 2.3 0 0 0 2-3.5L14 9V3M8 15h8"/></>,
  time: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
}
function iconFor(key: string) {
  if (key.includes('temperature')) return icons.temperature
  if (key.includes('pressure') || key.includes('saturation')) return icons.pressure
  if (key.includes('direction')) return icons.direction
  if (key.includes('wind')) return icons.wind
  if (key.includes('period')) return icons.time
  if (key.includes('wave')) return icons.wave
  if (key.includes('speed')) return icons.speed
  if (key === 'chlorophyll' || key === 'phycocyanin') return icons.biology
  return icons.water
}
function format(value: number, unit: string, direction?: string) {
  return direction ? `${value.toFixed(1)}° ${compass(value)} ${direction.toUpperCase()}` : `${value.toFixed(2)} ${unit === '1' ? 'relative' : unit}`
}
export function ReadingCards({ rows, onSelect }: { rows: Latest[]; onSelect: (key: string) => void }) {
  const depths = [...new Set(catalogue.map(item => item.depthM).filter((depth): depth is number => depth !== null))].sort((a, b) => a - b)
  const sections = [{ label: 'Weather & surface', depth: null }, ...depths.map(depth => ({ label: `${depth} m depth`, depth }))]
  return <div className="measurement-sections">{sections.map(({ label, depth }) => <section className="measurement-section" key={label}>
    <div className="measurement-section-heading"><h3>{label}</h3><span>{depth === null ? 'Above water & waves' : 'Below the surface'}</span></div>
    <div className="measurement-grid">{catalogue.filter(item => item.depthM === depth).map(item => {
      const reading = rows.find(row => row.key === item.key && row.depth_m === depth)
      return <button className="measurement-card" type="button" key={`${item.key}-${depth}`} onClick={() => onSelect(item.key)} aria-label={`${item.label}, ${label}: ${reading ? format(reading.value, item.unit, item.direction) : 'unavailable'}. View trend`}>
        <span className="measurement-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconFor(item.key)}</svg></span>
        <span className="measurement-copy"><span className="measurement-label">{item.label}</span><strong>{reading ? format(reading.value, item.unit, item.direction) : '—'}</strong></span>
        <span className="measurement-arrow" aria-hidden="true">↗</span>
      </button>
    })}</div>
  </section>)}</div>
}
