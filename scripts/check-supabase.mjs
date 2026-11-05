import { readFile } from 'node:fs/promises'

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    }),
)

const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key || key.includes('replace_me')) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')
}

const response = await fetch(new URL('/rest/v1/virtual_buoys?select=id&limit=0', url), {
  headers: { apikey: key, accept: 'application/json' },
})

if (response.status === 404) {
  const result = await response.json()
  if (result.code !== 'PGRST205') {
    throw new Error(`Supabase REST request returned unexpected HTTP 404 (${result.code ?? 'no code'})`)
  }
  console.log('Supabase REST reachable (HTTP 404); proposed virtual_buoys table is not created yet.')
} else if (response.ok) {
  console.log(`Supabase REST reachable (HTTP ${response.status}); zero-row request completed.`)
} else {
  throw new Error(`Supabase REST request returned HTTP ${response.status}`)
}
