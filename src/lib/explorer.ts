import { supabase } from './supabase'

export type Latest = { buoy_slug: string; key: string; depth_m: number | null; value: number; observed_at: string }
export type Observation = { depth_m: number | null; value: number; observed_at: string; provenance: string }
type Channel = { id: string; depth_m: number | null }
const client = () => { if (!supabase) throw new Error('Supabase is not configured'); return supabase }
export const compass = (angle: number) => ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round((((angle % 360) + 360) % 360) / 22.5) % 16]
export async function fetchLatest(): Promise<Latest[]> {
  const { data, error } = await client().from('latest_observations').select('buoy_slug,key,depth_m,value,observed_at')
  if (error) throw error
  return data as Latest[]
}
export async function fetchHistory(slug: string, key: string, since: string, until: string): Promise<Observation[]> {
  const db = client()
  const [b, p] = await Promise.all([db.from('buoys').select('id').eq('slug', slug).single(), db.from('parameters').select('id').eq('key', key).single()])
  if (b.error) throw b.error
  if (p.error) throw p.error
  const channels = await db.from('channels').select('id,depth_m').eq('buoy_id', b.data.id).eq('parameter_id', p.data.id)
  if (channels.error) throw channels.error
  const results = await Promise.all((channels.data as Channel[]).map(async channel => {
    const rows: Observation[] = []
    const size = 1000
    for (let offset = 0; ; offset += size) {
      const page = await db.from('observations').select('observed_at,value,provenance').eq('channel_id', channel.id).gte('observed_at', since).lte('observed_at', until).order('observed_at', { ascending: true }).range(offset, offset + size - 1)
      if (page.error) throw page.error
      rows.push(...page.data.map(row => ({ ...row, depth_m: channel.depth_m })))
      if (page.data.length < size) break
    }
    return rows
  }))
  return results.flat().sort((a,b) => a.observed_at.localeCompare(b.observed_at) || (a.depth_m ?? 0) - (b.depth_m ?? 0))
}
export function makeCsv(rows: Observation[], buoy: {slug: string; name: string}, parameter: {key: string; label: string; unit: string; direction?: string}) {
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const header = ['buoy_slug','buoy_name','parameter_key','parameter_name','depth_m','value','unit','direction_convention','observed_at','data_source']
  return [header, ...rows.map(r => [buoy.slug, buoy.name, parameter.key, parameter.label, r.depth_m, r.value, parameter.unit, parameter.direction, new Date(r.observed_at).toISOString(), r.provenance])].map(row => row.map(escape).join(',')).join('\r\n') + '\r\n'
}
