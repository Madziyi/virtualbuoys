import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const config = Object.fromEntries((await readFile('.env.local', 'utf8'))
  .split(/\r?\n/)
  .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
  .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]))
const url = config.VITE_SUPABASE_URL
const key = config.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Missing public Supabase configuration in ignored .env.local')

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const { data: latest, error: readError } = await supabase.from('latest_observations').select('buoy_slug,key,value,observed_at')
if (readError) throw readError
if (latest?.length !== 69) throw new Error(`Expected 69 public latest rows, got ${latest?.length ?? 0}`)

const { data: channel, error: channelError } = await supabase.from('channels').select('id').limit(1).single()
if (channelError || !channel) throw channelError ?? new Error('No public channel to use for write-boundary check')
const { error: writeError } = await supabase.from('observations').insert({
  channel_id: channel.id,
  observed_at: '2099-01-01T00:00:00.000Z',
  value: 1,
})
if (!writeError) throw new Error('Publishable client unexpectedly inserted a permanent observation')

const { error: stateError } = await supabase.from('generator_state').select('*').limit(1)
if (!stateError) throw new Error('Generator state unexpectedly accessible')

const functionResponse = await fetch(`${url}/functions/v1/advance-virtual-buoys`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'advance' }),
})
if (functionResponse.status !== 401) throw new Error(`Publishable Edge Function invocation returned ${functionResponse.status}, expected 401`)

console.log(JSON.stringify({
  publicLatestRows: latest.length,
  publicBuoys: [...new Set(latest.map((row) => row.buoy_slug))].sort(),
  generatorStateInaccessible: true,
  observationInsertRejected: true,
  insertErrorCode: writeError.code,
  unauthenticatedFunctionStatus: functionResponse.status,
}))
