import { readFile } from 'node:fs/promises'

const projectUrl = 'https://dbsuryesimzatxhznurh.supabase.co'
const tokenLine = (await readFile('.env.scheduler.local', 'utf8')).split(/\r?\n/).find((line) => line.startsWith('VBUOY_SCHEDULER_TOKEN='))
const token = tokenLine?.slice('VBUOY_SCHEDULER_TOKEN='.length)
if (!token || !/^[0-9a-f]{64}$/.test(token)) throw new Error('Missing valid local scheduler token file')
const endpoint = `${projectUrl}/functions/v1/advance-virtual-buoys`

async function call(action) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vbuoy-scheduler-token': token },
    body: JSON.stringify({ action }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`${action} returned ${response.status}: ${JSON.stringify(result)}`)
  return result
}

const initialized = await call('initialize')
console.log(JSON.stringify(initialized))
if (!initialized.initialized) throw new Error('Unexpected stream initialization result')
let total = 0
for (let callNumber = 0; callNumber < 12; callNumber += 1) {
  const result = await call('backfill')
  total += result.committed
  console.log(JSON.stringify({ call: callNumber + 1, committed_this_call: result.committed, total_committed: total, latest_observed_at: result.latest_observed_at }))
  if (result.latest_observed_at === initialized.backfill_through_at) break
}
if (total !== 1009) throw new Error(`Expected 1009 synthetic steps, committed ${total}`)
