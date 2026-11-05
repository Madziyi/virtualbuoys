import { describe, expect, it } from 'vitest'
import { compass, range } from '../../supabase/functions/public-api/core'
describe('public API validation', () => {
  it('uses a bounded 24 hour default and accepts seven days', () => {
    expect(Date.parse(range(new URLSearchParams(), 1000000000).end) - Date.parse(range(new URLSearchParams(), 1000000000).start)).toBe(86400000)
    expect(() => range(new URLSearchParams('hours=168'))).not.toThrow()
  })
  it('rejects oversized, malformed and conflicting windows', () => {
    for (const query of ['hours=169','hours=0','hours=1&start=2026-01-01T00:00:00Z','start=2026-01-01T00:00:00Z','start=bad&end=bad']) expect(() => range(new URLSearchParams(query))).toThrow()
  })
  it('converts bearings across north', () => { expect(compass(69)).toBe('ENE'); expect(compass(360)).toBe('N'); expect(compass(-90)).toBe('W') })
})
