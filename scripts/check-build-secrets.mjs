import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
const text = await readFile('.env.local', 'utf8')
const vars = Object.fromEntries(text.split(/\r?\n/).filter(line => line.includes('=') && !line.trim().startsWith('#')).map(line => { const i=line.indexOf('='); return [line.slice(0,i), line.slice(i+1).trim().replace(/^['"]|['"]$/g,'')] }))
const key = vars.VITE_SUPABASE_PUBLISHABLE_KEY
if (vars.VITE_SUPABASE_URL !== 'https://dbsuryesimzatxhznurh.supabase.co' || !key) throw new Error('Expected public project URL and key are not configured')
if (!key.startsWith('sb_publishable_')) {
  let claims; try { claims=JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()) } catch { throw new Error('Unrecognized public key format') }
  if (claims.role !== 'anon' || claims.ref !== 'dbsuryesimzatxhznurh') throw new Error('Configured key is not the expected anonymous project key')
}
const suspicious = []
async function walk(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name)
    if(entry.isDirectory()) { await walk(file); continue }
    const data=await readFile(file,'utf8')
    if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(data)) suspicious.push(`${file}: secret key pattern`)
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(data)) suspicious.push(`${file}: private key`)
    if (/AKIA[0-9A-Z]{16}/.test(data)) suspicious.push(`${file}: AWS key pattern`)
    for (const token of data.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) ?? []) {
      try { const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()); if (claims.role === 'service_role') suspicious.push(`${file}: service-role JWT`) } catch { /* not a JWT */ }
    }
    for (const [name,value] of Object.entries(vars)) if (/service.role|secret|scheduler|token|private/i.test(name) && value.length >= 16 && data.includes(value)) suspicious.push(`${file}: privileged local environment value`)
  }
}
await walk('dist')
if (suspicious.length) { console.error(suspicious.join('\n')); process.exit(1) }
console.log('Frontend uses the expected public Supabase URL and publishable/anon key; no privileged local values, service-role JWTs, secret-key, private-key or AWS-key patterns found in dist.')
console.log('Pattern and locally available value scan cannot prove absence of unknown secrets.')
