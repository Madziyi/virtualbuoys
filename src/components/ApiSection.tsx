import { lazy, Suspense, useState } from 'react'
const Playground = lazy(() => import('./ApiPlayground'))
const base = 'https://dbsuryesimzatxhznurh.supabase.co/functions/v1/public-api'
const examples = {
  curl: `curl "${base}/v1/buoys/central/latest"`,
  JavaScript: `const response = await fetch(\n  "${base}/v1/buoys/central/observations?parameter=water_temperature&hours=24"\n)\nconst data = await response.json()`,
  Python: `import requests\n\ndata = requests.get(\n    "${base}/v1/buoys/central/observations",\n    params={"parameter": "water_temperature", "hours": 24},\n    timeout=15,\n).json()`,
}
export default function ApiSection() {
  const [open, setOpen] = useState(false)
  return <section id="api" className="api-section">
    <span className="eyebrow">For curious builders</span><h2>Bring the lake to your project.</h2>
    <p>Explore synthetic, educational readings updated every 10 minutes. History requests cover up to seven days.</p>
    <p>API base URL: <code className="api-base">{base}</code></p>
    <h3>Start with Central water temperature</h3><p>These examples use the public API without a key. The JavaScript and Python examples request the last 24 hours.</p>
    <div className="api-examples">{Object.entries(examples).map(([name, code]) => <div key={name}><div className="api-example-title"><strong>{name}</strong><button type="button" onClick={() => void navigator.clipboard.writeText(code)}>Copy</button></div><pre><code>{code}</code></pre></div>)}</div>
    <button className="button button-primary" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Close API playground' : 'Open API playground'}</button>
    {open && <Suspense fallback={<p>Loading API playground…</p>}><Playground /></Suspense>}
    <p><a href="#explore">← Back to the visual explorer</a></p>
  </section>
}
