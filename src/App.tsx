import ApiSection from './components/ApiSection'
import { LakeMap } from './components/LakeMap'
import { isSupabaseConfigured } from './lib/supabase'

function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Virtual Buoys home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>virtual<span className="brand-light">buoys</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-active" href="#explore">Explore</a>
          <a href="#about">About</a>
          <a className="api-link" href="#api">API <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section className="hero" id="about">
        <div className="hero-copy">
          <span className="overline"><span className="live-dot" /> LAKE ERIE, IN MOTION</span>
          <h1>A little closer<br />to the <em>water.</em></h1>
          <p>Explore the rhythms of Lake Erie through a network of virtual buoys. Realistic data, made to learn from.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#explore">Explore the lake <span aria-hidden="true">↓</span></a>
            <span className="synthetic-note"><span aria-hidden="true">✳</span> Synthetic · educational</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun" />
          <div className="horizon" />
          <div className="lake-line line-one" />
          <div className="lake-line line-two" />
          <div className="lake-line line-three" />
          <div className="lake-line line-four" />
          <div className="art-label">WESTERN LAKE ERIE · CONCEPTUAL</div>
          <div className="art-buoy"><span className="buoy-top" /><span className="buoy-body" /><span className="buoy-base" /></div>
        </div>
      </section>

      <section className="intro-row" id="explore">
        <div>
          <span className="eyebrow">A living lake, made legible</span>
          <h2>Start with the big picture.</h2>
        </div>
        <p>Three virtual buoys will trace changing conditions across the western basin. Every reading is simulated, clearly labelled, and built for curious minds.</p>
      </section>

      <LakeMap />

      <ApiSection />

      <footer>
        <div className="footer-brand">A field guide for the curious.</div>
        <div className="footer-status"><span className={isSupabaseConfigured ? 'status-dot configured' : 'status-dot'} /> Supabase {isSupabaseConfigured ? 'configured' : 'environment not configured'}</div>
        <div className="footer-meta">All readings are synthetic · Not for operational use</div>
      </footer>
    </main>
  )
}

export default App
