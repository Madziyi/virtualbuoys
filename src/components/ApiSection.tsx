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
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState('')
  async function copyExample(name: string, code: string) {
    try { await navigator.clipboard.writeText(code); setCopied(name); setCopyError('') }
    catch { setCopied(''); setCopyError('Could not copy automatically. Select the example text to copy it.') }
  }
  return <section id="api" className="api-section">
    <div className="api-intro">
      <div><span className="eyebrow">Explore beyond the map</span><h2>Bring the lake to your project.</h2>
        <p className="api-lede">An API is a way for one program to ask another for information. Ours lets you use the same virtual buoy readings in a spreadsheet, a class project, or an app of your own.</p>
      </div>
      <div className="api-facts"><span className="api-facts-icon" aria-hidden="true">↗</span><div><strong>Made for learning</strong><p>All readings are synthetic, update every 10 minutes, and are not for operational use.</p></div></div>
    </div>
    <div className="api-guide">
      <div className="api-guide-heading"><div><span className="eyebrow">No experience needed</span><h3>Try a request</h3></div><span className="api-guide-badge">No account or key required</span></div>
      <p>The playground lets you ask for data and see the answer right here. You don’t need to write code to try it.</p>
      <ol className="api-steps"><li><span>1</span><div><strong>Open the playground</strong><small>Choose a request from the list.</small></div></li><li><span>2</span><div><strong>Try it out</strong><small>Fill in any fields, then select Execute.</small></div></li><li><span>3</span><div><strong>See the response</strong><small>The results appear below the request.</small></div></li></ol>
      <p className="api-first-example"><strong>Good first request:</strong> choose <code>GET /v1/buoys</code> to see the three virtual buoys. For measurements, choose the observations request and try <code>central</code>, <code>water_temperature</code>, and <code>24</code> hours. History covers up to seven days.</p>
      <button className="button button-primary api-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="api-playground">{open ? 'Close API playground' : 'Open API playground'} <span aria-hidden="true">{open ? '↑' : '↓'}</span></button>
      {open && <div id="api-playground"><Suspense fallback={<p role="status">Loading API playground…</p>}><Playground /></Suspense></div>}
    </div>
    <div className="api-code-section"><span className="eyebrow">Ready to build?</span><h3>Use the data in your own code</h3><p>These examples use the public API without a key. JavaScript and Python request Central water temperature for the last 24 hours.</p>
      <div className="api-endpoint"><span>Base URL</span><code className="api-base">{base}</code></div>
      <div className="api-examples">{Object.entries(examples).map(([name, code]) => <div key={name}><div className="api-example-title"><strong>{name}</strong><button type="button" onClick={() => void copyExample(name, code)}>{copied === name ? 'Copied' : 'Copy'}</button></div><pre><code>{code}</code></pre></div>)}</div>
      {copyError && <p role="status">{copyError}</p>}
    </div>
    <p className="api-back"><a href="#explore">← Back to the visual explorer</a></p>
  </section>
}
