import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./components/LakeMap', () => ({
  LakeMap: () => (
    <section aria-label="Lake Erie map preview">
      <div data-testid="maplibre-map" />
      <p>Buoy locations and basemap will be finalized with the network in VBUOY-002.</p>
    </section>
  ),
}))

describe('foundation shell', () => {
  it('labels the experience as synthetic and educational', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /explore the lake/i })).toBeInTheDocument()
    expect(screen.getByText(/synthetic · educational/i)).toBeInTheDocument()
    expect(screen.getAllByText(/all readings are synthetic/i).length).toBeGreaterThan(0)
  })

  it('provides an accessible MapLibre canvas placeholder', () => {
    render(<App />)

    expect(screen.getByTestId('maplibre-map')).toBeInTheDocument()
    expect(screen.getByText(/locations and basemap will be finalized/i)).toBeInTheDocument()
  })
})
