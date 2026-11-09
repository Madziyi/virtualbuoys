import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReadingCards } from './ReadingCards'

describe('depth-grouped readings', () => {
  it('places each reading at its depth and keeps trend actions available', () => {
    const select = vi.fn()
    render(<ReadingCards rows={[
      { buoy_slug: 'west', key: 'water_temperature', depth_m: 1, value: 10.26, observed_at: '2026-11-09T00:00:00Z' },
      { buoy_slug: 'west', key: 'water_temperature', depth_m: 8, value: 10.35, observed_at: '2026-11-09T00:00:00Z' },
      { buoy_slug: 'west', key: 'wind_direction', depth_m: null, value: 354.8, observed_at: '2026-11-09T00:00:00Z' },
    ]} onSelect={select} />)
    const shallow = screen.getByRole('heading', { name: '1 m depth' }).closest('section')!
    const deep = screen.getByRole('heading', { name: '8 m depth' }).closest('section')!
    expect(within(shallow).getByText('10.26 °C')).toBeInTheDocument()
    expect(within(deep).getByText('10.35 °C')).toBeInTheDocument()
    expect(screen.getByText('354.8° N FROM')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '2 m depth' })).toBeInTheDocument()
    fireEvent.click(within(deep).getByRole('button', { name: /water temperature/i }))
    expect(select).toHaveBeenCalledWith('water_temperature')
  })
})
