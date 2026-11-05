import '@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { buoys } from './_shared/catalogue.ts'
import { advanceOneStep, createInitialState, GENERATOR_SEED, STEP_MS, type GeneratorState } from './_shared/generator.ts'

const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } })
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const secretKeyMap = Deno.env.get('SUPABASE_SECRET_KEYS')
  ? JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!) as Record<string, string>
  : {}
const serverKey = secretKeyMap.default ?? legacyServiceKey
if (!supabaseUrl || !serverKey) throw new Error('Supabase server credentials are missing from the Edge Function environment')
const supabase = createClient(supabaseUrl, serverKey, { auth: { persistSession: false, autoRefreshToken: false } })

export default {
  fetch: async (request: Request) => {
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405)
    const schedulerToken = request.headers.get('x-vbuoy-scheduler-token')
    if (!schedulerToken) return json({ error: 'Unauthorized' }, 401)
    const { data: isAuthorized, error: authError } = await supabase.rpc('validate_vbuoy_scheduler_token', { p_token: schedulerToken })
    if (authError || !isAuthorized) return json({ error: 'Unauthorized' }, 401)
    let body: { action?: string }
    try { body = await request.json() as { action?: string } }
    catch { return json({ error: 'A JSON action is required' }, 400) }
    if (body.action === 'initialize') {
      try {
        const { data: existing, error: stateError } = await supabase.from('generator_state').select('singleton').eq('singleton', 1).maybeSingle()
        if (stateError) throw stateError
        const { count, error: observationsError } = await supabase.from('observations').select('channel_id', { count: 'exact', head: true })
        if (observationsError) throw observationsError
        if (existing || count !== 0) return json({ error: 'The synthetic stream is already initialized' }, 409)
        const target = Math.floor(Date.now() / STEP_MS) * STEP_MS
        const firstAt = target - 7 * 24 * 60 * 60 * 1000
        const checkpointAt = firstAt - STEP_MS
        const state = createInitialState(GENERATOR_SEED, new Date(checkpointAt).toISOString())
        state.backfillFirstAt = new Date(firstAt).toISOString()
        state.backfillThroughAt = new Date(target).toISOString()
        const { error: insertError } = await supabase.from('generator_state').insert({
          singleton: 1,
          seed: GENERATOR_SEED,
          generator_version: 1,
          last_observed_at: new Date(checkpointAt).toISOString(),
          state_json: state,
        })
        if (insertError) throw insertError
        return json({ ok: true, initialized: true, seed: GENERATOR_SEED, first_observation_at: state.backfillFirstAt, backfill_through_at: state.backfillThroughAt })
      } catch (error) {
        console.error('virtual buoy initialization failed', error)
        return json({ ok: false, error: 'Initialization failed; see Edge Function logs.' }, 500)
      }
    }
    if (body.action !== 'advance' && body.action !== 'backfill') return json({ error: 'Unknown action' }, 400)
    const now = Date.now()
    let target = Math.floor(now / STEP_MS) * STEP_MS
    let committed = 0
    let lastObservedAt: string | null = null

    try {
      const initial = await supabase.from('generator_state').select('seed,generator_version,last_observed_at,state_json').eq('singleton', 1).single()
      if (initial.error || !initial.data) throw initial.error ?? new Error('generator state is missing')
      let row = initial.data
      if (body.action === 'backfill') {
        const state = row.state_json as GeneratorState
        if (!state.backfillFirstAt || !state.backfillThroughAt || state.seed !== GENERATOR_SEED) return json({ error: 'No bounded initial backfill is available' }, 409)
        target = Date.parse(state.backfillThroughAt)
      }
      for (let attempt = 0; attempt < (body.action === 'backfill' ? 100 : 100); attempt += 1) {
        const data = row
        if (data.generator_version !== 1) throw new Error('unsupported generator version')
        lastObservedAt = data.last_observed_at
        const expectedAt = Date.parse(data.last_observed_at)
        if (expectedAt >= target) break

        const nextAt = new Date(expectedAt + STEP_MS).toISOString()
        const generated = advanceOneStep(data.state_json as GeneratorState, nextAt)
        const observations = generated.observations.map((row) => ({
          buoy_slug: row.buoySlug,
          parameter_key: row.key,
          depth_m: row.depthM,
          value: row.value,
        }))
        const { data: didCommit, error: commitError } = await supabase.rpc('commit_simulation_step', {
          p_expected_at: data.last_observed_at,
          p_next_at: nextAt,
          p_state: generated.state,
          p_observations: observations,
        })
        if (commitError) throw commitError
        if (didCommit) {
          committed += 1
          lastObservedAt = nextAt
          row = { ...data, last_observed_at: nextAt, state_json: generated.state }
        } else {
          // A concurrent invocation may have won the compare-and-swap. Reload on the next loop.
          const refreshed = await supabase.from('generator_state').select('seed,generator_version,last_observed_at,state_json').eq('singleton', 1).single()
          if (refreshed.error || !refreshed.data) throw refreshed.error ?? new Error('generator state is missing')
          row = refreshed.data
          continue
        }
      }

      return json({ ok: true, committed, latest_observed_at: lastObservedAt, buoy_count: buoys.length })
    } catch (error) {
      console.error('virtual buoy advancement failed', error)
      return json({ ok: false, committed, error: 'Advancement failed; see Edge Function logs.' }, 500)
    }
  },
}
