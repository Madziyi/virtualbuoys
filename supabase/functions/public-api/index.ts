import { ApiError, compass, range } from './core.ts'
type Buoy = { id: string; slug: string; name: string; description: string; latitude: number; longitude: number }
type Param = { id: string; key: string; display_name: string; description: string; unit_symbol: string; is_relative: boolean; direction_convention: string | null }
type Channel = { id: string; buoy_id: string; parameter_id: string; depth_m: number | null }
type Reading = { observed_at: string; value: number; depth_m: number | null; key: string }
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Content-Type': 'application/json; charset=utf-8' }
const url = Deno.env.get('SUPABASE_URL')!
const key = Deno.env.get('SUPABASE_ANON_KEY')!
async function read(table: string, query: URLSearchParams, offset?: number) {
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}`, ...(offset === undefined ? {} : { Range: `${offset}-${offset + 999}` }) } })
  if (!res.ok) throw new Error('Data unavailable')
  return await res.json()
}
const select = (s: string) => new URLSearchParams({ select: s })
const publicBuoy = (b: Buoy) => ({ slug: b.slug, name: b.name, description: b.description, latitude: b.latitude, longitude: b.longitude })
const publicParam = (p: Param, depths: (number | null)[]) => ({ key: p.key, name: p.display_name, description: p.description, unit: p.unit_symbol, relative: p.is_relative, direction_convention: p.direction_convention, depths_m: depths.filter((d): d is number => d !== null).map(Number) })
const value = (r: Reading, p: Param) => ({ observed_at: r.observed_at, depth_m: r.depth_m === null ? null : Number(r.depth_m), value: r.value, unit: p.unit_symbol, ...(p.direction_convention ? { compass: compass(r.value), direction_convention: p.direction_convention } : {}) })
Deno.serve(async (req: Request) => {
  const response = (data: unknown, status = 200, cache = 'no-store') => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Cache-Control': cache, ...(status === 405 ? { Allow: 'GET, OPTIONS' } : {}) } })
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (req.method !== 'GET') throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Only GET and OPTIONS are supported.')
    const u = new URL(req.url), path = u.pathname.replace(/^.*?\/public-api/, '').replace(/\/$/, '')
    if (path === '/v1/health') return response({ status: 'ok', service: 'virtual-buoys', api_version: 'v1', data_source: 'synthetic' }, 200, 'public, max-age=30')
    const match = path.match(/^\/v1\/buoys\/([^/]+)(?:\/(latest|observations))?$/)
    if (!['/v1/buoys','/v1/parameters'].includes(path) && !match) throw new ApiError(404, 'NOT_FOUND', 'Route not found.')
    const [buoys, params, channels] = await Promise.all([read('buoys', select('id,slug,name,description,latitude,longitude')), read('parameters', select('id,key,display_name,description,unit_symbol,is_relative,direction_convention')), read('channels', select('id,buoy_id,parameter_id,depth_m'))])
    const meta = (p: Param, cs: Channel[]) => publicParam(p, [...new Set<number | null>(cs.filter(c => c.parameter_id === p.id).map(c => c.depth_m === null ? null : Number(c.depth_m)))].sort((a,b) => (a ?? 0) - (b ?? 0)))
    if (path === '/v1/buoys') return response({ data_source: 'synthetic', buoys: buoys.map(publicBuoy) }, 200, 'public, max-age=3600')
    if (path === '/v1/parameters') return response({ data_source: 'synthetic', parameters: params.map((p: Param) => meta(p, channels)) }, 200, 'public, max-age=3600')
    const buoy = buoys.find((b: Buoy) => b.slug === match![1])
    if (!buoy) throw new ApiError(404, 'INVALID_BUOY', 'Unknown buoy.')
    const cs = channels.filter((c: Channel) => c.buoy_id === buoy.id)
    if (!match![2]) return response({ data_source: 'synthetic', buoy: publicBuoy(buoy), parameters: params.filter((p: Param) => cs.some((c: Channel) => c.parameter_id === p.id)).map((p: Param) => meta(p, cs)) }, 200, 'public, max-age=3600')
    if (match![2] === 'latest') {
      const q = select('key,depth_m,value,observed_at'); q.set('buoy_slug', `eq.${buoy.slug}`)
      const rows = await read('latest_observations', q)
      return response({ data_source: 'synthetic', buoy: publicBuoy(buoy), observations: rows.map((r: Reading) => { const p = params.find((p: Param) => p.key === r.key); return { parameter: meta(p, cs), ...value(r,p) } }) }, 200, 'public, max-age=60')
    }
    const name = u.searchParams.get('parameter')
    if (!name) throw new ApiError(400, 'INVALID_PARAMETER', 'Parameter is required.')
    const p = params.find((p: Param) => p.key === name)
    if (!p) throw new ApiError(404, 'INVALID_PARAMETER', 'Unknown parameter.')
    const window = range(u.searchParams), depth = u.searchParams.get('depth_m')
    let selected = cs.filter((c: Channel) => c.parameter_id === p.id)
    if (depth !== null) {
      if (!depth.trim() || !Number.isFinite(Number(depth))) throw new ApiError(400, 'INVALID_DEPTH', 'Depth must be a number.')
      selected = selected.filter((c: Channel) => c.depth_m !== null && Number(c.depth_m) === Number(depth))
      if (!selected.length) throw new ApiError(404, 'INVALID_DEPTH', 'Depth is unavailable for this parameter.')
    }
    const pages = await Promise.all(selected.map(async (c: Channel) => {
      const q = select('observed_at,value'); q.set('channel_id', `eq.${c.id}`); q.append('observed_at', `gte.${window.start}`); q.append('observed_at', `lte.${window.end}`); q.set('order', 'observed_at.asc')
      const all = []; for (let offset = 0; ; offset += 1000) { const rows = await read('observations', q, offset); all.push(...rows.map((r: Reading) => value({ ...r, depth_m: c.depth_m }, p))); if (rows.length < 1000) break }
      return all
    }))
    const observations = pages.flat().sort((a: { observed_at: string; depth_m: number | null },b: { observed_at: string; depth_m: number | null }) => a.observed_at.localeCompare(b.observed_at) || (a.depth_m ?? 0) - (b.depth_m ?? 0))
    return response({ data_source: 'synthetic', buoy: publicBuoy(buoy), parameter: meta(p, cs), range: window, observations }, 200, 'public, max-age=60')
  } catch (e) {
    if (e instanceof ApiError) return response({ error: { code: e.code, message: e.message, details: null } }, e.status)
    return response({ error: { code: 'INTERNAL_ERROR', message: 'The service is temporarily unavailable.', details: null } }, 500)
  }
})
